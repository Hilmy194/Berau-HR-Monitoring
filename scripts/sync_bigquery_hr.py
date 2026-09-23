#!/usr/bin/env python3
"""Export approved HR views from BigQuery and import them into Harmoni.

Example:
    py -3 scripts/sync_bigquery_hr.py --config C:\\secure\\bq-hr-sync.env
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime, time, timezone
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
PROJECT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9-]{4,61}[A-Za-z0-9]$")

EMPLOYEE_COLUMNS = """
  data_period, global_personnel_number, personnel_number, employee_name,
  date_of_birth, gender, hiring_date, join_date, company, personnel_area,
  personnel_subarea, employee_group, ps_level, layer, work_contract,
  end_of_contract, position_name, business_unit, direktorat, divisi,
  department, supervisor_nik, supervisor_name, office_email, hrbp_name,
  position_type, job_family, stem, value_chain, job_characteristics,
  job_grouping, critical_position, c_level, old_personnel_number
"""
TALENT_COLUMNS = """
  personnel_number, talent_year, business_unit, position_name, join_date,
  hiring_date, start_date_in_current_position, last_rotation_date,
  last_promotion_date, performance_category, potential_grow_category,
  talent_class_9_box, talent_class_12_box, talent_calibration_now,
  current_roles, pat_2025, pat_2024, pat_2023, pat_2022,
  certification, training, `360_comments` AS `360_comments`,
  `360_strength` AS `360_strength`, `360_weakness` AS `360_weakness`,
  aspiration, project_involvement, linkedin_link
"""
CAREER_COLUMNS = """
  personnel_number, career_within_organization, career_outside_organization
"""


def read_config(path: Path) -> dict[str, str]:
    """Read a small KEY=VALUE file without a dotenv dependency."""
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


def resolve_project_id(config: dict[str, str], credentials_path: Path) -> str:
    project = config.get("BQ_PROJECT_ID") or os.environ.get("BQ_PROJECT_ID")
    if not project:
        try:
            service_account_info = json.loads(credentials_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise ValueError("Service-account JSON is not valid JSON") from error
        project = service_account_info.get("project_id")
    if not isinstance(project, str) or not PROJECT_ID.fullmatch(project):
        raise ValueError("BQ_PROJECT_ID is missing or invalid in the config and service-account JSON")
    return project


def table_reference(config: dict[str, str], project: str, key: str) -> str:
    dataset = required(config, "BQ_DATASET")
    table = config.get(key, key.removeprefix("BQ_TABLE_").lower())
    if not IDENTIFIER.fullmatch(dataset) or not IDENTIFIER.fullmatch(table):
        raise ValueError(f"Invalid BigQuery dataset or table identifier for {key}")
    return f"`{project}.{dataset}.{table}`"


def json_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (date, time)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def query_rows(client: bigquery.Client, columns: str, table: str) -> list[dict[str, Any]]:
    result = client.query(f"SELECT {columns} FROM {table}").result()
    return [{key: json_value(value) for key, value in dict(row.items()).items()} for row in result]


def export_data(config: dict[str, str], output_path: Path) -> None:
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
    except ImportError as error:
        raise RuntimeError(
            "Missing dependency. Install scripts/requirements-bigquery-sync.txt in the Python environment used by this job."
        ) from error
    credentials_path = Path(required(config, "BQ_SERVICE_ACCOUNT_FILE")).expanduser()
    if not credentials_path.is_file():
        raise ValueError(f"Service-account JSON not found: {credentials_path}")
    project = resolve_project_id(config, credentials_path)
    credentials = service_account.Credentials.from_service_account_file(str(credentials_path))
    client = bigquery.Client(project=project, credentials=credentials)
    print("Reading approved BigQuery HR views...")
    payload = {
        "sourceUpdatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "p_emps": query_rows(client, EMPLOYEE_COLUMNS, table_reference(config, project, "BQ_TABLE_P_EMPS")),
        "p_talent_profile": query_rows(client, TALENT_COLUMNS, table_reference(config, project, "BQ_TABLE_P_TALENT_PROFILE")),
        "p_career_history": query_rows(client, CAREER_COLUMNS, table_reference(config, project, "BQ_TABLE_P_CAREER_HISTORY")),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
    temporary_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    temporary_path.replace(output_path)
    print(
        "Export complete: "
        f"{len(payload['p_emps'])} employees, {len(payload['p_talent_profile'])} talent rows, "
        f"{len(payload['p_career_history'])} career rows."
    )


def run_importer(output_path: Path) -> None:
    environment = os.environ.copy()
    environment["BQ_HR_EXPORT_FILE"] = str(output_path)
    npm = "npm.cmd" if os.name == "nt" else "npm"
    print("Starting the HR database importer...")
    subprocess.run([npm, "run", "db:import:bq-hr"], cwd=REPOSITORY_ROOT, env=environment, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync approved BigQuery HR views into Harmoni.")
    parser.add_argument("config_path", nargs="?", type=Path, help="Path to the secret-safe KEY=VALUE config file")
    parser.add_argument("--config", type=Path, help="Path to the secret-safe KEY=VALUE config file")
    parser.add_argument("--output", type=Path, help="JSON export location; overrides BQ_EXPORT_FILE")
    parser.add_argument("--skip-import", action="store_true", help="Only export JSON; do not run the database importer")
    args = parser.parse_args()
    try:
        config_path = args.config or args.config_path
        if not config_path:
            raise ValueError("config path is required")
        config = read_config(config_path.expanduser())
        output_value = args.output or config.get("BQ_EXPORT_FILE")
        output_path = Path(output_value).expanduser() if output_value else REPOSITORY_ROOT / "runtime" / "bq-exports" / "bq-hr.json"
        export_data(config, output_path)
        if not args.skip_import:
            run_importer(output_path)
        print("BigQuery HR sync finished successfully.")
        return 0
    except Exception as error:
        message = str(error).strip() or repr(error)
        print(f"BigQuery HR sync failed ({type(error).__name__}): {message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
