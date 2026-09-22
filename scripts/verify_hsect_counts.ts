import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function loadDotEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    const value = parts.join("=").trim().replace(/^['"]|['"]$/g, "");
    process.env[key.trim()] ??= value;
  }
}

loadDotEnv();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

async function count(table: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return rows[0]?.count ?? 0;
}

async function main() {
  const [latestRun] = await prisma.$queryRaw<
    Array<{
      status: string;
      rows_read: number;
      rows_inserted: number;
      rows_updated: number;
      rows_skipped: number;
      rows_failed: number;
    }>
  >`
    SELECT status, rows_read, rows_inserted, rows_updated, rows_skipped, rows_failed
    FROM hr_integration_sync_runs
    WHERE source_name = 'HSECT'
    ORDER BY started_at DESC
    LIMIT 1
  `;
  const [eligibility] = await prisma.$queryRaw<Array<{
    linked_employees: number;
    with_mcu: number;
    with_sid: number;
    with_simper: number;
  }>>`
    SELECT
      COUNT(*)::int AS linked_employees,
      COUNT(mcu_status)::int AS with_mcu,
      COUNT(sid)::int AS with_sid,
      COUNT(simper_status)::int AS with_simper
    FROM hr_hsect_employee_links
  `;
  const [bqCoverage] = await prisma.$queryRaw<Array<{
    links_in_current_bq_master: number;
    links_outside_current_bq_master: number;
  }>>`
    SELECT
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM bq_raw.p_emps raw
        WHERE raw.personnel_number IS NOT NULL
          AND btrim(raw.personnel_number) = btrim(profile.personnel_number)
      ))::int AS links_in_current_bq_master,
      COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1
        FROM bq_raw.p_emps raw
        WHERE raw.personnel_number IS NOT NULL
          AND btrim(raw.personnel_number) = btrim(profile.personnel_number)
      ))::int AS links_outside_current_bq_master
    FROM hr_hsect_employee_links link
    JOIN hr_employee_profiles profile ON profile.id = link.employee_id
  `;
  const [documentIntegrity] = await prisma.$queryRaw<Array<{
    shared_document_ids: number;
    affected_rows: number;
  }>>`
    SELECT COUNT(*)::int AS shared_document_ids, COALESCE(SUM(employee_count), 0)::int AS affected_rows
    FROM (
      SELECT hsect_document_id, COUNT(DISTINCT employee_id)::int AS employee_count
      FROM hr_hsect_document_records
      GROUP BY hsect_document_id
      HAVING COUNT(DISTINCT employee_id) > 1
    ) duplicated
  `;
  const [reconciliation] = await prisma.$queryRaw<Array<{
    unresolved: number;
    resolved: number;
  }>>`
    SELECT
      COUNT(*) FILTER (WHERE is_resolved = false)::int AS unresolved,
      COUNT(*) FILTER (WHERE is_resolved = true)::int AS resolved
    FROM hr_hsect_employee_reconciliation
  `;

  console.log(JSON.stringify({
    hsect_employee_links: await count("hr_hsect_employee_links"),
    hsect_document_records: await count("hr_hsect_document_records"),
    latest_hsect_run: latestRun ?? null,
    eligibility: eligibility ?? null,
    bq_coverage: bqCoverage ?? null,
    document_integrity: documentIntegrity ?? null,
    reconciliation: reconciliation ?? null,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
