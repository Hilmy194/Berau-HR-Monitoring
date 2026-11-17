import fs from "fs";
import path from "path";
import readline from "readline";
// @ts-ignore
import { v5 as uuidv5 } from "uuid";
import { PrismaClient, Prisma } from "@prisma/client";

// Deterministic UUID v5 namespace for Goal Setting Scorecard items
const GOAL_SETTING_NAMESPACE = uuidv5("harmoni.beraucoal.co.id.goal-setting", uuidv5.DNS);

const DATA_PATH = path.resolve(process.cwd(), "data", "private", "data-goal-settings.md");

interface RawRow {
  empCode: string;
  empName: string;
  orgUnit: string;
  supervisorName: string;
  program: string;
  isGroupKpi: string;
  kpiName: string;
  kpiDescription: string;
  weightage: string;
  uom: string;
  target: string;
  perspective: string;
  l1: string;
  l2: string;
  l3: string;
  l4: string;
  l5: string;
  groupParentKpi: string;
  reviewFrequency: string;
  status: string;
  kpiScore: string;
  scorecardScore: string;
}

interface TransformedRecord {
  id: string;
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
  weight: Prisma.Decimal | null;
  levels: { l1: string; l2: string; l3: string; l4: string; l5: string };
  status: string | null;
  kpiScore: Prisma.Decimal | null;
  scorecardScore: Prisma.Decimal | null;
}

function normalizeReviewFrequency(val: string): string | null {
  const v = val.trim().toUpperCase();
  if (!v) return null;
  if (v === "MONTHLY") return "Monthly";
  if (v === "QUARTERLY") return "Quarterly";
  if (v === "HALFYEARLY" || v === "HALF YEARLY") return "Half Yearly";
  if (v === "ONCE") return "Once";
  return val.trim();
}

function parseDecimal(val: string, maxDecimals: number): Prisma.Decimal | null {
  const cleaned = val.replace("%", "").replace(",", ".").trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  const rounded = Number(num.toFixed(maxDecimals));
  return new Prisma.Decimal(rounded);
}

function parseMarkdownLine(line: string): string[] {
  const body = line.replace(/\r?\n$/, "").slice(2, -2);
  // Split on unescaped pipe
  const rawCells = body.split(/(?<!\\)\|/);
  return rawCells.map((c: string) =>
    c
      .replace(/\\\|/g, "|")
      .replace(/\\\\/g, "\\")
      .replace(/<br>/g, "\n")
      .trim()
  );
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const modeLabel = isApply ? "APPLY (WRITING TO DATABASE)" : "DRY-RUN (SIMULATION ONLY)";

  console.log("=".repeat(70));
  console.log(` HARMONI — SEED EMPLOYEE GOAL SETTINGS (${modeLabel})`);
  console.log("=".repeat(70));

  if (!fs.existsSync(DATA_PATH)) {
    console.error(`File sumber tidak ditemukan: ${DATA_PATH}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // 1. Cek isi tabel saat ini di database development
    const initialDbCount = await prisma.employeeScorecardSetting.count();
    console.log(`\n[1] STATUS DATABASE DEVELOPMENT`);
    console.log(`  - Total baris existing di employee_scorecard_settings : ${initialDbCount}`);

    // 2. Baca file markdown baris per baris
    console.log(`\n[2] MEMBACA DAN MEM-PARSING DATA DARI: data/private/data-goal-settings.md`);
    const fileStream = fs.createReadStream(DATA_PATH, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstTableLine = true;
    let rawHeaders: string[] = [];
    const rawRows: RawRow[] = [];
    const all22Tuples: string[] = [];

    for await (const line of rl) {
      if (!line.startsWith("| ")) continue;

      const cells = parseMarkdownLine(line);
      if (isFirstTableLine) {
        rawHeaders = cells;
        isFirstTableLine = false;
        continue;
      }

      if (cells.length < 22) continue;

      const row: RawRow = {
        empCode: cells[0] || "",
        empName: cells[1] || "",
        orgUnit: cells[2] || "",
        supervisorName: cells[3] || "",
        program: cells[4] || "Individu",
        isGroupKpi: cells[5] || "No",
        kpiName: cells[6] || "",
        kpiDescription: cells[7] || "",
        weightage: cells[8] || "",
        uom: cells[9] || "",
        target: cells[10] || "",
        perspective: cells[11] || "",
        l1: cells[12] || "",
        l2: cells[13] || "",
        l3: cells[14] || "",
        l4: cells[15] || "",
        l5: cells[16] || "",
        groupParentKpi: cells[17] || "",
        reviewFrequency: cells[18] || "",
        status: cells[19] || "",
        kpiScore: cells[20] || "",
        scorecardScore: cells[21] || "",
      };

      rawRows.push(row);
      all22Tuples.push(cells.join("||__||"));
    }

    console.log(`  - Total baris mentah terbaca                            : ${rawRows.length}`);

    // 3. Deteksi dan pembuangan duplikat identik di semua 22 kolom
    const seenFullTuples = new Set<string>();
    const uniqueRawRows: RawRow[] = [];
    let exactDuplicatesDropped = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const tupleKey = all22Tuples[i];
      if (seenFullTuples.has(tupleKey)) {
        exactDuplicatesDropped++;
      } else {
        seenFullTuples.add(tupleKey);
        uniqueRawRows.push(rawRows[i]);
      }
    }

    console.log(`\n[3] ANALISIS IDEMPOTENSI & DEDUKLIKASI`);
    console.log(`  - Baris duplikat identik di semua 22 kolom dibuang      : ${exactDuplicatesDropped}`);
    console.log(`  - Baris unik tersisa untuk diproses                     : ${uniqueRawRows.length}`);

    // 4. Analisis tipe data & presisi (Target non-angka & Weightage kehilangan presisi)
    let nonNumericTargetCount = 0;
    let weightPrecisionLostCount = 0;

    for (const row of uniqueRawRows) {
      if (row.target) {
        const cleanedTgt = row.target.replace("%", "").replace(",", ".").trim();
        if (isNaN(Number(cleanedTgt))) {
          nonNumericTargetCount++;
        }
      }

      if (row.weightage) {
        const cleanedWgt = row.weightage.replace("%", "").replace(",", ".").trim();
        if (cleanedWgt.includes(".")) {
          const decPart = cleanedWgt.split(".")[1];
          if (decPart && decPart.length > 2) {
            weightPrecisionLostCount++;
          }
        }
      }
    }

    console.log(`\n[4] HASIL PEMERIKSAAN TIPE DATA & PRESISI`);
    console.log(`  - Target non-angka (harus tipe TEXT/STRING)             : ${nonNumericTargetCount} baris`);
    console.log(`  - Bobot dengan > 2 desimal (dibulatkan ke Decimal(6,2)) : ${weightPrecisionLostCount} baris`);

    // 5. Transformasi dan Pembuatan UUID v5 Deterministik
    // Key occurrence tracking: (employeeId, program, goalName, parentGroupName)
    const occurrenceTracker = new Map<string, number>();
    const transformedRecords: TransformedRecord[] = [];
    const rejectedRows: Array<{ reason: string }> = [];

    for (const r of uniqueRawRows) {
      // Validasi field wajib
      if (!r.empCode.trim()) {
        rejectedRows.push({ reason: "Emp Code kosong" });
        continue;
      }
      if (!r.kpiName.trim()) {
        rejectedRows.push({ reason: "KPI Name kosong" });
        continue;
      }

      const employeeId = r.empCode.trim();
      const program = r.program.trim() || "Individu";
      const goalName = r.kpiName.trim();
      const parentGroupName = r.groupParentKpi.trim() || null;

      const groupKey = `${employeeId}|${program}|${goalName}|${parentGroupName ?? ""}`;
      const occurrenceIndex = (occurrenceTracker.get(groupKey) ?? 0) + 1;
      occurrenceTracker.set(groupKey, occurrenceIndex);

      // Deterministic UUID v5
      const deterministicName = `${employeeId}:${program}:${goalName}:${parentGroupName ?? ""}:${occurrenceIndex}`;
      const recordId = uuidv5(deterministicName, GOAL_SETTING_NAMESPACE);

      const weight = parseDecimal(r.weightage, 2);
      const kpiScore = parseDecimal(r.kpiScore, 4);
      const scorecardScore = parseDecimal(r.scorecardScore, 4);

      transformedRecords.push({
        id: recordId,
        employeeId,
        employeeName: r.empName.trim() || null,
        orgUnit: r.orgUnit.trim() || null,
        supervisorName: r.supervisorName.trim() || null,
        program,
        strategyPillar: r.perspective.trim() || null,
        isGroup: r.isGroupKpi.trim().toLowerCase() === "yes",
        parentGroupName,
        goalName,
        goalDescription: r.kpiDescription.trim() || null,
        reviewPeriod: normalizeReviewFrequency(r.reviewFrequency),
        uom: r.uom.trim() || null,
        target: r.target.trim() || null,
        weight,
        levels: {
          l1: r.l1.trim() || "-",
          l2: r.l2.trim() || "-",
          l3: r.l3.trim() || "-",
          l4: r.l4.trim() || "-",
          l5: r.l5.trim() || "-",
        },
        status: r.status.trim() || null,
        kpiScore,
        scorecardScore,
      });
    }

    console.log(`\n[5] VALIDASI & GENERASI ID DETERMINISTIK (UUID v5)`);
    console.log(`  - Baris valid siap diproses                            : ${transformedRecords.length}`);
    console.log(`  - Baris ditolak / tidak valid                           : ${rejectedRows.length}`);
    if (rejectedRows.length > 0) {
      const reasons = rejectedRows.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`    Rincian alasan penolakan:`, reasons);
    }

    // 6. Pencocokan Karyawan ke Master Harmoni (BigQuery / Profile / User)
    const uniqueEmpCodes = Array.from(new Set(transformedRecords.map((r) => r.employeeId)));
    console.log(`\n[6] PENCOCOKAN EMPLOYEE KE MASTER HARMONI (READ-ONLY)`);
    console.log(`  - Total karyawan unik (Emp Code) di data goal settings  : ${uniqueEmpCodes.length}`);

    let bqMatchedCount = 0;
    const unmatchedCodes: string[] = [];

    try {
      const bqRows = await prisma.$queryRawUnsafe<Array<{ personnel_number: string }>>(
        `SELECT DISTINCT personnel_number FROM bq_raw.p_emps WHERE personnel_number IS NOT NULL`
      );
      const bqSet = new Set(bqRows.map((r) => r.personnel_number.trim()));
      const bqCleanSet = new Set(bqRows.map((r) => r.personnel_number.replace(/^0+/, "")));

      for (const code of uniqueEmpCodes) {
        const cleanCode = code.replace(/^0+/, "");
        if (bqSet.has(code) || bqCleanSet.has(cleanCode)) {
          bqMatchedCount++;
        } else {
          unmatchedCodes.push(code);
        }
      }

      console.log(`  - Cocok dengan bq_raw.p_emps (BigQuery SAP Mirror)      : ${bqMatchedCount} karyawan (${((bqMatchedCount / uniqueEmpCodes.length) * 100).toFixed(1)}%)`);
      console.log(`  - Tidak ditemukan di bq_raw.p_emps                      : ${unmatchedCodes.length} karyawan (${((unmatchedCodes.length / uniqueEmpCodes.length) * 100).toFixed(1)}%)`);

      // Pemecahan berdasarkan panjang karakter
      const lengthBreakdown = unmatchedCodes.reduce((acc, code) => {
        const len = code.length;
        acc[len] = (acc[len] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      console.log(`\n    Rincian Karyawan Tidak Cocok Menurut Panjang Karakter Emp Code:`);
      const sortedLengths = Object.keys(lengthBreakdown).map(Number).sort((a, b) => a - b);
      for (const len of sortedLengths) {
        const count = lengthBreakdown[len];
        let explanation = "";
        if (len === 11) {
          explanation = "Format kontraktor / vendor / partner eksternal (kode ber-prefix seperti ASJ)";
        } else if (len === 8) {
          explanation = "Format standar SAP 8-digit (unit bisnis/entitas anak di luar scope mirror BQ aktif, atau karyawan non-aktif)";
        } else if (len === 7) {
          explanation = "Nomor personil legacy / historis 7-digit tanpa padding nol";
        } else if (len === 6) {
          explanation = "Nomor personil legacy pendek / kode penugasan khusus 6-digit";
        } else {
          explanation = `Format variasi kode karyawan (${len} karakter)`;
        }
        console.log(`      * Panjang ${len} karakter : ${count} karyawan — ${explanation}`);
      }
    } catch {
      console.log("  - bq_raw.p_emps tidak tersedia untuk pencocokan.");
    }

    // 7. Periksa Status Idempotensi di Database (Simulasi vs Apply)
    // Cek berapa ID deterministik yang sudah ada vs baru
    const sampleIds = transformedRecords.map((r) => r.id);
    const existingDbRecords = await prisma.employeeScorecardSetting.findMany({
      where: { id: { in: sampleIds } },
      select: { id: true },
    });
    const existingIdSet = new Set(existingDbRecords.map((r) => r.id));

    let wouldBeCreated = 0;
    let wouldBeUpdated = 0;

    for (const rec of transformedRecords) {
      if (existingIdSet.has(rec.id)) {
        wouldBeUpdated++;
      } else {
        wouldBeCreated++;
      }
    }

    console.log(`\n[7] STATUS IDEMPOTENSI (UPSERT)`);
    console.log(`  - Data yang akan DIBUAT (Insert baru)                   : ${wouldBeCreated}`);
    console.log(`  - Data yang akan DIPERBARUI (Update existing)           : ${wouldBeUpdated}`);
    console.log(`  - Data yang dilewati (Deduplikasi identik dibuang)      : ${exactDuplicatesDropped}`);

    // 8. Eksekusi Write (HANYA jika flag --apply aktif)
    if (isApply) {
      console.log(`\n[8] MENJALANKAN WRITE DATABASE (TRANSACTION BATCHES)...`);
      const BATCH_SIZE = 500;
      let processedCount = 0;

      for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
        const batch = transformedRecords.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((item) =>
            prisma.employeeScorecardSetting.upsert({
              where: { id: item.id },
              create: item,
              update: {
                employeeName: item.employeeName,
                orgUnit: item.orgUnit,
                supervisorName: item.supervisorName,
                program: item.program,
                strategyPillar: item.strategyPillar,
                isGroup: item.isGroup,
                parentGroupName: item.parentGroupName,
                goalName: item.goalName,
                goalDescription: item.goalDescription,
                reviewPeriod: item.reviewPeriod,
                uom: item.uom,
                target: item.target,
                weight: item.weight,
                levels: item.levels,
                status: item.status,
                kpiScore: item.kpiScore,
                scorecardScore: item.scorecardScore,
                updatedAt: new Date(),
              },
            })
          )
        );
        processedCount += batch.length;
        process.stdout.write(`\r  Progress: ${processedCount} / ${transformedRecords.length} baris tersimpan...`);
      }
      console.log(`\n  ✔ SELESAI: ${processedCount} baris berhasil di-upsert ke database.`);
    } else {
      console.log(`\n[8] DRY-RUN SELESAI`);
      console.log(`  Mode simulasi aktif. Tidak ada data yang ditulis atau diubah di database.`);
      console.log(`  Untuk menjalankan penulisan aktual, jalankan dengan flag: --apply`);
    }

    console.log("\n" + "=".repeat(70));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Terjadi kesalahan saat eksekusi:", err);
  process.exit(1);
});
