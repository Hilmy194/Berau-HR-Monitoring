import "./load-env";
import { PrismaClient } from "@prisma/client";
import { SUCCESSION_DATA } from "../src/lib/services/succession.service";

const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

async function main() {
  console.log("=== SEEDING SUCCESSION PLANNING & HISTORY TO POSTGRESQL ===");

  let targetCount = 0;
  let candidateCount = 0;
  let historyCount = 0;

  for (const target of SUCCESSION_DATA) {
    // 1. Upsert Target
    const dbTarget = await prisma.successionTarget.upsert({
      where: { id: target.id },
      create: {
        id: target.id,
        incumbentName: target.incumbentName,
        incumbentNik: target.incumbentNik ?? null,
        positionTitle: target.positionTitle,
        golongan: target.golongan ?? null,
        directorate: target.directorate,
        division: target.division,
        department: target.department ?? null,
        status: target.status,
        periodYear: 2026,
        isCurrentPeriod: true,
      },
      update: {
        incumbentName: target.incumbentName,
        incumbentNik: target.incumbentNik ?? null,
        positionTitle: target.positionTitle,
        golongan: target.golongan ?? null,
        directorate: target.directorate,
        division: target.division,
        department: target.department ?? null,
        status: target.status,
      },
    });
    targetCount++;

    // 2. Upsert Candidates
    for (const cand of target.successors) {
      const candidateId = `cand-${dbTarget.id}-${cand.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      const dbCandidate = await prisma.successionCandidate.upsert({
        where: { id: candidateId },
        create: {
          id: candidateId,
          targetId: dbTarget.id,
          name: cand.name,
          nik: cand.nik ?? null,
          currentPosition: cand.currentPosition ?? null,
          golongan: cand.golongan ?? null,
          department: cand.department ?? null,
          readiness: cand.readiness,
          source: cand.source,
          priorityOrder: cand.priorityOrder ?? 1,
          periodYear: 2026,
          status: "ACTIVE",
          notes: cand.notes ?? null,
          nominatedBy: "HR Talent Committee (Official Succession Baseline)",
        },
        update: {
          currentPosition: cand.currentPosition ?? null,
          golongan: cand.golongan ?? null,
          department: cand.department ?? null,
          readiness: cand.readiness,
          source: cand.source,
          priorityOrder: cand.priorityOrder ?? 1,
          notes: cand.notes ?? null,
        },
      });
      candidateCount++;

      // 3. Create initial history record if none exists for this candidate
      const existingHistory = await prisma.successionCandidateHistory.findFirst({
        where: {
          candidateId: dbCandidate.id,
          actionType: "INITIAL_NOMINATION",
        },
      });

      if (!existingHistory) {
        await prisma.successionCandidateHistory.create({
          data: {
            targetId: dbTarget.id,
            candidateId: dbCandidate.id,
            candidateNik: dbCandidate.nik,
            candidateName: dbCandidate.name,
            targetPosition: dbTarget.positionTitle,
            targetIncumbent: dbTarget.incumbentName,
            actionType: "INITIAL_NOMINATION",
            periodYear: 2026,
            newReadiness: dbCandidate.readiness,
            newPosition: dbCandidate.currentPosition,
            newDepartment: dbCandidate.department,
            newPriority: dbCandidate.priorityOrder,
            performedBy: "System Migration / HR Baseline",
            notes: `Nominasi awal calon suksesor untuk posisi ${dbTarget.positionTitle} (Pejabat: ${dbTarget.incumbentName}).`,
          },
        });
        historyCount++;
      }
    }
  }

  console.log(`SUCCESS! Seeded ${targetCount} targets, ${candidateCount} candidates, and created ${historyCount} initial history records.`);

  const totalTargets = await prisma.successionTarget.count();
  const totalCandidates = await prisma.successionCandidate.count();
  const totalHistory = await prisma.successionCandidateHistory.count();
  console.log(`DATABASE VERIFICATION: targets = ${totalTargets}, candidates = ${totalCandidates}, history = ${totalHistory}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
