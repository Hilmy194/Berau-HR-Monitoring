import { spawnSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const COMPETENCY_FILES = [
  "../competency/Technical Competency Mapping OSREL Final.xlsx",
  "../competency/Competency_MINING_MINE PLAN_GEOLOGY_CONSTRUCTION_Last.XLSX",
  "../competency/TECHNICAL COMPETENCY OHS Final.xlsx",
  "../competency/TECHNICAL COMPETENCY System Compliance  Environment Final.xlsx",
];

type Workbook = {
  file: string;
  sheets: WorkbookSheet[];
};

type WorkbookSheet = {
  name: string;
  rows: string[][];
};

type ImportSummary = {
  filesProcessed: number;
  positionsInserted: number;
  positionsUpdated: number;
  competenciesInserted: number;
  competenciesUpdated: number;
  requirementsInserted: number;
  requirementsUpdated: number;
  personAssessmentsInserted: number;
  personAssessmentsUpdated: number;
  levelsInserted: number;
  levelsUpdated: number;
  rowsSkipped: number;
  validationErrors: string[];
};

type CompetencyLevelInput = {
  competencyName: string;
  level: number;
  description: string;
  indicators: string[];
  category: string;
  sourceFile: string;
};

type RequirementInput = {
  positionName: string;
  positionGroup: string | null;
  directorate: string;
  division: string;
  department: string;
  functionalArea: string | null;
  jobDescription: string | null;
  currentHolder: string | null;
  competencyName: string;
  competencyCategory: string;
  competencyDefinition: string | null;
  priorityLevel: number;
  sourceFile: string;
  sourceSheet: string;
};

type PersonAssessmentInput = {
  employeeCode: string | null;
  employeeName: string;
  positionName: string;
  positionGroup: string | null;
  competencyName: string;
  competencyCategory: string;
  competencyDefinition: string | null;
  currentLevel: number;
  sourceFile: string;
  sourceSheet: string;
};

type PositionMetadata = {
  holders: Set<string>;
  jobDescription: string | null;
};

type MiningPositionLookup = {
  positionName: string;
  positionGroup: string | null;
  jobFamily: string;
  jobDescription: string | null;
};

async function main() {
  const summary: ImportSummary = {
    filesProcessed: 0,
    positionsInserted: 0,
    positionsUpdated: 0,
    competenciesInserted: 0,
    competenciesUpdated: 0,
    requirementsInserted: 0,
    requirementsUpdated: 0,
    personAssessmentsInserted: 0,
    personAssessmentsUpdated: 0,
    levelsInserted: 0,
    levelsUpdated: 0,
    rowsSkipped: 0,
    validationErrors: [],
  };

  for (const relativeFile of COMPETENCY_FILES) {
    const absoluteFile = path.resolve(process.cwd(), relativeFile);
    const workbook = readWorkbook(absoluteFile);
    summary.filesProcessed += 1;

    await cleanupPositionRequirementsForWorkbook(workbook);
    await cleanupPersonAssessmentsForWorkbook(workbook);
    await cleanupPositionsForWorkbook(workbook);
    await importMasterStructure(workbook, summary);

    const levelInputs = parseCompetencyDictionary(workbook);
    for (const input of levelInputs) {
      await upsertCompetencyLevel(input, summary);
    }

    const requirementInputs = parsePositionRequirements(workbook, summary);
    for (const input of requirementInputs) {
      await upsertPositionRequirement(input, summary);
    }

    const personAssessmentInputs = parsePersonAssessments(workbook, summary);
    for (const input of personAssessmentInputs) {
      await upsertPersonAssessment(input, summary);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

function readWorkbook(filePath: string): Workbook {
  const parserPath = path.resolve(process.cwd(), "prisma/read-xlsx.ps1");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", parserPath, "-Path", filePath], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Failed to read ${filePath}: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown parser error"}`);
  }

  return JSON.parse(result.stdout) as Workbook;
}

async function importMasterStructure(workbook: Workbook, summary: ImportSummary) {
  const sheet = workbook.sheets.find((item) => item.name.toLocaleLowerCase("id-ID") === "master");
  if (!sheet) return;

  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /object description/i.test(cell)));
  if (headerIndex < 0) return;
  const header = sheet.rows[headerIndex].map(clean);
  const objectTypeColumn = header.findIndex((cell) => /object type/i.test(cell));
  const objectIdColumn = header.findIndex((cell) => /object id/i.test(cell));
  const statusColumn = header.findIndex((cell) => /status/i.test(cell));
  const holderColumn = header.findIndex((cell) => /^relationship obj \(text\)$/i.test(cell));
  const parentColumn = header.findIndex((cell) => /parent relationship obj \(text\)/i.test(cell));
  const jobFamilyColumn = header.findIndex((cell) => /job family/i.test(cell));
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const descriptionColumn = header.findIndex((cell) => /job desc responsibil/i.test(cell));
  const roleColumn = header.findIndex((cell) => /job desc role/i.test(cell));

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const objectType = clean(row[objectTypeColumn]);
    const objectId = clean(row[objectIdColumn]);
    const positionName = clean(row[jobColumn]) || clean(row[0]);
    if (objectType !== "S" || !objectId || !positionName || !/active/i.test(clean(row[statusColumn]))) {
      summary.rowsSkipped += 1;
      continue;
    }

    const jobFamily = clean(row[jobFamilyColumn]) || inferMasterDivision(`${clean(row[parentColumn])} ${positionName}`);
    const departmentName = clean(row[parentColumn]) || jobFamily;
    const department = await upsertOrganization({
      directorate: inferDirectorate(jobFamily),
      division: jobFamily,
      department: departmentName,
    });
    const positionCode = buildCode("SAP", objectId);
    const existingPosition = await prisma.organizationPosition.findUnique({ where: { positionCode } });
    const jobDescription = bestText(clean(row[descriptionColumn]), clean(row[roleColumn]));

    await prisma.organizationPosition.upsert({
      where: { positionCode },
      update: {
        departmentId: department.id,
        positionName,
        jobLevel: normalizeMasterLevel(positionName),
        positionSummary: jobDescription ?? undefined,
        jobDescription: jobDescription ?? undefined,
        currentHolder: clean(row[holderColumn]) || null,
        sourceFile: workbook.file,
        sourceSheet: sheet.name,
        importedAt: new Date(),
        isManagerial: /manager|gm|superintendent|supervisor|supt/i.test(positionName),
        isActive: true,
      },
      create: {
        departmentId: department.id,
        positionCode,
        positionName,
        jobLevel: normalizeMasterLevel(positionName),
        positionSummary: jobDescription,
        jobDescription,
        currentHolder: clean(row[holderColumn]) || null,
        sourceFile: workbook.file,
        sourceSheet: sheet.name,
        importedAt: new Date(),
        isManagerial: /manager|gm|superintendent|supervisor|supt/i.test(positionName),
        isActive: true,
      },
    });

    if (existingPosition) summary.positionsUpdated += 1;
    else summary.positionsInserted += 1;
  }
}

function inferMasterDivision(value: string) {
  const normalizedValue = value.toLocaleLowerCase("id-ID");
  if (/geolog|exploration/.test(normalizedValue)) return "Geology & Exploration";
  if (/plan|planning|survey/.test(normalizedValue)) return "Mine Planning";
  if (/construction|infrastructure|facility|project/.test(normalizedValue)) return "Mining Infrastructure & Project";
  if (/cpp|coal processing|hauling/.test(normalizedValue)) return "Coal Processing Plant";
  return "Mining Operation";
}

function normalizeMasterLevel(positionName: string) {
  const value = positionName.toLocaleLowerCase("id-ID");
  if (/\bgm\b|general manager/.test(value)) return "GM";
  if (/sr\.?\s*manager|senior manager|manager/.test(value)) return "Sr Manager / Manager";
  if (/superintendent|\bsupt\b|sr\.?\s*specialist|senior specialist/.test(value)) return "Superintendent / Sr Specialist";
  if (/supervisor|specialist/.test(value)) return "Supervisor / Specialist";
  if (/foreman/.test(value)) return "Foreman";
  if (/operator/.test(value)) return "Operator";
  return "Engineer / Officer";
}

function parseCompetencyDictionary(workbook: Workbook): CompetencyLevelInput[] {
  const category = inferCategory(workbook.file);
  const inputs: CompetencyLevelInput[] = [];
  const dictionarySheets = workbook.sheets.filter((sheet) => normalize(sheet.name).includes("kamuskompetensi"));

  for (const sheet of dictionarySheets) {
    const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /jenis kompetensi/i.test(cell)) && row.some((cell) => /^level$/i.test(clean(cell))));
    if (headerIndex < 0) continue;
    const header = sheet.rows[headerIndex].map(clean);
    const competencyColumn = header.findIndex((cell) => /jenis kompetensi/i.test(cell));
    const levelColumn = header.findIndex((cell) => /^level$/i.test(cell));
    const descriptionColumn = header.findIndex((cell) => /deskripsi/i.test(cell));
    if (competencyColumn < 0 || levelColumn < 0 || descriptionColumn < 0) continue;

    for (const row of sheet.rows.slice(headerIndex + 1)) {
      const rawName = clean(row[competencyColumn]);
      const level = parseLevel(row[levelColumn]);
      if (!rawName || !level) continue;
      const competencyName = normalizeCompetencyName(rawName);
      const indicators = row.slice(descriptionColumn).map(clean).filter(Boolean);
      const description = indicators[0] ?? "";
      inputs.push({
        competencyName,
        level,
        description,
        indicators,
        category,
        sourceFile: workbook.file,
      });
    }
  }

  return inputs;
}

function parsePositionRequirements(workbook: Workbook, summary: ImportSummary): RequirementInput[] {
  const inputs: RequirementInput[] = [];
  const metadata = buildPositionMetadata(workbook);
  for (const sheet of workbook.sheets) {
    if (/person/i.test(sheet.name)) continue;
    if (/position qualification/i.test(sheet.name)) {
      inputs.push(...parseMiningPositionQualification(workbook.file, sheet, summary, metadata));
      continue;
    }
    if (/position/i.test(sheet.name)) {
      inputs.push(...parseWidePositionSheet(workbook.file, sheet, summary, metadata));
    }
  }
  return inputs;
}

function parseMiningPositionQualification(sourceFile: string, sheet: WorkbookSheet, summary: ImportSummary, metadata: Map<string, PositionMetadata>): RequirementInput[] {
  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /functional area/i.test(cell)) && row.some((cell) => /^job$/i.test(clean(cell))));
  if (headerIndex < 0) return [];

  const header = sheet.rows[headerIndex].map(clean);
  const functionalAreaColumn = header.findIndex((cell) => /functional area/i.test(cell));
  const jobFamilyColumn = header.findIndex((cell) => /job family/i.test(cell));
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const levelColumn = header.findIndex((cell) => /ps level/i.test(cell));
  const responsibilityColumn = header.findIndex((cell) => /responsibil/i.test(cell));
  const roleColumn = header.findIndex((cell) => /job desc role/i.test(cell));
  const competencyStartColumn = roleColumn + 1;
  const competencyHeaders = header.slice(competencyStartColumn);
  const inputs: RequirementInput[] = [];

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const positionName = clean(row[jobColumn]);
    if (!positionName) {
      summary.rowsSkipped += 1;
      continue;
    }
    const functionalArea = clean(row[functionalAreaColumn]) || "Mining";
    const jobFamily = clean(row[jobFamilyColumn]) || functionalArea;
    const positionGroup = clean(row[levelColumn]) ? `PS Level ${clean(row[levelColumn])}` : null;
    const positionMetadata = getPositionMetadata(metadata, positionName, positionGroup);
    const jobDescription = bestText(clean(row[responsibilityColumn]), clean(row[roleColumn]), positionMetadata?.jobDescription);
    const currentHolder = formatHolders(positionMetadata?.holders);

    competencyHeaders.forEach((competencyName, offset) => {
      const priorityLevel = parseLevel(row[competencyStartColumn + offset]);
      if (!clean(competencyName) || !priorityLevel) return;
      inputs.push({
        positionName,
        positionGroup,
        directorate: inferDirectorate(jobFamily),
        division: jobFamily,
        department: jobFamily,
        functionalArea,
        jobDescription,
        currentHolder,
        competencyName: clean(competencyName),
        competencyCategory: jobFamily,
        competencyDefinition: null,
        priorityLevel,
        sourceFile,
        sourceSheet: sheet.name,
      });
    });
  }

  return inputs;
}

function parseWidePositionSheet(sourceFile: string, sheet: WorkbookSheet, summary: ImportSummary, metadata: Map<string, PositionMetadata>): RequirementInput[] {
  const competencyRowIndex = sheet.rows.findIndex((row) => row.some((cell) => /^technical competency$/i.test(clean(cell))));
  const nameRowIndex = sheet.rows.findIndex((row) => row.some((cell) => /^position( name)?$/i.test(clean(cell))));
  const levelRowIndex = sheet.rows.findIndex((row) => row.some((cell) => /level (of )?competency/i.test(cell)));
  if (competencyRowIndex < 0 || nameRowIndex < 0 || levelRowIndex < 0) return [];

  const competencyHeaderRow = sheet.rows[competencyRowIndex + 1] ?? [];
  const definitionRow = sheet.rows.find((row) => row.some((cell) => /definition of competency/i.test(cell))) ?? [];
  const category = inferCategory(sourceFile, sheet.name);
  const dataStartIndex = levelRowIndex + 1;
  const competencyStartColumn = findCompetencyStartColumn(competencyHeaderRow, sheet.rows[dataStartIndex]);
  const inputs: RequirementInput[] = [];
  let positionGroup: string | null = null;
  const jobDescriptionsByPosition = new Map<string, string>();

  for (const row of sheet.rows.slice(dataStartIndex)) {
    const maybeGroup = clean(row[0]);
    if (maybeGroup) positionGroup = maybeGroup;
    const positionName = clean(row[1]);
    if (!positionName) {
      summary.rowsSkipped += 1;
      continue;
    }
    const positionMetadata = getPositionMetadata(metadata, positionName, positionGroup);
    const jobDescription = bestText(
      ...row.slice(2, competencyStartColumn).map(clean),
      positionMetadata?.jobDescription,
    ) ?? jobDescriptionsByPosition.get(positionKey(positionName)) ?? null;
    if (jobDescription) jobDescriptionsByPosition.set(positionKey(positionName), jobDescription);
    const currentHolder = formatHolders(positionMetadata?.holders);

    for (let column = competencyStartColumn; column < competencyHeaderRow.length; column += 1) {
      const competencyName = clean(competencyHeaderRow[column]);
      const priorityLevel = parseLevel(row[column]);
      if (!competencyName || !priorityLevel) continue;
      inputs.push({
        positionName,
        positionGroup,
        directorate: inferDirectorate(category),
        division: category,
        department: category,
        functionalArea: category,
        jobDescription,
        currentHolder,
        competencyName,
        competencyCategory: category,
        competencyDefinition: clean(definitionRow[column]) || null,
        priorityLevel,
        sourceFile,
        sourceSheet: sheet.name,
      });
    }
  }

  return inputs;
}

function parsePersonAssessments(workbook: Workbook, summary: ImportSummary): PersonAssessmentInput[] {
  const inputs: PersonAssessmentInput[] = [];
  const miningLookup = buildMiningPositionLookup(workbook);
  for (const sheet of workbook.sheets.filter((item) => /person/i.test(item.name))) {
    if (/person qualification/i.test(sheet.name)) {
      inputs.push(...parseMiningPersonAssessments(workbook.file, sheet, miningLookup, summary));
      continue;
    }
    inputs.push(...parseWidePersonAssessments(workbook.file, sheet, summary));
  }
  return inputs;
}

function parseMiningPersonAssessments(sourceFile: string, sheet: WorkbookSheet, lookup: Map<string, MiningPositionLookup>, summary: ImportSummary) {
  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /object id/i.test(cell)) && row.some((cell) => /relationship obj \(text\)/i.test(cell)));
  if (headerIndex < 0) return [];

  const header = sheet.rows[headerIndex].map(clean);
  const objectIdColumn = header.findIndex((cell) => /object id/i.test(cell));
  const employeeCodeColumn = header.findIndex((cell) => /^relationship obj$/i.test(cell));
  const employeeNameColumn = header.findIndex((cell) => /relationship obj \(text\)/i.test(cell));
  const competencyStartColumn = employeeNameColumn + 1;
  const inputs: PersonAssessmentInput[] = [];

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const position = lookup.get(clean(row[objectIdColumn]));
    const employeeName = clean(row[employeeNameColumn]);
    if (!position || !employeeName) {
      summary.rowsSkipped += 1;
      continue;
    }

    for (let column = competencyStartColumn; column < header.length; column += 1) {
      const competencyName = clean(header[column]);
      const currentLevel = parseLevel(row[column]);
      if (!competencyName || /jumlah competency/i.test(competencyName) || !currentLevel) continue;
      inputs.push({
        employeeCode: clean(row[employeeCodeColumn]) || null,
        employeeName,
        positionName: position.positionName,
        positionGroup: position.positionGroup,
        competencyName,
        competencyCategory: position.jobFamily,
        competencyDefinition: null,
        currentLevel,
        sourceFile,
        sourceSheet: sheet.name,
      });
    }
  }

  return inputs;
}

function parseWidePersonAssessments(sourceFile: string, sheet: WorkbookSheet, summary: ImportSummary) {
  const competencyRowIndex = sheet.rows.findIndex((row) => row.some((cell) => /^technical competency$/i.test(clean(cell))));
  const levelRowIndex = sheet.rows.findIndex((row) => row.some((cell) => /level (of )?competency/i.test(cell)));
  const personHeaderIndex = sheet.rows.findIndex((row) => row.some((cell) => /^position$/i.test(clean(cell))) && row.some((cell) => /^job$/i.test(clean(cell))) && row.some((cell) => /^name$/i.test(clean(cell))));
  if (competencyRowIndex < 0 || levelRowIndex < 0 || personHeaderIndex < 0) return [];

  const competencyHeaderRow = sheet.rows[competencyRowIndex + 1] ?? [];
  const definitionRow = sheet.rows.find((row) => row.some((cell) => /definition of competency/i.test(cell))) ?? [];
  const personHeader = sheet.rows[personHeaderIndex].map(clean);
  const positionGroupColumn = personHeader.findIndex((cell) => /^position$/i.test(cell));
  const positionNameColumn = personHeader.findIndex((cell) => /^job$/i.test(cell));
  const employeeCodeColumn = personHeader.findIndex((cell) => /^nik$/i.test(cell));
  const employeeNameColumn = personHeader.findIndex((cell) => /^name$/i.test(cell));
  const competencyStartColumn = findCompetencyStartColumn(competencyHeaderRow, sheet.rows[levelRowIndex + 1]);
  const category = inferCategory(sourceFile, sheet.name);
  const inputs: PersonAssessmentInput[] = [];
  let positionGroup: string | null = null;

  for (const row of sheet.rows.slice(personHeaderIndex + 1)) {
    const maybeGroup = clean(row[positionGroupColumn]);
    if (maybeGroup) positionGroup = maybeGroup;
    const positionName = clean(row[positionNameColumn]);
    const employeeName = clean(row[employeeNameColumn]);
    if (!positionName || !employeeName) {
      summary.rowsSkipped += 1;
      continue;
    }

    for (let column = competencyStartColumn; column < competencyHeaderRow.length; column += 1) {
      const competencyName = clean(competencyHeaderRow[column]);
      const currentLevel = parseLevel(row[column]);
      if (!competencyName || !currentLevel) continue;
      inputs.push({
        employeeCode: clean(row[employeeCodeColumn]) || null,
        employeeName,
        positionName,
        positionGroup,
        competencyName,
        competencyCategory: category,
        competencyDefinition: clean(definitionRow[column]) || null,
        currentLevel,
        sourceFile,
        sourceSheet: sheet.name,
      });
    }
  }

  return inputs;
}

function buildMiningPositionLookup(workbook: Workbook) {
  const lookup = new Map<string, MiningPositionLookup>();
  const masterSheet = workbook.sheets.find((item) => item.name.toLocaleLowerCase("id-ID") === "master");
  if (!masterSheet) return lookup;

  const headerIndex = masterSheet.rows.findIndex((row) => row.some((cell) => /object description/i.test(cell)));
  if (headerIndex < 0) return lookup;
  const header = masterSheet.rows[headerIndex].map(clean);
  const objectIdColumn = header.findIndex((cell) => /object id/i.test(cell));
  const objectTypeColumn = header.findIndex((cell) => /object type/i.test(cell));
  const statusColumn = header.findIndex((cell) => /status/i.test(cell));
  const jobFamilyColumn = header.findIndex((cell) => /job family/i.test(cell));
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const descriptionColumn = header.findIndex((cell) => /job desc responsibil/i.test(cell));
  const roleColumn = header.findIndex((cell) => /job desc role/i.test(cell));
  const positionGroups = buildMiningPositionGroups(workbook);

  for (const row of masterSheet.rows.slice(headerIndex + 1)) {
    const objectId = clean(row[objectIdColumn]);
    const positionName = clean(row[jobColumn]);
    if (!objectId || !positionName || clean(row[objectTypeColumn]) !== "S" || !/active/i.test(clean(row[statusColumn]))) continue;
    const jobFamily = clean(row[jobFamilyColumn]) || "Mining Operation";
    lookup.set(objectId, {
      positionName,
      positionGroup: positionGroups.get(positionKey(positionName)) ?? null,
      jobFamily,
      jobDescription: bestText(clean(row[descriptionColumn]), clean(row[roleColumn])),
    });
  }

  return lookup;
}

function buildMiningPositionGroups(workbook: Workbook) {
  const groups = new Map<string, string>();
  const sheet = workbook.sheets.find((item) => /position qualification/i.test(item.name));
  if (!sheet) return groups;
  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /functional area/i.test(cell)) && row.some((cell) => /^job$/i.test(clean(cell))));
  if (headerIndex < 0) return groups;
  const header = sheet.rows[headerIndex].map(clean);
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const levelColumn = header.findIndex((cell) => /ps level/i.test(cell));
  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const positionName = clean(row[jobColumn]);
    const level = clean(row[levelColumn]);
    if (positionName && level) groups.set(positionKey(positionName), `PS Level ${level}`);
  }
  return groups;
}

function buildPositionMetadata(workbook: Workbook) {
  const metadata = new Map<string, PositionMetadata>();
  addMasterPositionMetadata(workbook, metadata);

  for (const sheet of workbook.sheets.filter((item) => /person/i.test(item.name))) {
    if (/person qualification/i.test(sheet.name)) {
      addMiningPersonMetadata(workbook, sheet, metadata);
      continue;
    }
    addWidePersonMetadata(sheet, metadata);
  }

  return metadata;
}

function addMasterPositionMetadata(workbook: Workbook, metadata: Map<string, PositionMetadata>) {
  const sheet = workbook.sheets.find((item) => item.name.toLocaleLowerCase("id-ID") === "master");
  if (!sheet) return;

  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /object description/i.test(cell)));
  if (headerIndex < 0) return;
  const header = sheet.rows[headerIndex].map(clean);
  const objectTypeColumn = header.findIndex((cell) => /object type/i.test(cell));
  const statusColumn = header.findIndex((cell) => /status/i.test(cell));
  const holderColumn = header.findIndex((cell) => /^relationship obj \(text\)$/i.test(cell));
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const descriptionColumn = header.findIndex((cell) => /job desc responsibil/i.test(cell));
  const roleColumn = header.findIndex((cell) => /job desc role/i.test(cell));

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const positionName = clean(row[jobColumn]);
    if (!positionName || clean(row[objectTypeColumn]) !== "S" || !/active/i.test(clean(row[statusColumn]))) continue;
    addPositionMetadata(metadata, {
      positionName,
      holder: clean(row[holderColumn]) || null,
      jobDescription: bestText(clean(row[descriptionColumn]), clean(row[roleColumn])),
    });
  }
}

function addMiningPersonMetadata(workbook: Workbook, sheet: WorkbookSheet, metadata: Map<string, PositionMetadata>) {
  const masterSheet = workbook.sheets.find((item) => item.name.toLocaleLowerCase("id-ID") === "master");
  if (!masterSheet) return;

  const masterHeaderIndex = masterSheet.rows.findIndex((row) => row.some((cell) => /object description/i.test(cell)));
  if (masterHeaderIndex < 0) return;
  const masterHeader = masterSheet.rows[masterHeaderIndex].map(clean);
  const masterObjectIdColumn = masterHeader.findIndex((cell) => /object id/i.test(cell));
  const masterJobColumn = masterHeader.findIndex((cell) => /^job$/i.test(cell));
  const masterDescriptionColumn = masterHeader.findIndex((cell) => /job desc responsibil/i.test(cell));
  const masterRoleColumn = masterHeader.findIndex((cell) => /job desc role/i.test(cell));
  const jobsByObjectId = new Map<string, { positionName: string; jobDescription: string | null }>();

  for (const row of masterSheet.rows.slice(masterHeaderIndex + 1)) {
    const objectId = clean(row[masterObjectIdColumn]);
    const positionName = clean(row[masterJobColumn]);
    if (!objectId || !positionName) continue;
    jobsByObjectId.set(objectId, {
      positionName,
      jobDescription: bestText(clean(row[masterDescriptionColumn]), clean(row[masterRoleColumn])),
    });
  }

  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /object id/i.test(cell)) && row.some((cell) => /relationship obj \(text\)/i.test(cell)));
  if (headerIndex < 0) return;
  const header = sheet.rows[headerIndex].map(clean);
  const objectIdColumn = header.findIndex((cell) => /object id/i.test(cell));
  const holderColumn = header.findIndex((cell) => /relationship obj \(text\)/i.test(cell));

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const position = jobsByObjectId.get(clean(row[objectIdColumn]));
    if (!position) continue;
    addPositionMetadata(metadata, {
      positionName: position.positionName,
      holder: clean(row[holderColumn]) || null,
      jobDescription: position.jobDescription,
    });
  }
}

function addWidePersonMetadata(sheet: WorkbookSheet, metadata: Map<string, PositionMetadata>) {
  const headerIndex = sheet.rows.findIndex((row) => row.some((cell) => /^position$/i.test(clean(cell))) && row.some((cell) => /^job$/i.test(clean(cell))) && row.some((cell) => /^name$/i.test(clean(cell))));
  if (headerIndex < 0) return;

  const header = sheet.rows[headerIndex].map(clean);
  const groupColumn = header.findIndex((cell) => /^position$/i.test(cell));
  const jobColumn = header.findIndex((cell) => /^job$/i.test(cell));
  const holderColumn = header.findIndex((cell) => /^name$/i.test(cell));
  const descriptionColumn = header.findIndex((cell) => /job desc responsibil/i.test(cell));
  let positionGroup: string | null = null;

  for (const row of sheet.rows.slice(headerIndex + 1)) {
    const maybeGroup = clean(row[groupColumn]);
    if (maybeGroup) positionGroup = maybeGroup;
    const positionName = clean(row[jobColumn]);
    if (!positionName) continue;
    addPositionMetadata(metadata, {
      positionName,
      positionGroup,
      holder: clean(row[holderColumn]) || null,
      jobDescription: clean(row[descriptionColumn]) || null,
    });
  }
}

async function cleanupPositionRequirementsForWorkbook(workbook: Workbook) {
  const sourceSheets = workbook.sheets
    .filter((sheet) => /position|qualification/i.test(sheet.name) && !/person/i.test(sheet.name))
    .map((sheet) => sheet.name);

  for (const sourceSheet of sourceSheets) {
    await prisma.talentPositionSkillRequirement.deleteMany({
      where: {
        sourceFile: workbook.file,
        sourceSheet,
      },
    });
  }
}

async function cleanupPersonAssessmentsForWorkbook(workbook: Workbook) {
  const sourceSheets = workbook.sheets
    .filter((sheet) => /person/i.test(sheet.name))
    .map((sheet) => sheet.name);

  for (const sourceSheet of sourceSheets) {
    await prisma.talentPersonSkillAssessment.deleteMany({
      where: {
        sourceFile: workbook.file,
        sourceSheet,
      },
    });
  }
}

async function cleanupPositionsForWorkbook(workbook: Workbook) {
  const sourceSheets = workbook.sheets
    .filter((sheet) => /master|position|qualification/i.test(sheet.name) && !/person/i.test(sheet.name))
    .map((sheet) => sheet.name);

  for (const sourceSheet of sourceSheets) {
    await prisma.organizationPosition.deleteMany({
      where: {
        sourceFile: workbook.file,
        sourceSheet,
      },
    });
  }
}

function findCompetencyStartColumn(headerRow: string[], firstDataRow: string[] | undefined) {
  const firstLevelColumn = (firstDataRow ?? []).findIndex((cell) => Boolean(parseLevel(cell)));
  if (firstLevelColumn >= 0) return firstLevelColumn;
  return Math.max(0, headerRow.findIndex((cell) => Boolean(clean(cell))));
}

function addPositionMetadata(
  metadata: Map<string, PositionMetadata>,
  input: { positionName: string; positionGroup?: string | null; holder?: string | null; jobDescription?: string | null },
) {
  const keys = [
    positionKey(input.positionName),
    input.positionGroup ? positionKey(input.positionName, input.positionGroup) : null,
  ].filter((key): key is string => Boolean(key));

  for (const key of keys) {
    const existing = metadata.get(key) ?? { holders: new Set<string>(), jobDescription: null };
    const holder = clean(input.holder);
    if (holder) existing.holders.add(holder);
    existing.jobDescription = bestText(existing.jobDescription, input.jobDescription);
    metadata.set(key, existing);
  }
}

function getPositionMetadata(metadata: Map<string, PositionMetadata>, positionName: string, positionGroup?: string | null) {
  return (positionGroup ? metadata.get(positionKey(positionName, positionGroup)) : null) ?? metadata.get(positionKey(positionName));
}

function formatHolders(holders: Set<string> | undefined) {
  const names = Array.from(holders ?? []).filter(Boolean);
  if (names.length === 0) return null;
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} + ${names.length - 3} holders`;
}

async function upsertCompetencyLevel(input: CompetencyLevelInput, summary: ImportSummary) {
  const category = await upsertCategory(input.category);
  const skillCode = buildCode(input.category, input.competencyName);
  const existingSkill = await prisma.talentSkill.findUnique({ where: { skillCode } });
  const skill = await prisma.talentSkill.upsert({
    where: { skillCode },
    update: {
      categoryId: category.id,
      skillName: input.competencyName,
      description: input.description,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
    create: {
      categoryId: category.id,
      skillCode,
      skillName: input.competencyName,
      description: input.description,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
  });
  if (existingSkill) summary.competenciesUpdated += 1;
  else summary.competenciesInserted += 1;

  const existingLevel = await prisma.talentSkillLevelDefinition.findUnique({
    where: { skillId_level: { skillId: skill.id, level: input.level } },
  });
  await prisma.talentSkillLevelDefinition.upsert({
    where: { skillId_level: { skillId: skill.id, level: input.level } },
    update: {
      levelName: `Level ${input.level}`,
      definition: input.description || "Not available",
      evidenceRequirement: input.indicators.join("\n") || input.description || "Not available",
      behaviorIndicators: input.indicators,
    },
    create: {
      skillId: skill.id,
      level: input.level,
      levelName: `Level ${input.level}`,
      definition: input.description || "Not available",
      evidenceRequirement: input.indicators.join("\n") || input.description || "Not available",
      behaviorIndicators: input.indicators,
    },
  });
  if (existingLevel) summary.levelsUpdated += 1;
  else summary.levelsInserted += 1;
}

async function upsertPositionRequirement(input: RequirementInput, summary: ImportSummary) {
  if (!input.positionName) {
    summary.validationErrors.push(`${input.sourceFile}/${input.sourceSheet}: position without name skipped`);
    summary.rowsSkipped += 1;
    return;
  }
  if (input.priorityLevel < 1 || input.priorityLevel > 5) {
    summary.validationErrors.push(`${input.positionName}: competency priority out of range`);
    summary.rowsSkipped += 1;
    return;
  }

  const category = await upsertCategory(input.competencyCategory);
  const skillCode = buildCode(input.competencyCategory, input.competencyName);
  const existingSkill = await prisma.talentSkill.findUnique({ where: { skillCode } });
  const skill = await prisma.talentSkill.upsert({
    where: { skillCode },
    update: {
      categoryId: category.id,
      skillName: input.competencyName,
      description: input.competencyDefinition ?? undefined,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
    create: {
      categoryId: category.id,
      skillCode,
      skillName: input.competencyName,
      description: input.competencyDefinition,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
  });
  if (existingSkill) summary.competenciesUpdated += 1;
  else summary.competenciesInserted += 1;

  const department = await upsertOrganization(input);
  const positionCode = buildCode(input.department, input.positionName);
  const existingPosition = await prisma.organizationPosition.findUnique({ where: { positionCode } });
  const position = await prisma.organizationPosition.upsert({
    where: { positionCode },
    update: {
      departmentId: department.id,
      positionName: input.positionName,
      jobLevel: input.positionGroup ?? "Unmapped",
      positionSummary: input.jobDescription ?? undefined,
      jobDescription: input.jobDescription ?? undefined,
      currentHolder: input.currentHolder ?? undefined,
      sourceFile: input.sourceFile,
      sourceSheet: input.sourceSheet,
      importedAt: new Date(),
      isManagerial: /manager|gm|superintendent|supervisor|supt/i.test(input.positionName),
      isActive: true,
    },
    create: {
      departmentId: department.id,
      positionCode,
      positionName: input.positionName,
      jobLevel: input.positionGroup ?? "Unmapped",
      positionSummary: input.jobDescription,
      jobDescription: input.jobDescription,
      currentHolder: input.currentHolder,
      sourceFile: input.sourceFile,
      sourceSheet: input.sourceSheet,
      importedAt: new Date(),
      isManagerial: /manager|gm|superintendent|supervisor|supt/i.test(input.positionName),
      isActive: true,
    },
  });
  if (existingPosition) summary.positionsUpdated += 1;
  else summary.positionsInserted += 1;

  const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");
  const existingRequirement = await prisma.talentPositionSkillRequirement.findUnique({
    where: { positionId_skillId_effectiveFrom: { positionId: position.id, skillId: skill.id, effectiveFrom } },
  });
  await prisma.talentPositionSkillRequirement.upsert({
    where: { positionId_skillId_effectiveFrom: { positionId: position.id, skillId: skill.id, effectiveFrom } },
    update: {
      requiredLevel: input.priorityLevel,
      sourceFile: input.sourceFile,
      sourceSheet: input.sourceSheet,
      importedAt: new Date(),
      isMandatory: true,
      isActive: true,
    },
    create: {
      positionId: position.id,
      skillId: skill.id,
      requiredLevel: input.priorityLevel,
      effectiveFrom,
      sourceFile: input.sourceFile,
      sourceSheet: input.sourceSheet,
      importedAt: new Date(),
      isMandatory: true,
      isActive: true,
    },
  });
  if (existingRequirement) summary.requirementsUpdated += 1;
  else summary.requirementsInserted += 1;
}

async function upsertPersonAssessment(input: PersonAssessmentInput, summary: ImportSummary) {
  if (!input.employeeName || !input.positionName) {
    summary.rowsSkipped += 1;
    return;
  }
  if (input.currentLevel < 1 || input.currentLevel > 5) {
    summary.validationErrors.push(`${input.employeeName}: current competency level out of range`);
    summary.rowsSkipped += 1;
    return;
  }

  const category = await upsertCategory(input.competencyCategory);
  const skillCode = buildCode(input.competencyCategory, input.competencyName);
  const existingSkill = await prisma.talentSkill.findUnique({ where: { skillCode } });
  const skill = await prisma.talentSkill.upsert({
    where: { skillCode },
    update: {
      categoryId: category.id,
      skillName: input.competencyName,
      description: input.competencyDefinition ?? undefined,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
    create: {
      categoryId: category.id,
      skillCode,
      skillName: input.competencyName,
      description: input.competencyDefinition,
      sourceFile: input.sourceFile,
      importedAt: new Date(),
      isActive: true,
    },
  });
  if (existingSkill) summary.competenciesUpdated += 1;
  else summary.competenciesInserted += 1;

  const existingAssessment = await prisma.talentPersonSkillAssessment.findUnique({
    where: {
      employeeName_positionName_skillId_sourceFile_sourceSheet: {
        employeeName: input.employeeName,
        positionName: input.positionName,
        skillId: skill.id,
        sourceFile: input.sourceFile,
        sourceSheet: input.sourceSheet,
      },
    },
  });

  await prisma.talentPersonSkillAssessment.upsert({
    where: {
      employeeName_positionName_skillId_sourceFile_sourceSheet: {
        employeeName: input.employeeName,
        positionName: input.positionName,
        skillId: skill.id,
        sourceFile: input.sourceFile,
        sourceSheet: input.sourceSheet,
      },
    },
    update: {
      employeeCode: input.employeeCode,
      positionGroup: input.positionGroup,
      currentLevel: input.currentLevel,
      importedAt: new Date(),
    },
    create: {
      skillId: skill.id,
      employeeCode: input.employeeCode,
      employeeName: input.employeeName,
      positionName: input.positionName,
      positionGroup: input.positionGroup,
      currentLevel: input.currentLevel,
      sourceFile: input.sourceFile,
      sourceSheet: input.sourceSheet,
      importedAt: new Date(),
    },
  });

  if (existingAssessment) summary.personAssessmentsUpdated += 1;
  else summary.personAssessmentsInserted += 1;
}

async function upsertOrganization(input: Pick<RequirementInput, "directorate" | "division" | "department">) {
  const directorateName = inferDirectorate(input.directorate);
  const divisionName = clean(input.division) || directorateName;
  const departmentName = clean(input.department) || divisionName;

  const directorate = await prisma.organizationDirectorate.upsert({
    where: { code: buildCode("DIR", directorateName) },
    update: { name: directorateName, isActive: true },
    create: { code: buildCode("DIR", directorateName), name: directorateName, isActive: true },
  });

  const division = await prisma.organizationDivision.upsert({
    where: { code: buildCode(directorateName, divisionName) },
    update: { directorateId: directorate.id, name: divisionName, isActive: true },
    create: { directorateId: directorate.id, code: buildCode(directorateName, divisionName), name: divisionName, isActive: true },
  });

  return prisma.organizationDepartment.upsert({
    where: { code: buildCode(divisionName, departmentName) },
    update: { divisionId: division.id, name: departmentName, isActive: true },
    create: { divisionId: division.id, code: buildCode(divisionName, departmentName), name: departmentName, isActive: true },
  });
}

async function upsertCategory(name: string) {
  const cleanName = clean(name) || "Unmapped";
  return prisma.talentSkillCategory.upsert({
    where: { code: buildCode("CAT", cleanName) },
    update: { name: cleanName },
    create: { code: buildCode("CAT", cleanName), name: cleanName },
  });
}

function inferCategory(file: string, sheetName = "") {
  const value = `${file} ${sheetName}`;
  if (/geolog|exploration/i.test(value)) return "Geology & Exploration";
  if (/mine plan|planning|survey/i.test(value)) return "Mine Planning";
  if (/infrastructure|project|construction|facility/i.test(value)) return "Mining Infrastructure & Project";
  if (/osrel|operation.*support.*relation/i.test(value)) return "OSREL";
  if (/ohs|occupational/i.test(value)) return "OHS";
  if (/compliance|environment|enviro/i.test(value)) return "System Compliance & Environment";
  return "Unmapped";
}

function inferDirectorate(value: string | null | undefined) {
  const normalized = clean(value).toLocaleLowerCase("id-ID");
  if (/mining|mine plan|geolog|exploration|infrastructure|construction|project|ohs|occupational|osrel|operation.*support.*relation|system.*compliance|environment/.test(normalized)) {
    return "OPERATION & HSE DIRECTORATE";
  }
  if (/marketing|commercial|sales/.test(normalized)) return "MARKETING DIRECTORATE";
  if (/legal|compliance/.test(normalized)) return "LEGAL DIRECTORATE";
  if (/hr|human|general|corporate|community/.test(normalized)) return "HRGS DIRECTORATE";
  if (/finance|audit|accounting|treasury|budget/.test(normalized)) return "FINANCE DIRECTORATE";
  return "OPERATION & HSE DIRECTORATE";
}

function parseLevel(value: string | undefined) {
  const match = clean(value).match(/(?:level\s*)?([1-5])\b/i);
  return match ? Number(match[1]) : null;
}

function normalizeCompetencyName(value: string) {
  return clean(value).replace(/\s+(?:level\s*)?[1-5]\s*$/i, "");
}

function bestText(...values: Array<string | null | undefined>) {
  const cleaned = values.map((value) => clean(value)).filter(Boolean);
  return cleaned.sort((a, b) => b.length - a.length)[0] ?? null;
}

function clean(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCode(...parts: string[]) {
  const slug = parts
    .map((part) => clean(part).toUpperCase().replace(/&/g, " AND ").replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .filter(Boolean)
    .join("-");
  return slug || "UNMAPPED";
}

function positionKey(positionName: string, positionGroup = "") {
  return `${normalize(positionName)}::${normalize(positionGroup)}`;
}

function normalize(value: string) {
  return clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
