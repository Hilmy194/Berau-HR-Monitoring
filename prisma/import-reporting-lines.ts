/**
 * Import "Data Atasan Karyawan" (markdown table) into the Organization* tables.
 *
 * Usage:
 *   npm run db:import:reporting-lines                 # default file
 *   npm run db:import:reporting-lines -- path/to.md   # custom file
 *   npm run db:import:reporting-lines -- --dry-run    # parse + report only
 *
 * Idempotent: one OrganizationPosition per employee (positionCode RL-<NIK>).
 * Rows missing from the file are deactivated. Email/phone are never stored.
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  REPORTING_LINE_CODE_PREFIX,
  REPORTING_LINE_SOURCE_FILE,
} from "../src/lib/reporting-line";
import { parseReportingMarkdown, resolveReportingRows, slugCode, type ResolvedRow } from "./reporting-line-parser";

const DEFAULT_FILE = "data/private/data-atasan-karyawan.md";
const SOURCE_SHEET = "Data Atasan Karyawan";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find((item) => !item.startsWith("--"));

async function main() {
  const filePath = path.resolve(process.cwd(), fileArg ?? DEFAULT_FILE);
  if (!existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}\nSimpan markdown data atasan di ${DEFAULT_FILE}.`);
  }

  const parsed = parseReportingMarkdown(readFileSync(filePath, "utf8"));
  if (!parsed.length) throw new Error("Tidak ada baris karyawan yang terbaca dari tabel markdown.");
  const { rows, report } = resolveReportingRows(parsed);

  printReport(report, rows);
  if (dryRun) {
    console.log("\n[dry-run] Tidak ada perubahan ke database.");
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
  });
  try {
    await writeRows(prisma, rows);
  } finally {
    await prisma.$disconnect();
  }
}

async function writeRows(prisma: PrismaClient, rows: ResolvedRow[]) {
  const importedAt = new Date();
  const summary = { directoratesCreated: 0, divisions: 0, departments: 0, positionsInserted: 0, positionsUpdated: 0, positionsDeactivated: 0 };

  // Directorates: reuse existing rows by name, otherwise create RL-* ones.
  const directorateIds = new Map<string, string>();
  for (const name of new Set(rows.map((row) => row.directorate))) {
    const existing = await prisma.organizationDirectorate.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      if (!existing.isActive) await prisma.organizationDirectorate.update({ where: { id: existing.id }, data: { isActive: true } });
      directorateIds.set(name, existing.id);
      continue;
    }
    const created = await prisma.organizationDirectorate.upsert({
      where: { code: `${REPORTING_LINE_CODE_PREFIX}DIR-${slugCode(name)}` },
      update: { name, isActive: true },
      create: { code: `${REPORTING_LINE_CODE_PREFIX}DIR-${slugCode(name)}`, name, description: "Dibuat dari import data atasan karyawan." },
    });
    directorateIds.set(name, created.id);
    summary.directoratesCreated += 1;
  }

  // Divisions (code unique per directorate + name).
  const divisionIds = new Map<string, string>();
  const usedDivisionCodes: string[] = [];
  for (const row of rows) {
    const key = `${row.directorate}\u0000${row.division}`;
    if (divisionIds.has(key)) continue;
    const code = `${REPORTING_LINE_CODE_PREFIX}DIV-${slugCode(`${row.directorate.replace(/ DIRECTORATE$/, "")} ${row.division}`)}`;
    const division = await prisma.organizationDivision.upsert({
      where: { code },
      update: { name: row.division, directorateId: directorateIds.get(row.directorate)!, isActive: true },
      create: { code, name: row.division, directorateId: directorateIds.get(row.directorate)!, description: "Disimpulkan dari rantai atasan." },
    });
    divisionIds.set(key, division.id);
    usedDivisionCodes.push(code);
  }
  summary.divisions = divisionIds.size;

  // Departments (department name is globally unique after majority vote).
  const departmentIds = new Map<string, string>();
  const usedDepartmentCodes: string[] = [];
  for (const row of rows) {
    if (departmentIds.has(row.departmentName)) continue;
    const code = `${REPORTING_LINE_CODE_PREFIX}DEPT-${slugCode(row.departmentName)}`;
    const department = await prisma.organizationDepartment.upsert({
      where: { code },
      update: { name: row.departmentName, divisionId: divisionIds.get(`${row.directorate}\u0000${row.division}`)!, isActive: true },
      create: { code, name: row.departmentName, divisionId: divisionIds.get(`${row.directorate}\u0000${row.division}`)! },
    });
    departmentIds.set(row.departmentName, department.id);
    usedDepartmentCodes.push(code);
  }
  summary.departments = departmentIds.size;

  // Positions, pass 1: upsert without supervisor links.
  const positionIds = new Map<string, string>();
  for (const row of rows) {
    const positionCode = `${REPORTING_LINE_CODE_PREFIX}${row.personnelNumber}`;
    const data = {
      departmentId: departmentIds.get(row.departmentName)!,
      positionName: row.positionName,
      jobLevel: row.jobLevel,
      currentHolder: row.name,
      holderPersonnelNumber: row.personnelNumber,
      externalSupervisor: row.externalSupervisor,
      isManagerial: row.rank >= 60,
      isActive: true,
      sourceFile: REPORTING_LINE_SOURCE_FILE,
      sourceSheet: SOURCE_SHEET,
      importedAt,
    };
    const existing = await prisma.organizationPosition.findUnique({ where: { positionCode }, select: { id: true } });
    const position = existing
      ? await prisma.organizationPosition.update({ where: { positionCode }, data })
      : await prisma.organizationPosition.create({ data: { positionCode, ...data } });
    positionIds.set(row.personnelNumber, position.id);
    if (existing) summary.positionsUpdated += 1;
    else summary.positionsInserted += 1;
  }

  // Pass 2: supervisor links.
  for (const row of rows) {
    await prisma.organizationPosition.update({
      where: { id: positionIds.get(row.personnelNumber)! },
      data: { reportsToId: row.supervisorNik ? positionIds.get(row.supervisorNik) ?? null : null },
    });
  }

  // Deactivate stale reporting-line rows.
  const activeCodes = rows.map((row) => `${REPORTING_LINE_CODE_PREFIX}${row.personnelNumber}`);
  const stale = await prisma.organizationPosition.updateMany({
    where: { positionCode: { startsWith: REPORTING_LINE_CODE_PREFIX, notIn: activeCodes }, isActive: true },
    data: { isActive: false, reportsToId: null },
  });
  summary.positionsDeactivated = stale.count;
  await prisma.organizationDepartment.updateMany({
    where: { code: { startsWith: `${REPORTING_LINE_CODE_PREFIX}DEPT-`, notIn: usedDepartmentCodes } },
    data: { isActive: false },
  });
  await prisma.organizationDivision.updateMany({
    where: { code: { startsWith: `${REPORTING_LINE_CODE_PREFIX}DIV-`, notIn: usedDivisionCodes } },
    data: { isActive: false },
  });

  console.log("\nDatabase:", JSON.stringify(summary, null, 2));
}

function printReport(report: ReturnType<typeof resolveReportingRows>["report"], rows: ResolvedRow[]) {
  const roots = rows.filter((row) => !row.supervisorNik);
  console.log(`Baris terbaca         : ${report.rowsRead}`);
  console.log(`NIK duplikat          : ${report.duplicateNiks.length ? report.duplicateNiks.join(", ") : "-"}`);
  console.log(`Atasan ter-resolve    : ${report.resolvedSupervisors}`);
  console.log(`Puncak pohon (root)   : ${roots.length}`);
  console.log(`Siklus diputus        : ${report.cyclesBroken.length ? report.cyclesBroken.join(", ") : "-"}`);
  console.log("\nNama atasan kembar (ditebak):");
  for (const item of report.ambiguousSupervisors) {
    console.log(`  - ${item.employee} -> "${item.supervisor}" => ${item.chosen}`);
  }
  console.log("\nAtasan di luar data (jumlah bawahan):");
  for (const [name, count] of Object.entries(report.externalSupervisors).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${name}: ${count}`);
  }
  console.log("\nKepala rantai belum terpetakan ke direktorat:");
  const unmapped = Object.entries(report.unmappedChainHeads).sort((a, b) => b[1] - a[1]);
  if (!unmapped.length) console.log("  -");
  for (const [name, count] of unmapped) console.log(`  - ${name}: ${count} karyawan`);
  console.log("\nKaryawan per direktorat:");
  for (const [name, count] of Object.entries(report.directorates).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${name}: ${count}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
