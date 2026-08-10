import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { disconnectBigQueryMock, syncBigQueryMock } from "./sync-bigquery-mock";
import { disconnectHsectMock, syncHsectMock } from "./sync-hsect-mock";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

type CountRow = { count: bigint };

async function count(sql: string) {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return Number(rows[0].count);
}

async function assertTest(name: string, predicate: Promise<boolean> | boolean) {
  const passed = await predicate;
  if (!passed) throw new Error(`FAILED: ${name}`);
  console.log(`PASS: ${name}`);
}

async function tableExists(tableName: string) {
  return (
    await count(`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '${tableName}'
    `)
  ) === 1;
}

async function main() {
  await assertTest("migration creates operational employee table", tableExists("employee_profiles"));
  await assertTest("migration creates talent AI analysis table", await tableExists("talent_ai_analyses"));

  await syncBigQueryMock();
  await syncHsectMock();
  const employeeCountAfterFirstSync = await count("SELECT COUNT(*)::bigint AS count FROM employee_profiles");
  const careerCountAfterFirstSync = await count("SELECT COUNT(*)::bigint AS count FROM employee_career_histories");
  const hsectMcuCountAfterFirstSync = await count("SELECT COUNT(*)::bigint AS count FROM hsect_mcu_records");

  await syncBigQueryMock();
  await syncHsectMock();

  await assertTest("seed/sync produces at least 30 employees without duplicates", (await count("SELECT COUNT(*)::bigint AS count FROM employee_profiles")) === employeeCountAfterFirstSync && employeeCountAfterFirstSync >= 30);
  await assertTest("employee_number is unique", (await count("SELECT COUNT(*)::bigint AS count FROM (SELECT employee_number FROM employee_profiles GROUP BY employee_number HAVING COUNT(*) > 1) d")) === 0);
  await assertTest("organization foreign keys are valid", (await count("SELECT COUNT(*)::bigint AS count FROM employee_profiles e LEFT JOIN organization_departments d ON d.id = e.current_department_id WHERE e.current_department_id IS NOT NULL AND d.id IS NULL")) === 0);
  await assertTest("career history connects to employee", (await count("SELECT COUNT(*)::bigint AS count FROM employee_career_histories ch LEFT JOIN employee_profiles e ON e.id = ch.employee_id WHERE e.id IS NULL")) === 0);
  await assertTest("performance unique per employee and year", (await count("SELECT COUNT(*)::bigint AS count FROM (SELECT employee_id, period_year FROM employee_performances GROUP BY employee_id, period_year HAVING COUNT(*) > 1) d")) === 0);
  await assertTest("position skill requirement valid", (await count("SELECT COUNT(*)::bigint AS count FROM talent_position_skill_requirements psr LEFT JOIN organization_positions p ON p.id = psr.position_id LEFT JOIN talent_skills s ON s.id = psr.skill_id WHERE p.id IS NULL OR s.id IS NULL")) === 0);
  await assertTest("HSECT MCU connects to employee", (await count("SELECT COUNT(*)::bigint AS count FROM hsect_mcu_records m LEFT JOIN employee_profiles e ON e.id = m.employee_id WHERE e.id IS NULL")) === 0);
  await assertTest("mock BigQuery sync can be repeated", (await count("SELECT COUNT(*)::bigint AS count FROM employee_profiles")) === employeeCountAfterFirstSync);
  await assertTest("mock HSECT sync can be repeated", (await count("SELECT COUNT(*)::bigint AS count FROM hsect_mcu_records")) === hsectMcuCountAfterFirstSync);

  await prisma.$executeRaw`UPDATE employee_profiles SET full_name = 'TEMP MOCK NAME' WHERE employee_number = 'EMP-1001'`;
  await syncBigQueryMock();
  const restored = await prisma.$queryRaw<{ full_name: string }[]>`SELECT full_name FROM employee_profiles WHERE employee_number = 'EMP-1001'`;
  await assertTest("upsert updates old data", restored[0].full_name === "Aditya Mahendra");
  await assertTest("history data is not hard-deleted by sync", (await count("SELECT COUNT(*)::bigint AS count FROM employee_career_histories")) === careerCountAfterFirstSync);
  await assertTest("onboarding stays separate from talent", (await tableExists("onboarding_programs")) && (await tableExists("talent_employee_skills")));
  await assertTest("SIMPER number is masked", (await count("SELECT COUNT(*)::bigint AS count FROM hsect_simper_records WHERE license_number_masked !~ '^SMP-\\*{4}-[0-9]{4}$'")) === 0);
  await assertTest("Talent AI review status exists", (await count("SELECT COUNT(*)::bigint AS count FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'talent_ai_analyses' AND column_name = 'reviewStatus'")) === 1);
  await assertTest("Talent AI stores sanitized context as JSON", (await count("SELECT COUNT(*)::bigint AS count FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'talent_ai_analyses' AND column_name = 'sanitizedContext' AND data_type = 'jsonb'")) === 1);

  const bigQueryMock = fs.readFileSync(path.join(__dirname, "mock", "bigquery-source.json"), "utf8").toLowerCase();
  await assertTest("mock data does not contain sensitive fields", !/(national_id|rekening|bank_account|payroll|alamat rumah|family|password|token)/.test(bigQueryMock));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectBigQueryMock();
    await disconnectHsectMock();
    await prisma.$disconnect();
  });
