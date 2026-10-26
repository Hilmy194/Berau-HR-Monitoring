import fs from "fs";
import path from "path";
import readline from "readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const CSV_PATH = path.resolve(process.cwd(), "goal-settings", "goal_setting_bc.csv");

function normalizeReviewPeriod(val: string): "Monthly" | "Quarterly" | "Half Yearly" | "Once" | null {
  const v = val.trim().toUpperCase();
  if (v === "MONTHLY") return "Monthly";
  if (v === "QUARTERLY") return "Quarterly";
  if (v === "HALFYEARLY") return "Half Yearly";
  if (v === "ONCE") return "Once";
  return null;
}

function determinePolarity(l1Str: string, l5Str: string): string | null {
  try {
    const l1 = parseFloat(l1Str.replace("%", "").replace(",", ".").trim());
    const l5 = parseFloat(l5Str.replace("%", "").replace(",", ".").trim());
    if (!isNaN(l1) && !isNaN(l5)) {
      if (l1 > l5) return "DESCENDING";
      if (l1 < l5) return "ASCENDING";
      return "FLAT";
    }
  } catch {
    // fallback
  }
  if (l1Str || l5Str) return "MILESTONE";
  return null;
}

function parseDecimal(valStr: string): number | null {
  try {
    const v = parseFloat(valStr.replace("%", "").replace(",", ".").trim());
    return isNaN(v) ? null : Math.round(v * 10000) / 10000;
  } catch {
    return null;
  }
}

// Split a CSV line respecting quoted commas
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  console.log("=== Goal Setting BC Database Status / Import ===");

  const currentLibCount = await prisma.scorecardKpiLibrary.count();
  const currentEmpCount = await prisma.employeeScorecardSetting.count();

  // If CSV was deleted by the user, verify data already exists in PostgreSQL
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`\nℹ File sumber "${CSV_PATH}" tidak ditemukan (sudah dihapus).`);
    console.log(`✔ Status Database:`);
    console.log(`  - scorecard_kpi_libraries: ${currentLibCount} baris`);
    console.log(`  - employee_scorecard_settings: ${currentEmpCount} baris`);
    console.log(`Aplikasi Harmoni berjalan normal menggunakan data di database PostgreSQL.`);
    return;
  }

  console.log(`Membaca data dari: ${CSV_PATH}`);
  const startTime = Date.now();

  const fileStream = fs.createReadStream(CSV_PATH, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers: string[] = [];
  const employeeSettings: Array<{
    employeeId: string;
    employeeName: string | null;
    orgUnit: string | null;
    supervisorName: string | null;
    program: string;
    strategyPillar: string | null;
    isGroup: boolean;
    parentGroupName: string | null;
    goalName: string;
    goalDescription: string | null;
    reviewPeriod: string | null;
    uom: string | null;
    target: string | null;
    weight: number | null;
    levels: { l1: string; l2: string; l3: string; l4: string; l5: string };
    status: string | null;
    kpiScore: number | null;
    scorecardScore: number | null;
  }> = [];

  const libraryMap = new Map<string, {
    strategyPillar: string | null;
    goalName: string;
    goalDescription: string | null;
    reviewPeriod: string | null;
    uom: string | null;
    target: string | null;
    weight: number | null;
    isGroup: boolean;
    parentGroupName: string | null;
    program: string;
    polarity: string | null;
    levels: { l1: string; l2: string; l3: string; l4: string; l5: string };
    sourceSystem: string;
  }>();

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (headers.length === 0) {
      headers = parseCsvLine(line).map((h) => h.trim());
      continue;
    }

    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (cols[i] ?? "").trim();
    }

    const l1 = row["L1"] || "";
    const l2 = row["L2"] || "";
    const l3 = row["L3"] || "";
    const l4 = row["L4"] || "";
    const l5 = row["L5"] || "";

    const empSetting = {
      employeeId: row["Emp Code"] || "",
      employeeName: row["Emp Name"] || null,
      orgUnit: row["Org Unit"] || null,
      supervisorName: row["Supervisor Name"] || null,
      program: row["Program"] || "Individu",
      strategyPillar: row["Perspective"] || null,
      isGroup: (row["Is Group KPI"] || "").toLowerCase() === "yes",
      parentGroupName: row["Group Parent KPI"] || null,
      goalName: row["KPI Name"] || "",
      goalDescription: row["KPI Description"] || null,
      reviewPeriod: normalizeReviewPeriod(row["Review Frequency"] || ""),
      uom: row["UOM"] || null,
      target: row["Target"] || null,
      weight: parseDecimal(row["Weightage"] || ""),
      levels: { l1, l2, l3, l4, l5 },
      status: row["Status"] || null,
      kpiScore: parseDecimal(row["KPI Score"] || ""),
      scorecardScore: parseDecimal(row["Scorecard Score"] || ""),
    };
    employeeSettings.push(empSetting);

    // Composite key for library template deduplication
    const libKey = [
      row["KPI Name"],
      row["KPI Description"],
      row["UOM"],
      row["Target"],
      row["Perspective"],
      l1,
      l2,
      l3,
      l4,
      l5,
      row["Program"],
      row["Is Group KPI"],
      row["Group Parent KPI"],
    ].join("||");

    if (!libraryMap.has(libKey)) {
      libraryMap.set(libKey, {
        strategyPillar: row["Perspective"] || null,
        goalName: row["KPI Name"] || "",
        goalDescription: row["KPI Description"] || null,
        reviewPeriod: normalizeReviewPeriod(row["Review Frequency"] || ""),
        uom: row["UOM"] || null,
        target: row["Target"] || null,
        weight: parseDecimal(row["Weightage"] || ""),
        isGroup: (row["Is Group KPI"] || "").toLowerCase() === "yes",
        parentGroupName: row["Group Parent KPI"] || null,
        program: row["Program"] || "Individu",
        polarity: determinePolarity(l1, l5),
        levels: { l1, l2, l3, l4, l5 },
        sourceSystem: "GOAL_SETTING_BC",
      });
    }
  }

  console.log(`Parsed ${employeeSettings.length} employee rows, ${libraryMap.size} distinct KPI templates.`);

  console.log("Cleaning old records...");
  await prisma.employeeScorecardSetting.deleteMany({});
  await prisma.scorecardKpiLibrary.deleteMany({});

  console.log("Inserting scorecard_kpi_libraries...");
  const libItems = Array.from(libraryMap.values());
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < libItems.length; i += CHUNK_SIZE) {
    await prisma.scorecardKpiLibrary.createMany({
      data: libItems.slice(i, i + CHUNK_SIZE),
    });
  }

  console.log("Inserting employee_scorecard_settings...");
  for (let i = 0; i < employeeSettings.length; i += CHUNK_SIZE) {
    await prisma.employeeScorecardSetting.createMany({
      data: employeeSettings.slice(i, i + CHUNK_SIZE),
    });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const finalLib = await prisma.scorecardKpiLibrary.count();
  const finalEmp = await prisma.employeeScorecardSetting.count();

  console.log(`✔ SUCCESS: Injected ${finalLib} templates and ${finalEmp} employee settings in ${durationSec}s.`);
}

main()
  .catch((err) => {
    console.error("Import error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
