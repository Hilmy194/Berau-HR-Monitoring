import "./load-env";
import { PrismaClient } from "@prisma/client";
import { ALL_CADENCE_ITEMS } from "../src/lib/data/development-program-cadence";
import { DUMMY_TRAINING_CATALOG } from "../src/lib/services/training-catalog.service";

const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

async function main() {
  console.log("=== SEEDING CADENCE & TRAINING CATALOG TO POSTGRESQL ===");

  // 1. Seed Training Catalog (15 items)
  console.log(`Seeding ${DUMMY_TRAINING_CATALOG.length} items to training_catalog...`);
  for (const item of DUMMY_TRAINING_CATALOG) {
    await prisma.trainingCatalog.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        trainingTitle: item.trainingTitle,
        skill: item.skill,
        stemType: item.stemType,
        trainingType: item.trainingType,
        vendor: item.vendor,
        cost: item.cost,
        flightCost: item.flightCost,
        hotelCost: item.hotelCost,
        updCost: item.updCost,
        transportCost: item.transportCost,
        totalCost: item.totalCost,
        budgetCode: item.budgetCode,
        scheduleDate: item.date,
        preAssessmentRequired: item.preAssessmentRequired,
        targetAudience: item.targetAudience,
        description: item.description,
      },
      update: {
        trainingTitle: item.trainingTitle,
        skill: item.skill,
        stemType: item.stemType,
        trainingType: item.trainingType,
        vendor: item.vendor,
        cost: item.cost,
        flightCost: item.flightCost,
        hotelCost: item.hotelCost,
        updCost: item.updCost,
        transportCost: item.transportCost,
        totalCost: item.totalCost,
        budgetCode: item.budgetCode,
        scheduleDate: item.date,
        preAssessmentRequired: item.preAssessmentRequired,
        targetAudience: item.targetAudience,
        description: item.description,
      },
    });
  }
  console.log("Training catalog seeded successfully.");

  // 2. Seed Cadence Development Program (41 items)
  console.log(`Seeding ${ALL_CADENCE_ITEMS.length} items to development_program_cadence...`);
  for (const item of ALL_CADENCE_ITEMS) {
    await prisma.developmentProgramCadence.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        code: item.code ?? null,
        category: item.category,
        categoryLabel: item.categoryLabel,
        startDateDisplay: item.startDateDisplay,
        endDateDisplay: item.endDateDisplay,
        startIso: item.startIso,
        endIso: item.endIso,
        pax: item.pax ?? null,
        remarks: item.remarks ?? null,
        targetAudience: item.targetAudience ?? null,
        vendorOrProvider: item.vendorOrProvider ?? null,
        budgetCode: item.budgetCode ?? null,
        estimatedCost: item.estimatedCost ?? null,
        activeMonths: item.activeMonths ?? [],
        colorTone: item.colorTone,
        stemType: item.stemType ?? null,
        trainingType: item.trainingType ?? null,
        description: item.description ?? null,
      },
      update: {
        name: item.name,
        code: item.code ?? null,
        category: item.category,
        categoryLabel: item.categoryLabel,
        startDateDisplay: item.startDateDisplay,
        endDateDisplay: item.endDateDisplay,
        startIso: item.startIso,
        endIso: item.endIso,
        pax: item.pax ?? null,
        remarks: item.remarks ?? null,
        targetAudience: item.targetAudience ?? null,
        vendorOrProvider: item.vendorOrProvider ?? null,
        budgetCode: item.budgetCode ?? null,
        estimatedCost: item.estimatedCost ?? null,
        activeMonths: item.activeMonths ?? [],
        colorTone: item.colorTone,
        stemType: item.stemType ?? null,
        trainingType: item.trainingType ?? null,
        description: item.description ?? null,
      },
    });
  }
  console.log("Development Program Cadence seeded successfully.");

  // 3. Verify Counts
  const catalogCount = await prisma.trainingCatalog.count();
  const cadenceCount = await prisma.developmentProgramCadence.count();
  console.log(`VERIFICATION: training_catalog = ${catalogCount} rows, development_program_cadence = ${cadenceCount} rows.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
