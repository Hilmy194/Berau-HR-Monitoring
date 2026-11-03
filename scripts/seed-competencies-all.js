const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function buildCode(prefix, name) {
  return `${prefix}-${name}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

async function run() {
  console.log("=== SEEDING & SYNCING COMPETENCIES FOR PRODUCTION ===");

  // 1. Ensure table bq_raw.p_employee_competencies exists
  console.log("1. Ensuring table bq_raw.p_employee_competencies exists...");
  await prisma.$executeRawUnsafe(`
    CREATE SCHEMA IF NOT EXISTS bq_raw;
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
    CREATE INDEX IF NOT EXISTS idx_p_emp_comp_nik ON bq_raw.p_employee_competencies(personnel_number);
  `);

  const countRes = await prisma.$queryRawUnsafe(`SELECT count(*) as total FROM bq_raw.p_employee_competencies`);
  const currentCount = Number(countRes[0]?.total ?? 0);
  console.log(`Current rows in bq_raw.p_employee_competencies: ${currentCount}`);

  if (currentCount === 0) {
    const jsonPath = path.join(__dirname, '../src/lib/data/manual-competencies.json');
    if (fs.existsSync(jsonPath)) {
      console.log("Populating bq_raw.p_employee_competencies from manual-competencies.json...");
      const manualData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const employees = manualData.employees || {};
      const entries = [];

      for (const [nik, emp] of Object.entries(employees)) {
        for (const s of (emp.soft || [])) {
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
        for (const t of (emp.technical || [])) {
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
          `('${c.nik.replace(/'/g, "''")}', '${(c.name || '').replace(/'/g, "''")}', '${c.groupId}', '${(c.groupName || '').replace(/'/g, "''")}', '${c.qualId}', '${(c.qualName || '').replace(/'/g, "''")}', ${c.profId}, '${(c.profDesc || '').replace(/'/g, "''")}', '${c.startDate || ''}', '${c.endDate || ''}', ${c.isSoft}, true)`
        ).join(",");

        await prisma.$executeRawUnsafe(`
          INSERT INTO bq_raw.p_employee_competencies (personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, start_date, end_date, is_soft, is_current)
          VALUES ${valueStrings}
        `);
      }
      console.log(`Successfully populated bq_raw.p_employee_competencies with ${entries.length} rows.`);
    }
  }

  // 2. Sync to talent_person_skill_assessments
  console.log("2. Syncing to talent_person_skill_assessments...");
  const emps = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (personnel_number)
      personnel_number, employee_name, position_name, department, divisi, direktorat
    FROM bq_raw.p_emps
    ORDER BY personnel_number, data_period DESC
  `);
  const empMap = new Map();
  for (const e of emps) {
    empMap.set(e.personnel_number, e);
  }

  const compRows = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (personnel_number, qual_id)
      personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, is_soft
    FROM bq_raw.p_employee_competencies
    WHERE prof_id > 0
    ORDER BY personnel_number, qual_id, is_current DESC
  `);
  console.log(`Found ${compRows.length} active competency rows to sync.`);

  const categoryMap = new Map();
  const skillMap = new Map();

  const existingCategories = await prisma.talentSkillCategory.findMany();
  for (const c of existingCategories) {
    categoryMap.set(c.name.toLowerCase().trim(), c.id);
  }

  const existingSkills = await prisma.talentSkill.findMany();
  for (const s of existingSkills) {
    skillMap.set(s.skillName.toLowerCase().trim(), s.id);
  }

  for (const row of compRows) {
    const catName = (row.group_name || (row.is_soft ? 'Soft Competency' : 'Technical Competency')).trim();
    const catKey = catName.toLowerCase();
    let catId = categoryMap.get(catKey);
    if (!catId) {
      const code = buildCode('CAT', catName);
      const createdCat = await prisma.talentSkillCategory.upsert({
        where: { code },
        update: { name: catName, description: catName },
        create: { code, name: catName, description: catName }
      });
      catId = createdCat.id;
      categoryMap.set(catKey, catId);
    }

    const skillName = row.qual_name.trim();
    const skillKey = skillName.toLowerCase();
    let skillId = skillMap.get(skillKey);
    if (!skillId) {
      const skillCode = buildCode(catName, skillName);
      const createdSkill = await prisma.talentSkill.upsert({
        where: { skillCode },
        update: { skillName, categoryId: catId },
        create: {
          skillCode,
          skillName,
          categoryId: catId,
          sourceFile: 'BigQuery / SAP Export',
          isActive: true
        }
      });
      skillId = createdSkill.id;
      skillMap.set(skillKey, skillId);
    }
  }

  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < compRows.length; i += batchSize) {
    const batch = compRows.slice(i, i + batchSize);
    for (const r of batch) {
      const emp = empMap.get(r.personnel_number);
      const empName = emp?.employee_name || r.employee_name || `Employee ${r.personnel_number}`;
      const posName = emp?.position_name || 'Unassigned Position';
      const skillId = skillMap.get(r.qual_name.trim().toLowerCase());
      if (!skillId) continue;

      const sourceFile = 'BigQuery p_employee_competencies';
      const sourceSheet = r.group_name || 'Competencies';

      await prisma.talentPersonSkillAssessment.upsert({
        where: {
          employeeName_positionName_skillId_sourceFile_sourceSheet: {
            employeeName: empName,
            positionName: posName,
            skillId,
            sourceFile,
            sourceSheet,
          }
        },
        update: {
          employeeCode: r.personnel_number,
          currentLevel: r.prof_id,
          updatedAt: new Date()
        },
        create: {
          employeeCode: r.personnel_number,
          employeeName: empName,
          positionName: posName,
          skillId,
          currentLevel: r.prof_id,
          sourceFile,
          sourceSheet,
          importedAt: new Date()
        }
      });
      inserted++;
    }
  }

  console.log(`Successfully synced ${inserted} assessments to talent_person_skill_assessments!`);
  console.log("=== SYNC COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error).finally(() => prisma.$disconnect());
