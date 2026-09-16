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
    process.env[key.trim()] ??= parts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadDotEnv();
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

const statements = [
  `CREATE INDEX IF NOT EXISTS bq_raw_p_emps_personnel_period_idx ON bq_raw.p_emps ((btrim(personnel_number)), data_period DESC)`,
  `CREATE INDEX IF NOT EXISTS bq_raw_p_talent_personnel_year_idx ON bq_raw.p_talent_profile ((btrim(personnel_number)), talent_year DESC)`,
  `CREATE INDEX IF NOT EXISTS bq_raw_p_career_personnel_idx ON bq_raw.p_career_history ((btrim(personnel_number)))`,
  `CREATE INDEX IF NOT EXISTS bq_raw_p_assessment_personnel_date_idx ON bq_raw.p_assessment_history ((btrim(personnel_number)), assesment_date DESC)`,
  `CREATE INDEX IF NOT EXISTS bq_raw_p_dp_personnel_year_idx ON bq_raw.p_dp_history ((btrim(personnel_number)), dp_program_year DESC)`,
];

async function main() {
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
  await prisma.$executeRawUnsafe(`ANALYZE bq_raw.p_emps, bq_raw.p_talent_profile, bq_raw.p_career_history, bq_raw.p_assessment_history, bq_raw.p_dp_history`);
  console.log(`HR raw read indexes are ready (${statements.length} indexes).`);
}

main()
  .catch((error) => {
    console.error("HR database optimization failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
