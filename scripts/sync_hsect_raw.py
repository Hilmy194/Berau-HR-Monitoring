#!/usr/bin/env python3
"""Download HSE CT employee and eligibility responses from a Postman collection.

The script writes a raw export for audit/debugging and, when employee numbers
can be found, a normalized export that can be imported by
``npm run db:import:hsect``.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests

try:
    import psycopg
except ImportError:  # Database matching is optional unless --database-url is used.
    psycopg = None


SID_IN_DETAIL_URL = re.compile(r"(/bySid/)([^/?#]+)", re.IGNORECASE)
POSTMAN_VARIABLE = re.compile(r"{{\s*([^}]+?)\s*}}")


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
        raise ValueError(f"{key} is required")
    return value


def postgres_url(value: str) -> str:
    parsed = urlsplit(value)
    query = urlencode([(key, item) for key, item in parse_qsl(parsed.query, keep_blank_values=True) if key != "schema"])
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, parsed.fragment))


def bq_personnel_numbers(database_url: str) -> set[str]:
    if psycopg is None:
        raise RuntimeError("psycopg is required for BQ-to-HSE matching; install scripts/requirements-bigquery-sync.txt")
    with psycopg.connect(postgres_url(database_url)) as connection:
        rows = connection.execute(
            """
            SELECT DISTINCT btrim(personnel_number)
            FROM bq_raw.p_emps
            WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
            """
        ).fetchall()
    values = {str(row[0]).strip() for row in rows if row[0] is not None and str(row[0]).strip()}
    if not values:
        raise ValueError("BQ employee master is empty; sync bq_raw.p_emps before HSE CT")
    return values


def normalized_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def collection_values(collection: dict[str, Any]) -> dict[str, str]:
    values: dict[str, str] = {}
    for item in collection.get("variable", []):
        if isinstance(item, dict) and item.get("key") and item.get("value") is not None:
            values[str(item["key"])] = str(item["value"])
    return values


def replacement_values(collection: dict[str, Any], config: dict[str, str]) -> dict[str, str]:
    values = collection_values(collection)
    for key, value in os.environ.items():
        if key.startswith("HSECT_"):
            values[key] = value
            values[key.removeprefix("HSECT_")] = value
    for key, value in config.items():
        values[key] = value
        values[key.removeprefix("HSECT_")] = value
    return values


def resolve_variables(value: str, values: dict[str, str], allowed_unresolved: tuple[str, ...] = ()) -> str:
    allowed = {normalized_name(item) for item in allowed_unresolved}

    def replace(match: re.Match[str]) -> str:
        key = match.group(1).strip()
        for candidate in (key, key.upper(), key.lower(), key.replace("-", "_"), key.replace("_", "-")):
            if candidate in values:
                return values[candidate]
        if normalized_name(key) in allowed:
            return "{{" + key + "}}"
        raise ValueError(f"Unresolved Postman variable: {key}")

    return POSTMAN_VARIABLE.sub(replace, value)


def iter_collection_requests(items: list[Any]) -> list[tuple[str, dict[str, Any]]]:
    found: list[tuple[str, dict[str, Any]]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        request = item.get("request")
        if isinstance(request, dict):
            found.append((str(item.get("name", "")).strip(), request))
        nested = item.get("item")
        if isinstance(nested, list):
            found.extend(iter_collection_requests(nested))
    return found


def collection_request(collection: dict[str, Any], request_name: str) -> dict[str, Any]:
    target = normalized_name(request_name)
    for name, request in iter_collection_requests(collection.get("item", [])):
        if normalized_name(name) == target:
            return request
    available = ", ".join(name for name, _ in iter_collection_requests(collection.get("item", [])))
    raise ValueError(f"Request '{request_name}' is missing from the Postman collection. Available: {available}")


def request_url(request: dict[str, Any], values: dict[str, str], allowed_unresolved: tuple[str, ...] = ()) -> str:
    url = request.get("url", {})
    raw = url.get("raw") if isinstance(url, dict) else url
    if not isinstance(raw, str) or not raw:
        raise ValueError("Collection request has no raw URL")
    return resolve_variables(raw, values, allowed_unresolved)


def request_headers(request: dict[str, Any], values: dict[str, str]) -> dict[str, str]:
    headers: dict[str, str] = {}
    for header in request.get("header", []):
        if not isinstance(header, dict) or header.get("disabled") or not header.get("key"):
            continue
        headers[str(header["key"])] = resolve_variables(str(header.get("value", "")), values)

    auth = request.get("auth")
    if isinstance(auth, dict):
        auth_type = str(auth.get("type", "")).lower()
        entries = auth.get(auth_type)
        if isinstance(entries, list):
            auth_values = {str(item.get("key")): item.get("value") for item in entries if isinstance(item, dict)}
            if auth_type == "bearer" and auth_values.get("token"):
                headers.setdefault("Authorization", "Bearer " + resolve_variables(str(auth_values["token"]), values))
            if auth_type == "apikey" and auth_values.get("key") and auth_values.get("value"):
                headers.setdefault(str(auth_values["key"]), resolve_variables(str(auth_values["value"]), values))

    if values.get("API_KEY"):
        headers.setdefault("x-api-key", values["API_KEY"])
    if values.get("TOKEN"):
        headers.setdefault("Authorization", "Bearer " + values["TOKEN"])
    return headers


def infer_shared_api_key(requests: list[dict[str, Any]], values: dict[str, str]) -> None:
    if values.get("API_KEY"):
        return
    for request in requests:
        for header in request.get("header", []):
            if not isinstance(header, dict) or str(header.get("key", "")).lower() != "x-api-key":
                continue
            header_value = header.get("value")
            if header_value is None or not str(header_value).strip():
                continue
            values["API_KEY"] = resolve_variables(str(header_value), values)
            return


def with_query(url: str, **changes: str | int | None) -> str:
    parsed = urlsplit(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    for key, value in changes.items():
        if value is not None:
            query[key] = str(value)
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


def page_size_for(url: str, requested_page_size: int | None) -> int:
    if requested_page_size:
        return requested_page_size
    query = dict(parse_qsl(urlsplit(url).query, keep_blank_values=True))
    try:
        return int(query.get("size") or 100)
    except ValueError:
        return 100


def response_json(session: requests.Session, request: dict[str, Any], url: str, values: dict[str, str]) -> Any:
    method = str(request.get("method", "GET")).upper()
    if method != "GET":
        raise ValueError(f"Only GET requests are supported for HSE CT sync, got {method}")
    response = session.get(url, headers=request_headers(request, values), timeout=60)
    response.raise_for_status()
    try:
        return response.json()
    except ValueError as error:
        raise ValueError(f"HSE CT returned non-JSON data for {urlsplit(url).path}") from error


def items_from_payload(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("data", "items", "content", "rows", "result", "results", "employees", "companies", "documents"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = items_from_payload(value)
            if nested:
                return nested
    return []


def first_dict(payload: Any, keys: tuple[str, ...]) -> dict[str, Any] | None:
    if isinstance(payload, dict):
        for key in keys:
            value = payload.get(key)
            if isinstance(value, dict):
                return value
        return payload
    return None


def walk_values(record: Any) -> list[tuple[str, Any]]:
    values: list[tuple[str, Any]] = []
    if isinstance(record, dict):
        for key, value in record.items():
            values.append((str(key), value))
            values.extend(walk_values(value))
    elif isinstance(record, list):
        for value in record:
            values.extend(walk_values(value))
    return values


def value_by_alias(record: Any, aliases: tuple[str, ...]) -> str | None:
    wanted = {normalized_name(alias) for alias in aliases}
    for key, value in walk_values(record):
        if normalized_name(key) in wanted and value is not None and str(value).strip():
            return str(value).strip()
    return None


def date_by_alias(record: Any, aliases: tuple[str, ...]) -> str | None:
    value = value_by_alias(record, aliases)
    if not value:
        return None
    match = re.search(r"\d{4}-\d{2}-\d{2}", value)
    if match:
        return match.group(0)
    day_first = re.search(r"(\d{2})-(\d{2})-(\d{4})", value)
    return f"{day_first.group(3)}-{day_first.group(2)}-{day_first.group(1)}" if day_first else None


def paged_payloads(
    session: requests.Session,
    request: dict[str, Any],
    base_url: str,
    values: dict[str, str],
    requested_page_size: int | None,
    max_pages: int,
    **filters: str,
) -> list[Any]:
    payloads: list[Any] = []
    effective_page_size = page_size_for(base_url, requested_page_size)
    for page in range(1, max_pages + 1):
        payload = response_json(
            session,
            request,
            with_query(base_url, page=page, size=effective_page_size, **filters),
            values,
        )
        payloads.append(payload)
        if len(items_from_payload(payload)) < effective_page_size:
            break
    return payloads


def company_ids_from_employee_url(url: str) -> list[str]:
    query = dict(parse_qsl(urlsplit(url).query, keep_blank_values=True))
    return [query["companyId"]] if query.get("companyId") else []


def detail_url_for_sid(template: str, sid: str) -> str:
    if "{{" in template:
        return resolve_variables(template, {"SID": sid, "sid": sid, "HSECT_SID": sid})
    if SID_IN_DETAIL_URL.search(template):
        return SID_IN_DETAIL_URL.sub(lambda match: match.group(1) + sid, template, count=1)
    raise ValueError("get detail employee URL must contain /bySid/<sampleSid> or a {{SID}} variable")


def normalized_document(document: dict[str, Any]) -> dict[str, str | None]:
    document_id = value_by_alias(document, ("id", "document_id", "documentId", "hsect_document_id"))
    if not document_id:
        raise ValueError("document id is required")
    return {
        "id": document_id,
        "type_name": value_by_alias(document, ("type_name", "typeName", "document_type_name", "documentTypeName", "documentType", "name")),
        "group_name": value_by_alias(document, ("group_name", "groupName", "document_group_name", "documentGroupName", "documentCategory")),
        "category_id": value_by_alias(document, ("category_id", "categoryId", "document_category_id", "documentCategoryId")),
        "status": value_by_alias(document, ("status", "status_name", "statusName", "document_status", "documentStatus")),
        "issued_at": date_by_alias(document, ("issued_at", "issuedAt", "issue_date", "issueDate", "publishDate", "valid_from", "validFrom")),
        "expires_at": date_by_alias(document, ("expires_at", "expiresAt", "expired_at", "expiredAt", "expiredDate", "expiry_date", "expiryDate", "valid_until", "validUntil")),
    }


def normalize_employee(employee: dict[str, Any], detail_payload: Any, company_id: str) -> dict[str, Any] | None:
    detail = first_dict(detail_payload, ("employee", "data", "result")) or {}
    personnel_number = value_by_alias(detail, ("employeeIdNumber", "personnel_number", "personnelNumber"))
    if not personnel_number:
        personnel_number = value_by_alias(employee, ("employeeIdNumber", "npk", "personnel_number", "personnelNumber"))
    sid = value_by_alias(detail, ("sidCode", "sid", "employee_sid", "employeeSid"))
    if not sid:
        sid = value_by_alias(employee, ("sidCode", "sid", "employee_sid", "employeeSid"))
    if not personnel_number or not sid:
        return None

    documents: list[dict[str, str | None]] = []
    for document in employee.get("simperDocuments", []):
        if not isinstance(document, dict):
            continue
        try:
            documents.append(normalized_document(document))
        except ValueError:
            continue
    active_simper = [document for document in documents if (document.get("status") or "").upper() == "AKTIF"]
    has_active_simper = employee.get("hasActiveSimperDocuments") is True or bool(active_simper)
    simper_summary = "; ".join(
        filter(None, (
            f"{document.get('type_name') or 'SIMPER'}"
            + (f" s.d. {document['expires_at']}" if document.get("expires_at") else "")
            for document in active_simper
        ))
    ) or None

    return {
        "personnel_number": personnel_number,
        "sid": sid,
        "hsect_employee_id": value_by_alias(detail, ("id", "employeeInfoId", "employee_id", "employeeId")) or value_by_alias(employee, ("employeeId",)),
        "company_id": value_by_alias(detail, ("companyId", "company_id")) or company_id,
        "mcu_status": value_by_alias(detail, ("statusPermit",)) or value_by_alias(employee, ("statusPermit",)),
        "mcu_description": value_by_alias(detail, ("descriptionPermit",)) or value_by_alias(employee, ("descriptionPermit",)),
        "simper_status": "ACTIVE" if has_active_simper else "INACTIVE",
        "simper_summary": simper_summary,
        "documents": documents,
    }


def import_to_db(normalized_output: Path) -> None:
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        raise FileNotFoundError("npm executable not found in PATH")
    environment = os.environ.copy()
    environment["HSECT_EXPORT_FILE"] = str(normalized_output)
    subprocess.run([npm, "run", "db:import:hsect"], check=True, env=environment)


def main() -> int:
    parser = argparse.ArgumentParser(description="Download and normalize HSE CT API data using a Postman collection.")
    parser.add_argument("config_path", nargs="?", type=Path, help="HSECT KEY=VALUE config file stored outside the repository")
    parser.add_argument("--config", type=Path, help="HSECT KEY=VALUE config file stored outside the repository")
    parser.add_argument("--collection", type=Path, help="Overrides HSECT_POSTMAN_COLLECTION_FILE")
    parser.add_argument("--database-url", help="PostgreSQL URL used to pre-match HSE employees to bq_raw.p_emps")
    parser.add_argument("--page-size", type=int, default=None, help="Overrides collection size query parameter")
    parser.add_argument("--max-pages", type=int, default=1000)
    parser.add_argument("--employee-limit", type=int, default=None, help="Limit employee detail requests for smoke testing")
    parser.add_argument("--progress-every", type=int, default=100, help="Print progress after this many employee records")
    parser.add_argument("--raw-output", type=Path, help="Overrides HSECT_RAW_EXPORT_FILE")
    parser.add_argument("--normalized-output", type=Path, help="Defaults to HSECT_EXPORT_FILE or HSECT_RAW_EXPORT_FILE with .normalized.json")
    parser.add_argument("--import-db", action="store_true", help="Run npm run db:import:hsect after export")
    args = parser.parse_args()

    try:
        config_path = args.config or args.config_path
        if not config_path:
            raise ValueError("config path is required")
        config = read_config(config_path.expanduser())
        collection_path = args.collection or Path(required(config, "HSECT_POSTMAN_COLLECTION_FILE"))
        collection = json.loads(collection_path.read_text(encoding="utf-8-sig"))
        values = replacement_values(collection, config)
        database_url = (
            args.database_url
            or config.get("BQ_RAW_DATABASE_URL")
            or config.get("DIRECT_URL")
            or config.get("DATABASE_URL")
            or os.environ.get("BQ_RAW_DATABASE_URL")
            or os.environ.get("DIRECT_URL")
            or os.environ.get("DATABASE_URL")
        )
        master_personnel_numbers = bq_personnel_numbers(database_url) if database_url else None

        companies_request = collection_request(collection, "get company")
        employees_request = collection_request(collection, "get employee")
        detail_request = collection_request(collection, "get detail employee")
        infer_shared_api_key([companies_request, employees_request, detail_request], values)

        session = requests.Session()
        employee_url = request_url(employees_request, values)
        detail_url_template = request_url(detail_request, values, ("SID", "sid", "HSECT_SID"))

        company_payloads = paged_payloads(
            session,
            companies_request,
            request_url(companies_request, values),
            values,
            args.page_size,
            args.max_pages,
        )
        companies = [item for payload in company_payloads for item in items_from_payload(payload)]
        configured_company_ids = [
            item.strip()
            for item in (config.get("HSECT_COMPANY_IDS") or "").split(",")
            if item.strip()
        ]
        collection_company_ids = company_ids_from_employee_url(employee_url)
        company_ids = configured_company_ids or collection_company_ids
        if not company_ids:
            company_ids = [value for value in (value_by_alias(company, ("id", "company_id", "companyId")) for company in companies) if value]
        if not company_ids:
            raise ValueError("No company ids found from get company or get employee URL")

        employee_payloads: dict[str, list[Any]] = {}
        details: dict[str, Any] = {}
        errors: dict[str, str] = {}
        normalized_employees: list[dict[str, Any]] = []
        processed_employees = 0
        employees_not_in_bq = 0

        for company_id in company_ids:
            if args.employee_limit is not None and processed_employees >= args.employee_limit:
                break
            pages = paged_payloads(
                session,
                employees_request,
                employee_url,
                values,
                args.page_size,
                args.max_pages,
                companyId=company_id,
            )
            employee_payloads[company_id] = pages
            for employee in (item for payload in pages for item in items_from_payload(payload)):
                if args.employee_limit is not None and processed_employees >= args.employee_limit:
                    break
                sid = value_by_alias(employee, ("sidCode", "sid", "employee_sid", "employeeSid"))
                if not sid:
                    continue
                employee_personnel_number_value = value_by_alias(
                    employee,
                    ("employeeIdNumber", "npk", "personnel_number", "personnelNumber"),
                )
                employee_personnel_number = (
                    str(employee_personnel_number_value).strip()
                    if employee_personnel_number_value is not None
                    else None
                )
                if master_personnel_numbers is not None and employee_personnel_number not in master_personnel_numbers:
                    employees_not_in_bq += 1
                    continue
                processed_employees += 1
                try:
                    details[sid] = response_json(session, detail_request, detail_url_for_sid(detail_url_template, sid), values)
                except requests.HTTPError as error:
                    status_code = error.response.status_code if error.response is not None else "unknown"
                    errors[sid] = f"HTTP {status_code}"
                    print(f"Skipping HSE CT SID {sid}: HTTP {status_code}", file=sys.stderr)
                    continue
                normalized = normalize_employee(employee, details[sid], company_id)
                if normalized:
                    normalized_employees.append(normalized)
                if args.progress_every > 0 and processed_employees % args.progress_every == 0:
                    print(
                        f"Processed {processed_employees} HSE CT employees; "
                        f"{len(normalized_employees)} normalized, {len(errors)} skipped."
                    )

        source_updated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        raw_output = args.raw_output or Path(config.get("HSECT_RAW_EXPORT_FILE", "C:/secure-exports/hsect-raw.json")).expanduser()
        if args.normalized_output:
            normalized_output = args.normalized_output
        elif config.get("HSECT_EXPORT_FILE"):
            normalized_output = Path(config["HSECT_EXPORT_FILE"]).expanduser()
        else:
            normalized_output = raw_output.with_suffix(".normalized.json")
        raw_output.parent.mkdir(parents=True, exist_ok=True)
        normalized_output.parent.mkdir(parents=True, exist_ok=True)

        raw_payload = {
            "sourceUpdatedAt": source_updated_at,
            "companies": company_payloads,
            "employeesByCompany": employee_payloads,
            "employeeDetailsBySid": details,
            "errorsBySid": errors,
        }
        normalized_payload = {"sourceUpdatedAt": source_updated_at, "employees": normalized_employees}

        raw_temporary = raw_output.with_suffix(raw_output.suffix + ".tmp")
        raw_temporary.write_text(json.dumps(raw_payload, ensure_ascii=False, default=str), encoding="utf-8")
        raw_temporary.replace(raw_output)
        normalized_temporary = normalized_output.with_suffix(normalized_output.suffix + ".tmp")
        normalized_temporary.write_text(json.dumps(normalized_payload, ensure_ascii=False, default=str), encoding="utf-8")
        normalized_temporary.replace(normalized_output)

        if args.import_db:
            import_to_db(normalized_output)

        print(
            "HSE CT export completed: "
            f"{len(company_ids)} companies, {len(details)} employee detail responses, "
            f"{len(normalized_employees)} normalized BQ-matched employees, "
            f"{employees_not_in_bq} HSE employees not in the current BQ master, {len(errors)} skipped SID errors."
        )
        return 0
    except Exception as error:
        message = str(error).strip() or repr(error)
        print(f"HSE CT export failed ({type(error).__name__}): {message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
