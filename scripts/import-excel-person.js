const { spawnSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function clean(val) {
  return typeof val === 'string' ? val.trim() : '';
}

function parseLevel(val) {
  if (val === null || val === undefined) return null;
  const match = String(val).match(/[1-5]/);
  return match ? parseInt(match[0], 10) : null;
}

function readWorkbook(filePath) {
  const cmd = `
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  & ./prisma/read-xlsx.ps1 -Path '${filePath}'
  `;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(result.stdout);
}

function buildCode(prefix, name) {
  return `${prefix}-${name}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

async function importExcelPersonSheets() {
  const files = [
    'D:/download/Technical Competency Mapping OSREL Final.xlsx',
    'D:/download/TECHNICAL COMPETENCY OHS Final.xlsx',
    'D:/download/TECHNICAL COMPETENCY System Compliance  Environment Final.xlsx',
  ];

  let totalExcelAssessments = 0;

  for (const f of files) {
    const wb = readWorkbook(f);
    console.log(`Processing ${wb.file}...`);

    for (const sheet of wb.sheets.filter(s => /person/i.test(s.name))) {
      // Find header row: contains NIK and Name
      const headerIndex = sheet.rows.findIndex(r => r.some(c => /^nik$/i.test(clean(c))) && r.some(c => /^name$/i.test(clean(c))));
      if (headerIndex < 0) {
        console.log(`  Skipping ${sheet.name}: header not found`);
        continue;
      }

      // Competency header is typically at row 3 or headerIndex - something
      // Look for a row that has competency names
      let compRowIndex = -1;
      for (let r = 0; r <= headerIndex; r++) {
        if (sheet.rows[r].some(c => /manajemen|keselamatan|lingkungan|social|community/i.test(clean(c)))) {
          compRowIndex = r;
          break;
        }
      }
      if (compRowIndex < 0) compRowIndex = 3; // fallback

      const header = sheet.rows[headerIndex].map(clean);
      const nikCol = header.findIndex(c => /^nik$/i.test(c));
      const nameCol = header.findIndex(c => /^name$/i.test(c));
      const jobCol = header.findIndex(c => /^job$/i.test(c));
      const posGroupCol = header.findIndex(c => /^position$/i.test(c));
      const compStartCol = Math.max(nikCol, nameCol, jobCol, posGroupCol) + 2; // after job desc

      const compNames = sheet.rows[compRowIndex].map(clean);

      console.log(`  Sheet ${sheet.name}: headerIndex=${headerIndex}, compRow=${compRowIndex}, compStartCol=${compStartCol}`);

      const categoryName = /osrel/i.test(wb.file) ? 'OSREL' : (/ohs/i.test(wb.file) ? 'OHS' : 'System Compliance & Environment');
      const catCode = buildCode('CAT', categoryName);
      const cat = await prisma.talentSkillCategory.upsert({
        where: { code: catCode },
        update: { name: categoryName },
        create: { code: catCode, name: categoryName }
      });

      for (let r = headerIndex + 1; r < sheet.rows.length; r++) {
        const row = sheet.rows[r];
        const nik = clean(row[nikCol]);
        const name = clean(row[nameCol]);
        const job = clean(row[jobCol]);
        const posGroup = posGroupCol >= 0 ? clean(row[posGroupCol]) : null;
        if (!name || !job) continue;

        for (let col = compStartCol; col < row.length; col++) {
          const compName = clean(compNames[col]);
          const level = parseLevel(row[col]);
          if (!compName || !level) continue;

          const skillCode = buildCode(categoryName, compName);
          const skill = await prisma.talentSkill.upsert({
            where: { skillCode },
            update: { skillName: compName, categoryId: cat.id },
            create: { skillCode, skillName: compName, categoryId: cat.id, isActive: true }
          });

          await prisma.talentPersonSkillAssessment.upsert({
            where: {
              employeeName_positionName_skillId_sourceFile_sourceSheet: {
                employeeName: name,
                positionName: job,
                skillId: skill.id,
                sourceFile: wb.file,
                sourceSheet: sheet.name,
              }
            },
            update: {
              employeeCode: nik || null,
              positionGroup: posGroup,
              currentLevel: level,
              updatedAt: new Date()
            },
            create: {
              employeeCode: nik || null,
              employeeName: name,
              positionName: job,
              positionGroup: posGroup,
              skillId: skill.id,
              currentLevel: level,
              sourceFile: wb.file,
              sourceSheet: sheet.name,
              importedAt: new Date()
            }
          });
          totalExcelAssessments++;
        }
      }
    }
  }

  console.log(`\nExcel person assessment import completed! Inserted/updated: ${totalExcelAssessments}`);
}

importExcelPersonSheets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

