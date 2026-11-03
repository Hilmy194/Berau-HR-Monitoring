import { prisma } from "../src/lib/prisma";
import { getEmployeeCompetencyProfile } from "../src/lib/services/employee-competency.service";

async function main() {
  const nik = "11001392";
  const name = "Abd Rahman Alhafis";
  const position = "Short Term Mine Plan Senior Engineer";

  const profile = await getEmployeeCompetencyProfile(nik, position, name);

  console.log(`Seeding competencies for ${nik} - ${name}...`);

  for (const s of profile.softCompetencies) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO bq_raw.p_employee_competencies (personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, start_date, end_date, is_soft, is_current)
      VALUES ('${nik}', '${name}', '${s.groupId}', '${s.groupName}', '${s.qualId}', '${s.name}', ${s.profId}, '${s.profDesc}', '${s.startDate}', '${s.endDate}', true, true)
      ON CONFLICT DO NOTHING;
    `);
  }

  for (const t of profile.technicalCompetencies) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO bq_raw.p_employee_competencies (personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, start_date, end_date, is_soft, is_current)
      VALUES ('${nik}', '${name}', '${t.groupId}', '${t.groupName}', '${t.qualId}', '${t.name}', ${t.profId}, '${t.profDesc}', '${t.startDate}', '${t.endDate}', false, true)
      ON CONFLICT DO NOTHING;
    `);
  }

  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

