import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

type HsectRecord = {
  employeeNumber: string;
  mcu: string;
  mcuValidUntil: string;
  simper: string;
  simperValidUntil: string;
  license: string;
  cert: string;
  certValidUntil: string;
};

type HsectSource = {
  sourceName: "HSECT";
  sourceUpdatedAt: string;
  records: HsectRecord[];
};

type IdRow = { id: string };

async function syncRun(rowsRead: number) {
  const [run] = await prisma.$queryRaw<IdRow[]>`
    INSERT INTO integration_sync_runs (source_name, entity_name, sync_type, started_at, status, rows_read)
    VALUES ('HSECT', 'HSECT_MOCK', 'MOCK', now(), 'RUNNING', ${rowsRead})
    RETURNING id
  `;
  return run.id;
}

async function finishRun(id: string, status: string, inserted: number, updated: number, failed = 0, error?: string) {
  await prisma.$executeRaw`
    UPDATE integration_sync_runs
    SET completed_at = now(), status = ${status}, rows_inserted = ${inserted},
        rows_updated = ${updated}, rows_failed = ${failed}, error_summary = ${error ?? null}
    WHERE id = ${id}::uuid
  `;
}

async function employeeId(employeeNumber: string) {
  const rows = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM employee_profiles WHERE employee_number = ${employeeNumber}
  `;
  return rows[0]?.id;
}

async function skillId(skillCode: string) {
  const rows = await prisma.$queryRaw<IdRow[]>`
    SELECT id FROM talent_skills WHERE skill_code = ${skillCode}
  `;
  return rows[0]?.id ?? null;
}

async function countWhere(table: string, where: string) {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM ${table} WHERE ${where}`);
  return Number(rows[0].count);
}

async function upsertRecord(record: HsectRecord, sourceUpdatedAt: string) {
  const id = await employeeId(record.employeeNumber);
  if (!id) return { inserted: 0, updated: 0, skipped: 1 };

  let inserted = 0;
  let updated = 0;
  const safeId = `'${id}'::uuid`;
  const safeCertCode = `'MINE-SAFE-${record.employeeNumber.slice(-2)}'`;
  const hseRiskSkillId = await skillId("HSE-RISK");
  const relatedSkill = hseRiskSkillId ? `'${hseRiskSkillId}'::uuid` : "NULL";

  const mcuExists = await countWhere("hsect_mcu_records", `employee_id = ${safeId} AND examination_date = ('${record.mcuValidUntil}'::date - interval '1 year')::date`);
  if (mcuExists === 0) {
    inserted += 1;
    await prisma.$executeRawUnsafe(`
      INSERT INTO hsect_mcu_records
        (employee_id, examination_date, valid_until, fitness_status, restriction_summary, provider_name, source_system, source_updated_at, last_synced_at)
      VALUES
        (${safeId}, ('${record.mcuValidUntil}'::date - interval '1 year')::date, '${record.mcuValidUntil}'::date,
         '${record.mcu}', ${record.mcu === "FIT_WITH_NOTE" ? "'Follow up sesuai rekomendasi dokter kerja'" : "NULL"},
         'Mock Occupational Clinic', 'HSECT', '${sourceUpdatedAt}'::timestamptz, now())
    `);
  } else {
    updated += 1;
    await prisma.$executeRawUnsafe(`
      UPDATE hsect_mcu_records
      SET valid_until = '${record.mcuValidUntil}'::date, fitness_status = '${record.mcu}',
          source_updated_at = '${sourceUpdatedAt}'::timestamptz, last_synced_at = now(), updated_at = now()
      WHERE employee_id = ${safeId} AND examination_date = ('${record.mcuValidUntil}'::date - interval '1 year')::date
    `);
  }

  const simperExists = await countWhere("hsect_simper_records", `employee_id = ${safeId} AND license_number_masked = '${record.license}'`);
  if (simperExists === 0) {
    inserted += 1;
    await prisma.$executeRawUnsafe(`
      INSERT INTO hsect_simper_records
        (employee_id, simper_type, license_number_masked, issue_date, valid_until, status, permitted_equipment, source_system, source_updated_at, last_synced_at)
      VALUES
        (${safeId}, 'SITE_OPERATION', '${record.license}', ('${record.simperValidUntil}'::date - interval '1 year')::date,
         '${record.simperValidUntil}'::date, '${record.simper}', 'LV, DT, support equipment as authorized', 'HSECT', '${sourceUpdatedAt}'::timestamptz, now())
    `);
  } else {
    updated += 1;
    await prisma.$executeRawUnsafe(`
      UPDATE hsect_simper_records
      SET valid_until = '${record.simperValidUntil}'::date, status = '${record.simper}',
          source_updated_at = '${sourceUpdatedAt}'::timestamptz, last_synced_at = now(), updated_at = now()
      WHERE employee_id = ${safeId} AND license_number_masked = '${record.license}'
    `);
  }

  const certExists = await countWhere("hsect_employee_certifications", `employee_id = ${safeId} AND certification_code = ${safeCertCode}`);
  if (certExists === 0) {
    inserted += 1;
    await prisma.$executeRawUnsafe(`
      INSERT INTO hsect_employee_certifications
        (employee_id, certification_code, certification_name, certification_category, issuer, issue_date, valid_until, status, related_skill_id, source_system, source_updated_at, last_synced_at)
      VALUES
        (${safeId}, ${safeCertCode}, 'Mining Safety Competency', 'HSE', 'Mock Certification Board',
         ('${record.certValidUntil}'::date - interval '2 years')::date, '${record.certValidUntil}'::date,
         '${record.cert}', ${relatedSkill}, 'HSECT', '${sourceUpdatedAt}'::timestamptz, now())
    `);
  } else {
    updated += 1;
    await prisma.$executeRawUnsafe(`
      UPDATE hsect_employee_certifications
      SET valid_until = '${record.certValidUntil}'::date, status = '${record.cert}',
          source_updated_at = '${sourceUpdatedAt}'::timestamptz, last_synced_at = now(), updated_at = now()
      WHERE employee_id = ${safeId} AND certification_code = ${safeCertCode}
    `);
  }

  await prisma.$executeRaw`
    INSERT INTO hsect_safety_summaries
      (employee_id, period_year, hse_training_count, safety_observation_count, incident_count, summary, source_system, source_updated_at)
    VALUES
      (${id}::uuid, 2026, 2, 6, 0, 'Mock HSECT annual safety summary', 'HSECT', ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (employee_id, period_year) DO UPDATE SET
      hse_training_count = EXCLUDED.hse_training_count,
      safety_observation_count = EXCLUDED.safety_observation_count,
      incident_count = EXCLUDED.incident_count,
      source_updated_at = EXCLUDED.source_updated_at,
      updated_at = now()
  `;

  return { inserted, updated, skipped: 0 };
}

export async function syncHsectMock() {
  const sourcePath = path.join(__dirname, "mock", "hsect-source.json");
  const data = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as HsectSource;
  const runId = await syncRun(data.records.length);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const record of data.records) {
      const result = await upsertRecord(record, data.sourceUpdatedAt);
      inserted += result.inserted;
      updated += result.updated;
      skipped += result.skipped;
    }
    await prisma.$executeRaw`
      UPDATE integration_sync_runs SET rows_skipped = ${skipped} WHERE id = ${runId}::uuid
    `;
    await finishRun(runId, skipped > 0 ? "PARTIAL_SUCCESS" : "SUCCESS", inserted, updated);
    console.log(`HSECT mock sync success: ${data.records.length} records processed.`);
  } catch (error) {
    await finishRun(runId, "FAILED", inserted, updated, 1, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function disconnectHsectMock() {
  await prisma.$disconnect();
}

if (require.main === module) {
  syncHsectMock()
    .catch((error) => {
      console.error("HSECT mock sync failed:", error);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
