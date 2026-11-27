import { prisma } from "../prisma";
import {
  ALL_CADENCE_ITEMS,
  type CadenceScheduleItem,
  type CadenceCategory,
} from "../data/development-program-cadence";

/**
 * Mengambil master jadwal Cadence Development Program & Sesi Pelatihan
 * langsung dari tabel database PostgreSQL `development_program_cadence`.
 */
export async function listCadenceScheduleFromDb(): Promise<CadenceScheduleItem[]> {
  try {
    const rows = await prisma.developmentProgramCadence.findMany({
      orderBy: { startIso: "asc" },
    });
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code ?? undefined,
        category: r.category as CadenceCategory,
        categoryLabel: r.categoryLabel,
        startDateDisplay: r.startDateDisplay,
        endDateDisplay: r.endDateDisplay,
        startIso: r.startIso,
        endIso: r.endIso,
        pax: r.pax ?? undefined,
        remarks: r.remarks ?? undefined,
        targetAudience: r.targetAudience ?? undefined,
        vendorOrProvider: r.vendorOrProvider ?? undefined,
        budgetCode: r.budgetCode ?? undefined,
        estimatedCost: r.estimatedCost ? Number(r.estimatedCost) : undefined,
        activeMonths: r.activeMonths,
        colorTone: r.colorTone as "emerald" | "blue" | "purple" | "amber" | "rose" | "teal",
        stemType: (r.stemType as "STEM" | "Non-STEM") ?? undefined,
        trainingType: (r.trainingType as "Inhouse" | "Outhouse") ?? undefined,
        description: r.description ?? undefined,
      }));
    }
  } catch (err) {
    console.warn("DB development_program_cadence query fallback to static:", err);
  }
  return ALL_CADENCE_ITEMS;
}
