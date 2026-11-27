import "../prisma/load-env";
import { syncCareerOptionsFromRealTables } from "../src/lib/services/career-options-sync.service";
import { prisma } from "../src/lib/prisma";

async function main() {
  const targetNik = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
  console.log(
    targetNik
      ? `Menyinkronkan career_options untuk NIK ${targetNik} dari tabel real PostgreSQL...`
      : "Menyinkronkan seluruh career_options dari tabel real PostgreSQL (bq_raw + OD + sertifikasi)..."
  );

  const summary = await syncCareerOptionsFromRealTables(targetNik);
  const byStage = await prisma.careerOption.groupBy({
    by: ["pathStage"],
    _count: { id: true },
  });

  console.log("Selesai:", {
    employeesProcessed: summary.employeesProcessed,
    catalogPositionsCount: summary.catalogPositionsCount,
    careerOptionsInserted: summary.careerOptionsInserted,
  });
  console.log("Distribusi per Path Stage:");
  for (const row of byStage) {
    console.log(`- ${row.pathStage}: ${row._count.id} opsi`);
  }
}

main()
  .catch((error) => {
    console.error("Gagal menyinkronkan career_options:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
