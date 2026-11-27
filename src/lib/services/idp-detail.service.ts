import type {
  IdpEmployeeSection,
} from "@/components/learning/idp-detail-dialog";
import {
  aiPriority,
  buildAiCurrentGapActivities,
  buildCandidateSuccessionTargets,
  buildCareerPathActivitiesForEmployee,
  buildDeduplicatedActivities,
} from "@/lib/services/idp-builder.service";
import { listEmployeeMaster } from "@/lib/services/hr-modules.service";
import { listLearningMonitoring } from "@/lib/services/learning-monitoring.service";
import {
  getSuccessionPipelineFromDb,
  listAllSuccessorsDirectory,
} from "@/lib/services/succession.service";
import {
  listLatestCareerPathIdpDefaults,
  listLatestSkillGapIdpDefaults,
  listLatestSuccessionIdpDefaults,
  resolveSuccessionIdpDefault,
  runTalentAiAnalysis,
} from "@/lib/services/talent-ai.service";
import {
  listEmployeeTrainingRequests,
  type EmployeeTrainingRequest,
} from "@/lib/services/training-catalog.service";

/**
 * Builds the exact same AI-only IDP detail section (Succession Plan, Current Gap, Career Path)
 * for a single employee as /learning/idp, used by the Succession Planning popup and /trainings.
 */
export async function getIdpDetailForEmployee(
  employeeName: string,
  employeeIdOverride?: string
): Promise<{
  employee: IdpEmployeeSection | null;
  trainingRequests: EmployeeTrainingRequest[];
}> {
  const targetNameLower = employeeName.trim().toLowerCase();
  const targetIdTrimmed = employeeIdOverride?.trim() ?? "";
  if (!targetNameLower && !targetIdTrimmed) {
    return { employee: null, trainingRequests: [] };
  }

  const [allEmployeesMaster, allTrainingRequests, dbSuccessionPipeline] =
    await Promise.all([
      listEmployeeMaster(),
      listEmployeeTrainingRequests(),
      getSuccessionPipelineFromDb(),
    ]);

  const emp =
    (targetIdTrimmed
      ? allEmployeesMaster.find(
          (e) => e.profileId === targetIdTrimmed || e.employeeId === targetIdTrimmed
        )
      : undefined) ??
    allEmployeesMaster.find((e) => e.name.toLowerCase().trim() === targetNameLower);
  const resolvedLookupName = (emp?.name || employeeName).trim().toLowerCase();
  const successionDirectory = listAllSuccessorsDirectory(dbSuccessionPipeline);
  const succ = successionDirectory.find(
    (s) => s.name.toLowerCase().trim() === resolvedLookupName
  );

  if (!succ && !emp) {
    return { employee: null, trainingRequests: [] };
  }

  const resolvedName = succ?.name || emp?.name || employeeName.trim();
  const profileId =
    emp?.profileId ||
    resolvedName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const [savedMonitoring, aiDefaults, careerPathAiDefaults, initialSuccessionAiDefaults] =
    await Promise.all([
      listLearningMonitoring([profileId]),
      listLatestSkillGapIdpDefaults([profileId]),
      listLatestCareerPathIdpDefaults([profileId]),
      listLatestSuccessionIdpDefaults([profileId]),
    ]);

  const isCandidate = Boolean(succ && succ.assignments.length > 0);
  let effectiveSuccessionDefaults = initialSuccessionAiDefaults;

  // Jika kandidat masuk Succession (bisa 1 atau lebih target) & AI SUCCESSION_IDP belum tersedia untuk target tertentu, auto-generate.
  if (isCandidate && succ && emp) {
    let generatedAny = false;
    for (const assignment of succ.assignments) {
      const existing = resolveSuccessionIdpDefault(
        effectiveSuccessionDefaults,
        profileId,
        assignment.targetPositionTitle
      );
      if (existing) continue;
      try {
        await runTalentAiAnalysis({
          analysisType: "SUCCESSION_IDP",
          employeeId: profileId,
          targetPosition: assignment.targetPositionTitle,
          requestedBy: "system-succession-auto",
        });
        generatedAny = true;
      } catch (err) {
        console.warn("[AUTO_SUCCESSION_IDP]", err);
      }
    }
    if (generatedAny) {
      effectiveSuccessionDefaults = await listLatestSuccessionIdpDefaults([profileId]);
    }
  }

  const ai = aiDefaults.get(profileId);
  const careerPathAi = careerPathAiDefaults.get(profileId);
  const monitoringByEmployeeAndKey = new Map(
    savedMonitoring.map((item) => [
      `${item.employeePersonnelNumber}:${item.activityKey}`,
      item,
    ])
  );

  const empRequests = allTrainingRequests.filter(
    (r) =>
      r.employeePersonnelNumber === profileId ||
      (emp?.employeeId && r.employeePersonnelNumber === emp.employeeId) ||
      r.employeeName.toLowerCase().trim() === resolvedName.toLowerCase().trim()
  );

  const currentPosition =
    succ?.currentPosition || emp?.currentPosition || "Operational Specialist";
  const department = succ?.department || emp?.department || "Operations";
  const division = emp?.division || department;
  const directorate = emp?.directorate || "OPERATION & HSE DIRECTORATE";

  // 1. Current Gap activities (hanya jika AI SKILL_GAP sudah digenerate atau sudah diedit Leader)
  const defaultCurrentGap = buildAiCurrentGapActivities(
    profileId,
    resolvedName,
    department,
    ai
  );
  const currentGapKeys = new Set(defaultCurrentGap.map((a) => a.activityKey));
  const customCurrentGap = savedMonitoring.filter(
    (saved) =>
      saved.employeePersonnelNumber === profileId &&
      !currentGapKeys.has(saved.activityKey) &&
      !saved.activityKey.startsWith("SUCCESSION_") &&
      !saved.activityKey.startsWith("SUCCESSION:") &&
      !saved.activityKey.startsWith("CAREER_ROTATION_") &&
      !saved.activityKey.startsWith("CUSTOM:SUCCESSION:") &&
      !saved.activityKey.startsWith("CUSTOM:CAREER:")
  );
  const currentGapActivities = buildDeduplicatedActivities(
    defaultCurrentGap,
    customCurrentGap,
    profileId,
    resolvedName,
    monitoringByEmployeeAndKey,
    empRequests
  );

  const aiGaps = ai?.prioritySkillGaps.map((g) => g.skillName).filter(Boolean) ?? [];
  const currentGapText = aiGaps.length
    ? aiGaps.join(", ")
    : "Belum digenerate oleh AI Current Gap. Silakan generate dari menu Talent → Current Gap / Skill Needs.";

  // 2. Succession Plan activities (mendukung 1..N target incumbent/role berbeda)
  const candidateTargets =
    isCandidate && succ
      ? buildCandidateSuccessionTargets({
          employeePersonnelNumber: profileId,
          employeeName: resolvedName,
          assignments: succ.assignments,
          successionAiDefaults: effectiveSuccessionDefaults,
          empSavedRows: savedMonitoring.filter((saved) => saved.employeePersonnelNumber === profileId),
          monitoringByEmployeeAndKey,
          empRequests,
        })
      : [];
  const candidateTarget = candidateTargets[0];

  // 3. Career Path activities (hanya jika AI CAREER_PATH sudah digenerate atau sudah diedit Leader)
  const careerPathTarget = buildCareerPathActivitiesForEmployee(
    {
      profileId,
      name: resolvedName,
      currentPosition,
      department,
      division,
      directorate,
      currentPositionDuration: emp?.currentPositionDuration,
      lastPromotionDate: emp?.lastPromotionDate,
      joinDate: emp?.joinDate,
      careerHistory: emp?.careerHistory,
      aspiration: emp?.aspiration,
      isCandidate,
    },
    monitoringByEmployeeAndKey,
    savedMonitoring,
    empRequests,
    candidateTarget?.targetPositionTitle,
    careerPathAi
  );

  // Jika karyawan tidak punya Succession, Current Gap AI, Career Path AI, ataupun saved monitoring -> tidak masuk IDP
  const hasAnyIdpContent =
    isCandidate ||
    Boolean(ai) ||
    Boolean(careerPathAi) ||
    currentGapActivities.length > 0 ||
    careerPathTarget.activities.length > 0;

  if (!hasAnyIdpContent) {
    return { employee: null, trainingRequests: empRequests };
  }

  return {
    employee: {
      id: profileId,
      profileId,
      employeeName: resolvedName,
      currentPosition,
      department,
      division,
      directorate,
      isCandidate,
      candidateTarget,
      candidateTargets,
      currentGapTarget: {
        targetPositionTitle: ai?.targetPosition || "-",
        gap: currentGapText,
        priority: aiPriority(ai) ?? "-",
        hasAiDefault: Boolean(ai),
        activities: currentGapActivities,
      },
      careerPathTarget,
    },
    trainingRequests: empRequests,
  };
}
