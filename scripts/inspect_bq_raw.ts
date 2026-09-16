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

async function main() {
  const rows = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'bq_raw'
    ORDER BY table_name, ordinal_position
  `;
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    grouped.set(row.table_name, [...(grouped.get(row.table_name) ?? []), row.column_name]);
  }
  console.log(JSON.stringify(Object.fromEntries(grouped), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
