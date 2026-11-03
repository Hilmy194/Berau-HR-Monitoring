import { prisma } from "../src/lib/prisma";
import manualData from "../src/lib/data/manual-competencies.json";

async function main() {
  console.log("Creating bq_raw.p_employee_competencies table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_employee_competencies (
      id SERIAL PRIMARY KEY,
      personnel_number TEXT NOT NULL,
      employee_name TEXT,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      qual_id TEXT NOT NULL,
      qual_name TEXT NOT NULL,
      prof_id INT NOT NULL,
      prof_desc TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_soft BOOLEAN NOT NULL DEFAULT false,
      is_current BOOLEAN NOT NULL DEFAULT true
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_p_emp_comp_nik ON bq_raw.p_employee_competencies(personnel_number);
  `);

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE bq_raw.p_employee_competencies;
  `);

  const employees = (manualData as any).employees;
  const entries: Array<{
    nik: string;
    name: string;
    groupId: string;
    groupName: string;
    qualId: string;
    qualName: string;
    profId: number;
    profDesc: string;
    startDate: string;
    endDate: string;
    isSoft: boolean;
  }> = [];

  for (const [nik, emp] of Object.entries<any>(employees)) {
    for (const s of emp.soft) {
      entries.push({
        nik,
        name: emp.name,
        groupId: s.groupId,
        groupName: s.groupName,
        qualId: s.qualId,
        qualName: s.name,
        profId: s.profId,
        profDesc: s.profDesc,
        startDate: s.startDate,
        endDate: s.endDate,
        isSoft: true,
      });
    }
    for (const t of emp.technical) {
      entries.push({
        nik,
        name: emp.name,
        groupId: t.groupId,
        groupName: t.groupName,
        qualId: t.qualId,
        qualName: t.name,
        profId: t.profId,
        profDesc: t.profDesc,
        startDate: t.startDate,
        endDate: t.endDate,
        isSoft: false,
      });
    }
  }

  console.log(`Inserting ${entries.length} competency rows in batches...`);
  const batchSize = 500;
  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const valueStrings = chunk.map(c => 
      `('${c.nik.replace(/'/g, "''")}', '${c.name.replace(/'/g, "''")}', '${c.groupId}', '${c.groupName.replace(/'/g, "''")}', '${c.qualId}', '${c.qualName.replace(/'/g, "''")}', ${c.profId}, '${c.profDesc.replace(/'/g, "''")}', '${c.startDate}', '${c.endDate}', ${c.isSoft}, true)`
    ).join(",");

    await prisma.$executeRawUnsafe(`
      INSERT INTO bq_raw.p_employee_competencies (personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, start_date, end_date, is_soft, is_current)
      VALUES ${valueStrings}
    `);
  }

  const count = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) as total FROM bq_raw.p_employee_competencies`);
  console.log("Successfully seeded bq_raw.p_employee_competencies! Total rows:", count[0].total);
}

main().catch(console.error).finally(() => prisma.$disconnect());

