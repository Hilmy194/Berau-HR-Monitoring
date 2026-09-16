#!/usr/bin/env python3
"""Mirror every table/view in a BigQuery dataset into PostgreSQL without renaming source fields.

The destination is the ``bq_raw`` PostgreSQL schema. Each BigQuery table/view
becomes a table with the same name and column names. Nested and repeated BQ
fields are preserved as JSONB; scalar fields use their nearest PostgreSQL type.

This is a raw landing zone. Application read models may query it, but this
script deliberately does not manufacture or enrich HR data.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    from google.cloud import bigquery
    from google.oauth2 import service_account
    import psycopg
    from psycopg.types.json import Jsonb
except ImportError as error:
    raise SystemExit(
        "Missing dependency. Run: py -3 -m pip install -r scripts/requirements-bigquery-sync.txt"
    ) from error


IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
PROJECT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{4,61}[A-Za-z0-9]$")
RAW_SCHEMA = "bq_raw"


def read_config(path: Path) -> dict[str, str]:
    if not path.is_file():
        raise ValueError(f"Config file not found: {path}")
    config: dict[str, str] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"Invalid config line {line_number}: expected KEY=VALUE")
        key, value = line.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"Invalid config line {line_number}: key is empty")
        config[key] = value.strip().strip('"').strip("'")
    return config


def required(config: dict[str, str], key: str) -> str:
    value = config.get(key) or os.environ.get(key)
    if not value:
        raise ValueError(f"{key} is required (set it in the config file or environment)")
    return value


def resolve_project(config: dict[str, str], credential_file: Path) -> str:
    project = config.get("BQ_PROJECT_ID") or os.environ.get("BQ_PROJECT_ID")
    if not project:
        project = json.loads(credential_file.read_text(encoding="utf-8")).get("project_id")
    if not isinstance(project, str) or not PROJECT_ID.fullmatch(project):
        raise ValueError("BQ_PROJECT_ID is missing or invalid")
    return project


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def validate_dataset(value: str) -> str:
    if not IDENTIFIER.fullmatch(value):
        raise ValueError("BQ_DATASET must be a valid BigQuery dataset identifier")
    return value


def psycopg_database_url(value: str) -> str:
    """Prisma accepts ?schema=public, while libpq/psycopg does not."""
    parsed = urlsplit(value)
    query = urlencode([(key, item) for key, item in parse_qsl(parsed.query, keep_blank_values=True) if key != "schema"])
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, parsed.fragment))


def postgres_type(field: bigquery.SchemaField) -> str:
    if field.mode == "REPEATED" or field.field_type in {"RECORD", "STRUCT"}:
        return "JSONB"
    return {
        "STRING": "TEXT",
        "INTEGER": "BIGINT",
        "INT64": "BIGINT",
        "FLOAT": "DOUBLE PRECISION",
        "FLOAT64": "DOUBLE PRECISION",
        "NUMERIC": "NUMERIC",
        "BIGNUMERIC": "NUMERIC",
        "BOOLEAN": "BOOLEAN",
        "BOOL": "BOOLEAN",
        "DATE": "DATE",
        "DATETIME": "TIMESTAMP",
        "TIMESTAMP": "TIMESTAMPTZ",
        "TIME": "TIME",
        "BYTES": "BYTEA",
        "GEOGRAPHY": "TEXT",
        "JSON": "JSONB",
    }.get(field.field_type, "TEXT")


def json_safe(value: Any) -> Any:
    if isinstance(value, bytes):
        return {"base64": base64.b64encode(value).decode("ascii")}
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    return value


def prepare_value(value: Any, field: bigquery.SchemaField) -> Any:
    if value is None:
        return None
    if field.mode == "REPEATED" or field.field_type in {"RECORD", "STRUCT", "JSON"}:
        return Jsonb(json_safe(value))
    return value


def create_or_extend_table(cursor: psycopg.Cursor[Any], table_name: str, fields: list[bigquery.SchemaField]) -> None:
    table = f"{quote_identifier(RAW_SCHEMA)}.{quote_identifier(table_name)}"
    columns = ", ".join(f"{quote_identifier(field.name)} {postgres_type(field)}" for field in fields)
    cursor.execute(f"CREATE TABLE IF NOT EXISTS {table} ({columns})")

    existing = {
        row[0]: row[1]
        for row in cursor.execute(
            """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            """,
            (RAW_SCHEMA, table_name),
        )
    }
    for field in fields:
        if field.name not in existing:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {quote_identifier(field.name)} {postgres_type(field)}")


def copy_table(client: bigquery.Client, connection: psycopg.Connection[Any], project: str, dataset: str, table_ref: bigquery.table.TableListItem) -> int:
    source = client.get_table(f"{project}.{dataset}.{table_ref.table_id}")
    fields = list(source.schema)
    if not fields:
        print(f"Skipping {table_ref.table_id}: no columns")
        return 0

    source_ref = f"`{project}.{dataset}.{table_ref.table_id}`"
    result = client.query(f"SELECT * FROM {source_ref}").result()
    columns = ", ".join(quote_identifier(field.name) for field in fields)
    target = f"{quote_identifier(RAW_SCHEMA)}.{quote_identifier(table_ref.table_id)}"
    copied = 0

    with connection.transaction():
        with connection.cursor() as cursor:
            create_or_extend_table(cursor, table_ref.table_id, fields)
            cursor.execute(f"TRUNCATE TABLE {target}")
            with cursor.copy(f"COPY {target} ({columns}) FROM STDIN") as copy:
                for row in result:
                    copy.write_row(tuple(prepare_value(row[field.name], field) for field in fields))
                    copied += 1
    print(f"{table_ref.table_id}: {copied} rows copied")
    return copied


def optimize_hr_reads(connection: psycopg.Connection[Any]) -> None:
    """Keep source-key indexes after raw refreshes and update query statistics."""
    indexes = {
        "p_emps": "CREATE INDEX IF NOT EXISTS bq_raw_p_emps_personnel_period_idx ON bq_raw.p_emps ((btrim(personnel_number)), data_period DESC)",
        "p_talent_profile": "CREATE INDEX IF NOT EXISTS bq_raw_p_talent_personnel_year_idx ON bq_raw.p_talent_profile ((btrim(personnel_number)), talent_year DESC)",
        "p_career_history": "CREATE INDEX IF NOT EXISTS bq_raw_p_career_personnel_idx ON bq_raw.p_career_history ((btrim(personnel_number)))",
        "p_assessment_history": "CREATE INDEX IF NOT EXISTS bq_raw_p_assessment_personnel_date_idx ON bq_raw.p_assessment_history ((btrim(personnel_number)), assesment_date DESC)",
        "p_dp_history": "CREATE INDEX IF NOT EXISTS bq_raw_p_dp_personnel_year_idx ON bq_raw.p_dp_history ((btrim(personnel_number)), dp_program_year DESC)",
    }
    with connection.cursor() as cursor:
        existing = {
            row[0]
            for row in cursor.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
                (RAW_SCHEMA,),
            )
        }
        for table_name, statement in indexes.items():
            if table_name in existing:
                cursor.execute(statement)
                cursor.execute(f"ANALYZE {quote_identifier(RAW_SCHEMA)}.{quote_identifier(table_name)}")
    connection.commit()
    print("HR raw read indexes and query statistics updated.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Raw-copy all BigQuery dataset tables into PostgreSQL.")
    parser.add_argument("config_path", nargs="?", type=Path, help="BQ KEY=VALUE config file stored outside the repository")
    parser.add_argument("--config", type=Path, help="BQ KEY=VALUE config file stored outside the repository")
    parser.add_argument("--database-url", help="Destination PostgreSQL URL; defaults to BQ_RAW_DATABASE_URL or DATABASE_URL")
    args = parser.parse_args()

    try:
        config_path = args.config or args.config_path
        if not config_path:
            raise ValueError("config path is required")
        config = read_config(config_path.expanduser())
        credentials_path = Path(required(config, "BQ_SERVICE_ACCOUNT_FILE")).expanduser()
        if not credentials_path.is_file():
            raise ValueError(f"Service-account JSON not found: {credentials_path}")
        project = resolve_project(config, credentials_path)
        dataset = validate_dataset(required(config, "BQ_DATASET"))
        database_url = args.database_url or config.get("BQ_RAW_DATABASE_URL") or os.environ.get("BQ_RAW_DATABASE_URL") or os.environ.get("DATABASE_URL")
        if not database_url:
            raise ValueError("BQ_RAW_DATABASE_URL or DATABASE_URL is required for the PostgreSQL destination")

        credentials = service_account.Credentials.from_service_account_file(str(credentials_path))
        client = bigquery.Client(project=project, credentials=credentials)
        tables = [item for item in client.list_tables(dataset) if item.table_type in {"TABLE", "VIEW", "MATERIALIZED_VIEW"}]
        if not tables:
            raise ValueError(f"No tables or views found in {project}.{dataset}")

        print(f"Mirroring {len(tables)} BigQuery objects into PostgreSQL schema {RAW_SCHEMA}...")
        total_rows = 0
        with psycopg.connect(psycopg_database_url(database_url)) as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {quote_identifier(RAW_SCHEMA)}")
            connection.commit()
            for table in sorted(tables, key=lambda item: item.table_id):
                total_rows += copy_table(client, connection, project, dataset, table)
            optimize_hr_reads(connection)
        print(f"Raw BigQuery mirror completed: {len(tables)} objects, {total_rows} rows.")
        return 0
    except Exception as error:
        message = str(error).strip() or repr(error)
        print(f"Raw BigQuery mirror failed ({type(error).__name__}): {message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
