/**
 * Imports a normalized HSE CT export after its employee list has been matched
 * to BQ personnel_number. Do not pass API keys or raw medical documents here.
 *
 * Expected JSON:
 * { sourceUpdatedAt, employees: [{ personnel_number, sid, hsect_employee_id?,
 *   company_id?, mcu_status?, mcu_description?, simper_status?, simper_summary?,
 *   documents: [{ id, type_name?, group_name?, category_id?,
 *   status?, issued_at?, expires_at? }] }] }
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

type Document = Record<string, unknown>;
type HsectEmployee = Record<string, unknown> & { documents?: Document[] };
type HsectExport = { sourceUpdatedAt?: string; employees?: HsectEmployee[] };
type IdRow = { id: string };

function text(row: Record<string, unknown>, field: string) {
  const value = row[field];
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function required(row: Record<string, unknown>, field: string) {
  const value = text(row, field);
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function date(row: Record<string, unknown>, field: string) {
  const value = text(row, field);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) throw new Error(`${field} must use ISO date format`);
  return value.slice(0, 10);
}

async function createRun(rowsRead: number) {
  const [run] = await prisma.$queryRaw<IdRow[]>`
    INSERT INTO hr_integration_sync_runs (source_name, entity_name, status, rows_read)
    VALUES ('HSECT', 'employee_index,employee_documents', 'RUNNING', ${rowsRead})
    RETURNING id
  `;
  return run.id;
}

async function finishRun(id: string, status: string, inserted: number, updated: number, skipped: number, failed: number, error?: string) {
  await prisma.$executeRaw`
    UPDATE hr_integration_sync_runs
    SET completed_at = now(), status = ${status}, rows_inserted = ${inserted}, rows_updated = ${updated},
        rows_skipped = ${skipped}, rows_failed = ${failed}, error_summary = ${error ?? null}
    WHERE id = ${id}::uuid
  `;
}

async function employeeId(personnelNumber: string) {
  const rows = await prisma.$queryRaw<IdRow[]>`
    SELECT e.id
    FROM hr_employee_profiles e
    WHERE e.is_active = true
      AND EXISTS (
        SELECT 1 FROM bq_raw.p_emps raw
        WHERE raw.personnel_number IS NOT NULL
          AND btrim(raw.personnel_number) = ${personnelNumber}
      )
      AND (
        btrim(e.personnel_number) = ${personnelNumber}
        OR EXISTS (
          SELECT 1
          FROM hr_employee_source_identifiers i
          WHERE i.employee_id = e.id
            AND i.source_system = 'BIGQUERY'
            AND i.identifier_value = ${personnelNumber}
            AND i.is_active = true
        )
      )
    LIMIT 1
  `;
  return rows[0]?.id;
}

async function recordUnmatchedEmployee(row: HsectEmployee, sourceUpdatedAt: string) {
  const sid = required(row, "sid");
  await prisma.$executeRaw`
    INSERT INTO hr_hsect_employee_reconciliation
      (sid, personnel_number, hsect_employee_id, company_id, reason, source_updated_at)
    VALUES
      (${sid}, ${text(row, "personnel_number")}, ${text(row, "hsect_employee_id")},
       ${text(row, "company_id")}, 'PERSONNEL_NUMBER_NOT_IN_CURRENT_BQ_MASTER', ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (sid) DO UPDATE SET
      personnel_number = EXCLUDED.personnel_number,
      hsect_employee_id = EXCLUDED.hsect_employee_id,
      company_id = EXCLUDED.company_id,
      reason = EXCLUDED.reason,
      is_resolved = false,
      last_seen_at = now(),
      source_updated_at = EXCLUDED.source_updated_at
  `;
}

async function importEmployee(row: HsectEmployee, sourceUpdatedAt: string) {
  const personnelNumber = required(row, "personnel_number");
  const sid = required(row, "sid");
  const id = await employeeId(personnelNumber);
  if (!id) {
    await recordUnmatchedEmployee(row, sourceUpdatedAt);
    return { inserted: 0, updated: 0, skipped: 1 };
  }

  const existing = await prisma.$queryRaw<IdRow[]>`
    SELECT id
    FROM hr_hsect_employee_links
    WHERE sid = ${sid} OR employee_id = ${id}::uuid
  `;
  // One canonical employee has one current SID. Remove an obsolete SID first:
  // the table also has a unique employee_id constraint, while the source upsert
  // is keyed by SID. Without this, a SID correction causes a 23505 error and
  // leaves the employee's HSE fields stale on the Talent Card.
  await prisma.$executeRaw`
    DELETE FROM hr_hsect_employee_links
    WHERE employee_id = ${id}::uuid AND sid <> ${sid}
  `;
  await prisma.$executeRaw`
    INSERT INTO hr_hsect_employee_links
      (employee_id, sid, hsect_employee_id, company_id, mcu_status, mcu_description,
       simper_status, simper_summary, source_updated_at, last_synced_at)
    VALUES
      (${id}::uuid, ${sid}, ${text(row, "hsect_employee_id")}, ${text(row, "company_id")},
       ${text(row, "mcu_status")}, ${text(row, "mcu_description")}, ${text(row, "simper_status")},
       ${text(row, "simper_summary")}, ${sourceUpdatedAt}::timestamptz, now())
    ON CONFLICT (sid) DO UPDATE SET
      employee_id = EXCLUDED.employee_id, hsect_employee_id = EXCLUDED.hsect_employee_id, company_id = EXCLUDED.company_id,
      mcu_status = EXCLUDED.mcu_status, mcu_description = EXCLUDED.mcu_description,
      simper_status = EXCLUDED.simper_status, simper_summary = EXCLUDED.simper_summary,
      source_updated_at = EXCLUDED.source_updated_at, last_synced_at = now(), updated_at = now()
  `;
  await prisma.$executeRaw`
    UPDATE hr_hsect_employee_reconciliation
    SET is_resolved = true, last_seen_at = now(), source_updated_at = ${sourceUpdatedAt}::timestamptz
    WHERE sid = ${sid}
  `;
  await prisma.$executeRaw`
    INSERT INTO hr_employee_source_identifiers (employee_id, source_system, identifier_type, identifier_value, source_updated_at)
    VALUES (${id}::uuid, 'HSECT', 'SID', ${sid}, ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (source_system, identifier_type, identifier_value) DO UPDATE SET
      employee_id = EXCLUDED.employee_id, source_updated_at = EXCLUDED.source_updated_at, is_active = true, updated_at = now()
  `;

  let inserted = existing.length ? 0 : 1;
  let updated = existing.length ? 1 : 0;
  const documents = Array.isArray(row.documents) ? row.documents : [];
  const documentIds = documents.map((document) => required(document, "id"));
  if (documentIds.length) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM hr_hsect_document_records WHERE employee_id = $1::uuid AND NOT (hsect_document_id = ANY($2::text[]))`,
      id,
      documentIds,
    );
  } else {
    await prisma.$executeRaw`DELETE FROM hr_hsect_document_records WHERE employee_id = ${id}::uuid`;
  }

  for (const document of documents) {
    const documentId = required(document, "id");
    const found = await prisma.$queryRaw<IdRow[]>`
      SELECT id FROM hr_hsect_document_records WHERE employee_id = ${id}::uuid AND hsect_document_id = ${documentId}
    `;
    await prisma.$executeRaw`
      INSERT INTO hr_hsect_document_records
        (employee_id, hsect_document_id, document_type_name, document_group_name, document_category_id, status, issued_at, expires_at, source_updated_at, last_synced_at)
      VALUES
        (${id}::uuid, ${documentId}, ${text(document, "type_name")}, ${text(document, "group_name")}, ${text(document, "category_id")},
         ${text(document, "status")}, ${date(document, "issued_at")}::date, ${date(document, "expires_at")}::date, ${sourceUpdatedAt}::timestamptz, now())
      ON CONFLICT (employee_id, hsect_document_id) DO UPDATE SET
        document_type_name = EXCLUDED.document_type_name, document_group_name = EXCLUDED.document_group_name,
        document_category_id = EXCLUDED.document_category_id, status = EXCLUDED.status, issued_at = EXCLUDED.issued_at,
        expires_at = EXCLUDED.expires_at, source_updated_at = EXCLUDED.source_updated_at, last_synced_at = now(), updated_at = now()
    `;
    found.length ? updated += 1 : inserted += 1;
  }
  return { inserted, updated, skipped: 0 };
}

async function main() {
  const file = process.env.HSECT_EXPORT_FILE;
  if (!file) throw new Error("HSECT_EXPORT_FILE must point to a normalized HSE CT JSON export");
  const source = JSON.parse(fs.readFileSync(file, "utf8")) as HsectExport;
  const employees = Array.isArray(source.employees) ? source.employees : [];
  const runId = await createRun(employees.length);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  try {
    for (const row of employees) {
      try {
        const result = await importEmployee(row, source.sourceUpdatedAt ?? new Date().toISOString());
        inserted += result.inserted;
        updated += result.updated;
        skipped += result.skipped;
      } catch (error) {
        failed += 1;
        console.warn(`HSE CT row skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    await finishRun(runId, failed ? "PARTIAL_SUCCESS" : "SUCCESS", inserted, updated, skipped, failed);
  } catch (error) {
    await finishRun(runId, "FAILED", inserted, updated, skipped, failed + 1, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("HSE CT import failed:", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
