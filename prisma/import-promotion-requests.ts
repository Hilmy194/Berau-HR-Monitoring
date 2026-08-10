import { copyFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import os from "os";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const PROMOTION_FILE = "../EXPORT data promo eli 22 Apr 24 malam BC & MTL.XLSX";

type Workbook = {
  file: string;
  sheets: Array<{ name: string; rows: string[][] }>;
};

type ImportSummary = {
  rowsRead: number;
  inserted: number;
  updated: number;
  skipped: number;
};

async function main() {
  const workbook = readWorkbookCopy(path.resolve(process.cwd(), PROMOTION_FILE));
  const sheet = workbook.sheets[0];
  const summary: ImportSummary = { rowsRead: 0, inserted: 0, updated: 0, skipped: 0 };
  if (!sheet?.rows.length) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const header = sheet.rows[0].map(clean);
  const column = (name: RegExp) => header.findIndex((cell) => name.test(cell));
  const columns = {
    employeeId: column(/^personnel number$/i),
    employeeName: column(/^employee name$/i),
    employeeStatus: column(/^emp\.status$/i),
    companyName: column(/^company name$/i),
    businessArea: column(/^business area$/i),
    personnelArea: column(/^personnel area text$/i),
    personnelSubarea: column(/^pers\. subarea text$/i),
    positionCode: column(/^position$/i),
    positionName: column(/^position name$/i),
    businessUnit: column(/^bus\.unit$/i),
    businessUnitName: column(/^bus\.unit name$/i),
    directorateCode: column(/^directorate$/i),
    directorateName: column(/^directorate name$/i),
    divisionCode: column(/^division$/i),
    divisionName: column(/^division name$/i),
    departmentCode: column(/^department$/i),
    departmentName: column(/^department name$/i),
    talentClass: column(/^talent class$/i),
    eligibilityStatus: column(/^eligibility status$/i),
    yearOfService: column(/^year of service$/i),
    yearOfServicePosition: column(/^year of service in position$/i),
    joinDate: column(/^join date$/i),
    lastPromotionDate: column(/^last promotion$/i),
    promotionPlan: column(/^promotion plan$/i),
    promotionPlanDesc: column(/^promotion plan desc\.$/i),
    justification: column(/^justification$/i),
    projectAssignment: column(/^project assg$/i),
    promotionStatus: 46,
    nextStatus: column(/^next status$/i),
    picId: column(/^pic id$/i),
    picName: column(/^pic name$/i),
    picType: column(/^pic type$/i),
    changedBy: column(/^changed by$/i),
    changedByName: column(/^changed by name$/i),
    changedOn: column(/^changed on$/i),
  };

  await prisma.talentPromotionRequest.deleteMany({ where: { sourceFile: workbook.file } });

  for (const row of sheet.rows.slice(1)) {
    summary.rowsRead += 1;
    const employeeId = clean(row[columns.employeeId]);
    const employeeName = clean(row[columns.employeeName]);
    const positionName = clean(row[columns.positionName]);
    const promotionStatus = normalizePromotionStatus(row[columns.promotionStatus]);
    if (!employeeId || !employeeName || !positionName || !promotionStatus) {
      summary.skipped += 1;
      continue;
    }

    const existing = await prisma.talentPromotionRequest.findUnique({
      where: {
        employeeId_positionName_sourceFile: {
          employeeId,
          positionName,
          sourceFile: workbook.file,
        },
      },
    });

    await prisma.talentPromotionRequest.upsert({
      where: {
        employeeId_positionName_sourceFile: {
          employeeId,
          positionName,
          sourceFile: workbook.file,
        },
      },
      update: {
        employeeStatus: clean(row[columns.employeeStatus]) || null,
        companyName: clean(row[columns.companyName]) || null,
        businessArea: clean(row[columns.businessArea]) || null,
        personnelArea: clean(row[columns.personnelArea]) || null,
        personnelSubarea: clean(row[columns.personnelSubarea]) || null,
        positionCode: clean(row[columns.positionCode]) || null,
        businessUnit: clean(row[columns.businessUnit]) || null,
        businessUnitName: clean(row[columns.businessUnitName]) || null,
        directorateCode: clean(row[columns.directorateCode]) || null,
        directorateName: clean(row[columns.directorateName]) || null,
        divisionCode: clean(row[columns.divisionCode]) || null,
        divisionName: clean(row[columns.divisionName]) || null,
        departmentCode: clean(row[columns.departmentCode]) || null,
        departmentName: clean(row[columns.departmentName]) || null,
        talentClass: clean(row[columns.talentClass]) || null,
        eligibilityStatus: clean(row[columns.eligibilityStatus]) || null,
        yearOfService: parseNumber(row[columns.yearOfService]),
        yearOfServicePosition: parseNumber(row[columns.yearOfServicePosition]),
        joinDate: parseExcelDate(row[columns.joinDate]),
        lastPromotionDate: parseExcelDate(row[columns.lastPromotionDate]),
        promotionPlan: clean(row[columns.promotionPlan]) || null,
        promotionPlanDesc: clean(row[columns.promotionPlanDesc]) || null,
        justification: clean(row[columns.justification]) || null,
        projectAssignment: clean(row[columns.projectAssignment]) || null,
        promotionStatus,
        nextStatus: normalizePromotionStatus(row[columns.nextStatus]) || null,
        picId: clean(row[columns.picId]) || null,
        picName: clean(row[columns.picName]) || null,
        picType: clean(row[columns.picType]) || null,
        changedBy: clean(row[columns.changedBy]) || null,
        changedByName: clean(row[columns.changedByName]) || null,
        changedOn: parseExcelDate(row[columns.changedOn]),
        sourceSheet: sheet.name,
        importedAt: new Date(),
      },
      create: {
        employeeId,
        employeeName,
        employeeStatus: clean(row[columns.employeeStatus]) || null,
        companyName: clean(row[columns.companyName]) || null,
        businessArea: clean(row[columns.businessArea]) || null,
        personnelArea: clean(row[columns.personnelArea]) || null,
        personnelSubarea: clean(row[columns.personnelSubarea]) || null,
        positionCode: clean(row[columns.positionCode]) || null,
        positionName,
        businessUnit: clean(row[columns.businessUnit]) || null,
        businessUnitName: clean(row[columns.businessUnitName]) || null,
        directorateCode: clean(row[columns.directorateCode]) || null,
        directorateName: clean(row[columns.directorateName]) || null,
        divisionCode: clean(row[columns.divisionCode]) || null,
        divisionName: clean(row[columns.divisionName]) || null,
        departmentCode: clean(row[columns.departmentCode]) || null,
        departmentName: clean(row[columns.departmentName]) || null,
        talentClass: clean(row[columns.talentClass]) || null,
        eligibilityStatus: clean(row[columns.eligibilityStatus]) || null,
        yearOfService: parseNumber(row[columns.yearOfService]),
        yearOfServicePosition: parseNumber(row[columns.yearOfServicePosition]),
        joinDate: parseExcelDate(row[columns.joinDate]),
        lastPromotionDate: parseExcelDate(row[columns.lastPromotionDate]),
        promotionPlan: clean(row[columns.promotionPlan]) || null,
        promotionPlanDesc: clean(row[columns.promotionPlanDesc]) || null,
        justification: clean(row[columns.justification]) || null,
        projectAssignment: clean(row[columns.projectAssignment]) || null,
        promotionStatus,
        nextStatus: normalizePromotionStatus(row[columns.nextStatus]) || null,
        picId: clean(row[columns.picId]) || null,
        picName: clean(row[columns.picName]) || null,
        picType: clean(row[columns.picType]) || null,
        changedBy: clean(row[columns.changedBy]) || null,
        changedByName: clean(row[columns.changedByName]) || null,
        changedOn: parseExcelDate(row[columns.changedOn]),
        sourceFile: workbook.file,
        sourceSheet: sheet.name,
        importedAt: new Date(),
      },
    });

    if (existing) summary.updated += 1;
    else summary.inserted += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
}

function readWorkbookCopy(filePath: string): Workbook {
  const tempDir = path.join(os.tmpdir(), "hr-monitoring-imports");
  mkdirSync(tempDir, { recursive: true });
  const copyPath = path.join(tempDir, "promotion-export-copy.xlsx");
  copyFileSync(filePath, copyPath);

  const parserPath = path.resolve(process.cwd(), "prisma/read-xlsx.ps1");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", parserPath, "-Path", copyPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Failed to read ${filePath}: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown parser error"}`);
  }
  const workbook = JSON.parse(result.stdout) as Workbook;
  return { ...workbook, file: path.basename(filePath) };
}

function normalizePromotionStatus(value: string | null | undefined) {
  const status = clean(value);
  const key = status.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, " ").trim();
  if (!key) return "";
  if (key === "submitted") return "Submitted";
  if (key === "approved div head") return "Approved Div. Head";
  if (key === "verified by hrbp") return "Verified by HRBP";
  if (key === "verified by hrod") return "Verified by HROD";
  if (key === "approved dir bus head") return "Approved Dir./Bus. Head";
  if (key === "rejected") return "Rejected";
  return status;
}

function parseExcelDate(value: string | null | undefined) {
  const raw = clean(value);
  if (!raw) return null;
  const serial = Number(raw);
  if (Number.isFinite(serial) && serial > 0) {
    const utc = Date.UTC(1899, 11, 30) + serial * 86_400_000;
    return new Date(utc);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value: string | null | undefined) {
  const parsed = Number(clean(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
