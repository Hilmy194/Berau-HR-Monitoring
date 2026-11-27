import "./load-env";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const DEFAULT_EXCEL_PATH = "data/certifications/matriks-sertifikasi-working-permit-s-hct-04-01.xlsx";

type WorkbookSheet = {
  name: string;
  rows: string[][];
};

type Workbook = {
  file: string;
  sheets: WorkbookSheet[];
};

type ParsedRequirementRow = {
  orderIndex: number;
  categoryNumber: number;
  category: string;
  workPermitPosition: string;
  employeeIdentity: string | null;
  license: string | null;
  internalCertificates: string | null;
  externalCertificates: string | null;
  healthRequirement: string | null;
  location: string | null;
  documentNumber: string;
  pageNumber: number;
};

function resolveExcelPath(): string {
  const args = process.argv.slice(2);
  const fileFlagIdx = args.findIndex((arg) => arg === "--file" || arg === "-f");
  const candidate =
    fileFlagIdx >= 0 && args[fileFlagIdx + 1]
      ? args[fileFlagIdx + 1]
      : args.find((arg) => !arg.startsWith("-")) ?? DEFAULT_EXCEL_PATH;
  return path.resolve(process.cwd(), candidate);
}

function readWorkbook(filePath: string): Workbook {
  const readerPath = path.resolve(process.cwd(), "prisma/read_xlsx.py");
  const venvPython = path.resolve(process.cwd(), ".venv/bin/python");
  const pythonCmd = process.platform !== "win32" && fs.existsSync(venvPython) ? venvPython : "python3";

  const result = spawnSync(pythonCmd, [readerPath, filePath], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 25 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `Gagal membaca file Excel ${filePath}: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown error"}`
    );
  }

  return JSON.parse(result.stdout) as Workbook;
}

function cleanText(value: string | null | undefined): string | null {
  const text = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text && text !== "-" ? text : null;
}

function parseIntStrict(value: string | null | undefined): number | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const exactIdx = normalized.findIndex((col) => col === target);
    if (exactIdx >= 0) return exactIdx;
  }
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const partialIdx = normalized.findIndex((col) => col.includes(target));
    if (partialIdx >= 0) return partialIdx;
  }
  return -1;
}

function parseSheetRows(sheet: WorkbookSheet): ParsedRequirementRow[] {
  const headerIdx = sheet.rows.findIndex(
    (row) =>
      row.some((cell) => /work permit/i.test(cell)) &&
      row.some((cell) => /kategori/i.test(cell))
  );

  if (headerIdx < 0) {
    throw new Error(`Header kolom ('Work Permit', 'Kategori Pekerja') tidak ditemukan di sheet "${sheet.name}".`);
  }

  const headers = sheet.rows[headerIdx];
  const colOrder = findColumnIndex(headers, ["No", "Order Index", "Urutan"]);
  const colDoc = findColumnIndex(headers, ["No Dokumen", "Document Number"]);
  const colPage = findColumnIndex(headers, ["Halaman", "Page", "Page Number"]);
  const colCatNum = findColumnIndex(headers, ["No Kategori", "Category Number"]);
  const colCategory = findColumnIndex(headers, ["Kategori Pekerja", "Kategori", "Category"]);
  const colWorkPermit = findColumnIndex(headers, ["Work Permit", "Work Permit Position", "Posisi"]);
  const colIdentity = findColumnIndex(headers, ["Identitas Karyawan", "Employee Identity"]);
  const colLicense = findColumnIndex(headers, ["Lisensi", "License"]);
  const colInternal = findColumnIndex(headers, ["Sertifikat Internal", "Internal Certificates"]);
  const colExternal = findColumnIndex(headers, ["Sertifikat Eksternal", "External Certificates"]);
  const colHealth = findColumnIndex(headers, ["Riwayat Kesehatan", "Health Requirement"]);
  const colLocation = findColumnIndex(headers, ["Lokasi Penugasan", "Lokasi", "Location"]);

  if (colCategory < 0 || colWorkPermit < 0 || colCatNum < 0 || colPage < 0) {
    throw new Error(`Kolom wajib tidak lengkap di sheet "${sheet.name}". Ditemukan header: ${headers.join(", ")}`);
  }

  const parsed: ParsedRequirementRow[] = [];
  for (let i = headerIdx + 1; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    const workPermitPosition = cleanText(row[colWorkPermit]);
    const category = cleanText(row[colCategory]);
    if (!workPermitPosition && !category) continue;

    const categoryNumber = parseIntStrict(row[colCatNum]);
    const pageNumber = parseIntStrict(row[colPage]);
    if (!workPermitPosition || !category || categoryNumber === null || pageNumber === null) {
      throw new Error(`Baris Excel #${i + 1} tidak valid: Work Permit / Kategori / Halaman / No Kategori wajib terisi.`);
    }

    const orderIndex = colOrder >= 0 ? parseIntStrict(row[colOrder]) ?? parsed.length + 1 : parsed.length + 1;
    const documentNumber = (colDoc >= 0 ? cleanText(row[colDoc]) : null) ?? "S-HCT-04.01";

    parsed.push({
      orderIndex,
      categoryNumber,
      category,
      workPermitPosition,
      employeeIdentity: colIdentity >= 0 ? cleanText(row[colIdentity]) : null,
      license: colLicense >= 0 ? cleanText(row[colLicense]) : null,
      internalCertificates: colInternal >= 0 ? cleanText(row[colInternal]) : null,
      externalCertificates: colExternal >= 0 ? cleanText(row[colExternal]) : null,
      healthRequirement: colHealth >= 0 ? cleanText(row[colHealth]) : null,
      location: colLocation >= 0 ? cleanText(row[colLocation]) : null,
      documentNumber,
      pageNumber,
    });
  }

  return parsed;
}

async function main() {
  const excelPath = resolveExcelPath();
  if (!fs.existsSync(excelPath)) {
    throw new Error(`File Excel tidak ditemukan: ${excelPath}`);
  }

  console.log(`Membaca file Excel: ${excelPath}`);
  const workbook = readWorkbook(excelPath);
  const sheet =
    workbook.sheets.find((item) => /matriks|working.?permit/i.test(item.name)) ?? workbook.sheets[0];

  if (!sheet) {
    throw new Error(`Tidak ada worksheet ditemukan di ${workbook.file}`);
  }

  const rows = parseSheetRows(sheet);
  if (!rows.length) {
    throw new Error(`Tidak ada baris data sertifikasi di sheet "${sheet.name}".`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.positionCertificationRequirement.deleteMany({});
    await tx.positionCertificationRequirement.createMany({
      data: rows.map((row) => ({
        orderIndex: row.orderIndex,
        categoryNumber: row.categoryNumber,
        category: row.category,
        workPermitPosition: row.workPermitPosition,
        employeeIdentity: row.employeeIdentity,
        license: row.license,
        internalCertificates: row.internalCertificates,
        externalCertificates: row.externalCertificates,
        healthRequirement: row.healthRequirement,
        location: row.location,
        documentNumber: row.documentNumber,
        pageNumber: row.pageNumber,
      })),
    });
  });

  const total = await prisma.positionCertificationRequirement.count();
  const byCategory = await prisma.positionCertificationRequirement.groupBy({
    by: ["categoryNumber", "category"],
    _count: { id: true },
    orderBy: { categoryNumber: "asc" },
  });

  console.log(`Berhasil import ${total} baris dari "${workbook.file}" [sheet: ${sheet.name}] ke position_certification_requirements.`);
  for (const group of byCategory) {
    console.log(`- [${group.categoryNumber}] ${group.category}: ${group._count.id} baris`);
  }
}

main()
  .catch((error) => {
    console.error("Error importing certification requirements from Excel:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
