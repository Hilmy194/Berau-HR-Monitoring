const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildCode(prefix, name) {
  return `${prefix}-${name}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

async function syncCompetencyAssessments() {
  console.log('--- Starting Competency Assessment Sync ---');

  // 1. Get latest employee positions from bq_raw.p_emps
  const emps = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (personnel_number)
      personnel_number, employee_name, position_name, department, divisi, direktorat
    FROM bq_raw.p_emps
    ORDER BY personnel_number, data_period DESC
  `);
  console.log(`Loaded ${emps.length} unique employees from bq_raw.p_emps`);
  const empMap = new Map();
  for (const e of emps) {
    empMap.set(e.personnel_number, e);
  }

  // 2. Get active competency scores from bq_raw.p_employee_competencies
  const compRows = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (personnel_number, qual_id)
      personnel_number, employee_name, group_id, group_name, qual_id, qual_name, prof_id, prof_desc, is_soft
    FROM bq_raw.p_employee_competencies
    WHERE prof_id > 0
    ORDER BY personnel_number, qual_id, is_current DESC
  `);
  console.log(`Loaded ${compRows.length} active competency records from bq_raw.p_employee_competencies`);

  // 3. Ensure TalentSkillCategory and TalentSkill exist for each
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

  let skillsCreated = 0;
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
      skillsCreated++;
    }
  }
  console.log(`Synced skills: ${skillsCreated} new skills created. Total skills in map: ${skillMap.size}`);

  // 4. Batch upsert into talent_person_skill_assessments
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
    process.stdout.write(`\rUpserted ${inserted} / ${compRows.length} assessments...`);
  }

  console.log(`\nAssessment sync completed successfully! Total assessments: ${inserted}`);
}

syncCompetencyAssessments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
