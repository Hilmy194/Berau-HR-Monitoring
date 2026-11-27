import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  findBestCatalogMatchForSkill,
  listTrainingCatalog,
  listEmployeeTrainingRequests,
  type TrainingCatalogItem,
} from "@/lib/services/training-catalog.service";
import { listEmployeeMaster, resolveEmployeeForSession } from "@/lib/services/hr-modules.service";
import { getIdpDetailForEmployee } from "@/lib/services/idp-detail.service";
import type { LearningActivityType } from "@/lib/services/learning-monitoring.service";
import {
  EmployeeTrainingSubmission,
  type IdpTrackType,
  type RecommendationItem,
} from "@/components/app/employee-training-submission";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengajuan Training & IDP Mandiri — Harmoni PT Berau Coal",
};

function matchCatalogForProgram(
  programName: string,
  skill: string,
  catalog: TrainingCatalogItem[]
): TrainingCatalogItem | undefined {
  const codeMatch = programName.match(/\[(TRN-[A-Z0-9-]+)\]/i);
  if (codeMatch) {
    const byCode = catalog.find((c) => c.id.toLowerCase() === codeMatch[1].toLowerCase());
    if (byCode) return byCode;
  }
  const titleLower = programName.toLowerCase();
  const byTitle = catalog.find(
    (c) =>
      titleLower.includes(c.trainingTitle.toLowerCase()) ||
      c.trainingTitle.toLowerCase().includes(titleLower)
  );
  if (byTitle) return byTitle;
  const fallback = findBestCatalogMatchForSkill(`${programName} ${skill}`);
  return catalog.find((c) => c.id === fallback.id) ?? fallback;
}

export default async function EmployeeTrainingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [allEmployeesMaster, catalog] = await Promise.all([
    listEmployeeMaster(),
    listTrainingCatalog(),
  ]);

  // Cari apakah user terdaftar sebagai karyawan di Dakar (hindari salah cocok saat email dipakai bersama)
  const employeeInDakar = resolveEmployeeForSession(allEmployeesMaster, session.user);

  let nik = "-";
  let name = session.user.name || "Administrator";
  let position = session.user.role === "SUPER_ADMIN" ? "Super Administrator" : "Administrator";
  let department = "IT & HR System Administration";
  let division = "HEAD OFFICE";
  const isNonEmployee = !employeeInDakar;

  if (employeeInDakar) {
    nik = employeeInDakar.employeeId;
    name = employeeInDakar.name;
    position = employeeInDakar.currentPosition;
    department = employeeInDakar.department;
    division = employeeInDakar.division;
  }

  const [allTrainingRequests, idpDetail] = await Promise.all([
    employeeInDakar ? listEmployeeTrainingRequests() : Promise.resolve([]),
    employeeInDakar
      ? getIdpDetailForEmployee(employeeInDakar.name, employeeInDakar.profileId)
      : Promise.resolve(null),
  ]);

  const initialRequests = employeeInDakar
    ? allTrainingRequests.filter(
        (r) =>
          r.employeePersonnelNumber === nik ||
          r.employeeName.toLowerCase().trim() === employeeInDakar.name.toLowerCase().trim()
      )
    : [];

  // Bangun daftar rekomendasi 70-20-10 langsung dari IDP karyawan (Current Gap, Succession, Career Path)
  const aiAndLeaderRecommendations: RecommendationItem[] = [];

  if (idpDetail?.employee) {
    const empIdp = idpDetail.employee;
    const successionTargetsForEmployee =
      empIdp.candidateTargets && empIdp.candidateTargets.length > 0
        ? empIdp.candidateTargets
        : empIdp.candidateTarget
          ? [empIdp.candidateTarget]
          : [];

    const tracks: { track: IdpTrackType; targetPosition?: string; activities: typeof empIdp.currentGapTarget.activities }[] = [
      {
        track: "Current Gap",
        targetPosition: empIdp.currentGapTarget.targetPositionTitle,
        activities: empIdp.currentGapTarget.activities,
      },
      ...successionTargetsForEmployee.map((target) => ({
        track: "Succession Plan" as const,
        targetPosition: target.targetPositionTitle,
        activities: target.activities,
      })),
      {
        track: "Career Path",
        targetPosition: empIdp.careerPathTarget.targetPositionTitle,
        activities: empIdp.careerPathTarget.activities,
      },
    ];

    for (const { track, targetPosition, activities } of tracks) {
      for (const act of activities) {
        const isFormal = act.activityType === "FORMAL_10";
        const matched = isFormal
          ? matchCatalogForProgram(act.programName, act.skillImprovement, catalog)
          : undefined;
        aiAndLeaderRecommendations.push({
          id: `${track}-${act.activityKey}`,
          track,
          targetPosition,
          activityType: act.activityType as LearningActivityType,
          catalogItemId: matched?.id,
          title: act.programName,
          skill: act.skillImprovement,
          stemType: matched?.stemType ?? "Non-STEM",
          vendor: act.provider || "-",
          date: act.timeline || "-",
          totalCost: matched?.totalCost ?? 0,
          budgetCode: matched?.budgetCode ?? "Internal Site / Non-Budget",
          preAssessmentRequired: matched?.preAssessmentRequired ?? "Tidak Ada Pre-Assessment",
          recommendedBy:
            act.alignment.leadReview.status === "LEADER_CUSTOMIZED"
              ? "Leader (Atasan)"
              : "AI Baseline",
          reason:
            act.notes ||
            `Target peran: ${targetPosition || empIdp.currentPosition}. ${act.successCriteria ? `Kriteria keberhasilan: ${act.successCriteria}` : ""}`.trim(),
          successCriteria: act.successCriteria,
          idpStatus: act.status,
        });
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <EmployeeTrainingSubmission
        employeeInfo={{
          nik,
          name,
          position,
          department,
          division,
          isNonEmployee,
        }}
        catalog={catalog}
        initialRequests={initialRequests}
        aiAndLeaderRecommendations={aiAndLeaderRecommendations}
        defaultTab={isNonEmployee || aiAndLeaderRecommendations.length === 0 ? "catalog" : "recommendations"}
      />
    </div>
  );
}
