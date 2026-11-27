import type { EditableLearningActivity } from "@/components/admin/learning-monitoring-editor";
import type {
  IdpActivityWithAlignment,
  IdpCandidateTarget,
  IdpEmployeeSection,
} from "@/components/learning/idp-detail-dialog";
import {
  buildCareerPathRotationPlan,
  type EmployeeProfileForCareerPath,
} from "@/lib/services/career-path-idp.service";
import type {
  LearningActivityType,
  LearningMonitoringStatus,
  listLearningMonitoring,
} from "@/lib/services/learning-monitoring.service";
import type { SuccessorAssignment } from "@/lib/services/succession.service";
import {
  resolveSuccessionIdpDefault,
  type CareerPathIdpDefault,
  type SkillGapIdpDefault,
} from "@/lib/services/talent-ai.service";
import {
  findBestCatalogMatchForSkill,
  type EmployeeTrainingRequest,
} from "@/lib/services/training-catalog.service";

export type SavedMonitoring = Awaited<ReturnType<typeof listLearningMonitoring>>[number];

function learningTypeLabel(type: LearningActivityType) {
  if (type === "EXPERIENCE_70") return "70% Experience Learning";
  if (type === "SOCIAL_20") return "20% Social Learning";
  return "10% Formal Learning";
}

function findAiRecommendation(
  ai: SkillGapIdpDefault | undefined,
  types: SkillGapIdpDefault["developmentRecommendations"][number]["type"][]
) {
  return ai?.developmentRecommendations.find((item) => types.includes(item.type));
}

function aiPlanText(
  plan: string[] | undefined,
  recommendation: SkillGapIdpDefault["developmentRecommendations"][number] | undefined
) {
  if (plan?.length) return plan.join("\n");
  if (recommendation) {
    return recommendation.description
      ? `${recommendation.title}: ${recommendation.description}`
      : recommendation.title;
  }
  return "";
}

export function extractProgramCode(name: string): string {
  const match = name.match(/\[([A-Z0-9-]+)\]/i);
  return match ? match[1].toUpperCase() : "";
}

export function normalizeProgramTitle(title: string): string {
  return title
    .replace(/\[[A-Z0-9-]+\]/gi, "")
    .replace(/10% Formal Learning:|70% Experience Learning:|20% Social Learning:/gi, "")
    .trim()
    .toLowerCase();
}

export function aiPriority(ai?: SkillGapIdpDefault) {
  if (!ai?.developmentRecommendations.length) return null;
  if (ai.developmentRecommendations.some((item) => item.priority === "HIGH")) return "High";
  if (ai.developmentRecommendations.some((item) => item.priority === "MEDIUM")) return "Medium";
  return "Low";
}

/**
 * Builds Current Gap 70-20-10 activities strictly from generated AI SKILL_GAP result.
 * Returns [] when no AI analysis has been generated yet (never fabricates rule-based defaults).
 */
export function buildAiCurrentGapActivities(
  employeePersonnelNumber: string,
  employeeName: string,
  department: string,
  ai?: SkillGapIdpDefault
): EditableLearningActivity[] {
  if (!ai) return [];

  const targetPosition = ai.targetPosition || "-";
  const aiPrimarySkill = ai.prioritySkillGaps[0]?.skillName || "Competency Development";
  const expRec = findAiRecommendation(ai, ["PROJECT_ASSIGNMENT"]);
  const socRec = findAiRecommendation(ai, ["COACHING", "MENTORING"]);
  const forRec = findAiRecommendation(ai, ["TRAINING", "CERTIFICATION"]);

  const expText = aiPlanText(ai.idpPlan.seventy, expRec);
  const socText = aiPlanText(ai.idpPlan.twenty, socRec);
  const forText = aiPlanText(ai.idpPlan.ten, forRec);
  const formalSkill = forRec?.relatedSkill || aiPrimarySkill;
  const catalogMatch = findBestCatalogMatchForSkill(forText || formalSkill);

  const activities: EditableLearningActivity[] = [];

  if (expText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: "EXPERIENCE_70",
      activityType: "EXPERIENCE_70",
      targetPosition,
      learningType: "70% Experience Learning",
      skillImprovement: expRec?.relatedSkill || aiPrimarySkill,
      programName: expText,
      provider: `Internal - ${department || "Unit Kerja"}`,
      timeline: expRec?.suggestedDuration || "90 hari",
      status: "NOT_STARTED",
      successCriteria: expRec?.expectedEvidence || "Penyelesaian output project & validasi atasan.",
      notes: "Dihasilkan oleh AI Current Gap Analysis.",
      version: 0,
    });
  }

  if (socText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: "SOCIAL_20",
      activityType: "SOCIAL_20",
      targetPosition,
      learningType: "20% Social Learning",
      skillImprovement: socRec?.relatedSkill || aiPrimarySkill,
      programName: socText,
      provider: "Internal Berau Coal (Mentoring)",
      timeline: socRec?.suggestedDuration || "90 hari",
      status: "NOT_STARTED",
      successCriteria: socRec?.expectedEvidence || "Evaluasi sesi coaching/mentoring dengan atasan.",
      notes: "Dihasilkan oleh AI Current Gap Analysis.",
      version: 0,
    });
  }

  if (forText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: "FORMAL_10",
      activityType: "FORMAL_10",
      targetPosition,
      learningType: "10% Formal Learning",
      skillImprovement: formalSkill,
      programName: `[${catalogMatch.id}] ${forText}`,
      provider: `${catalogMatch.vendor} (${catalogMatch.stemType} - ${catalogMatch.trainingType})`,
      timeline: forRec?.suggestedDuration || catalogMatch.date,
      status: "NOT_STARTED",
      successCriteria:
        forRec?.expectedEvidence ||
        `Biaya: Rp ${catalogMatch.totalCost.toLocaleString("id-ID")} (${catalogMatch.budgetCode}) · Pre-assessment: ${catalogMatch.preAssessmentRequired}`,
      notes: `Dihasilkan oleh AI Current Gap Analysis (Budget katalog referensi: ${catalogMatch.budgetCode}).`,
      version: 0,
    });
  }

  return activities;
}

export function buildSuccessionScopeSlug(targetPosition: string, targetIncumbent?: string | null): string {
  const slug = `${targetPosition}-${targetIncumbent ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (slug || "target").slice(0, 42);
}

/**
 * Builds Succession 70-20-10 activities strictly from generated AI SUCCESSION_IDP result.
 * Returns [] when no AI analysis has been generated yet (never fabricates rule-based defaults).
 */
export function buildAiSuccessionActivities(
  employeePersonnelNumber: string,
  employeeName: string,
  targetPosition: string,
  targetIncumbent: string,
  readiness: string,
  ai?: SkillGapIdpDefault,
  scopeKey?: string
): EditableLearningActivity[] {
  if (!ai) return [];

  const expRec = findAiRecommendation(ai, ["PROJECT_ASSIGNMENT"]);
  const socRec = findAiRecommendation(ai, ["COACHING", "MENTORING"]);
  const forRec = findAiRecommendation(ai, ["TRAINING", "CERTIFICATION"]);

  const expText = aiPlanText(ai.idpPlan.seventy, expRec);
  const socText = aiPlanText(ai.idpPlan.twenty, socRec);
  const forText = aiPlanText(ai.idpPlan.ten, forRec);
  const formalSkill = forRec?.relatedSkill || ai.prioritySkillGaps[0]?.skillName || targetPosition;
  const catalogMatch = findBestCatalogMatchForSkill(forText || formalSkill || "Leadership");
  const readinessLabel = readiness === "READY_NOW" ? "Ready Now" : "Ready Later";
  const prefix = scopeKey ? `SUCCESSION:${scopeKey}:` : "SUCCESSION_";

  const activities: EditableLearningActivity[] = [];

  if (expText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: `${prefix}EXP_70`,
      activityType: "EXPERIENCE_70",
      targetPosition,
      learningType: "70% Experience Learning",
      skillImprovement: expRec?.relatedSkill || ai.prioritySkillGaps[0]?.skillName || "Strategic Leadership",
      programName: expText,
      provider: "Internal - Directorate Operations & Leadership",
      timeline: expRec?.suggestedDuration || "6 bulan",
      status: "IN_PROGRESS",
      successCriteria:
        expRec?.expectedEvidence ||
        `Mampu menjalankan tugas strategis target posisi ${targetPosition} dengan evaluasi atasan memuaskan.`,
      notes: `AI Succession IDP (${targetIncumbent} · ${readinessLabel}).`,
      version: 0,
    });
  }

  if (socText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: `${prefix}SOC_20`,
      activityType: "SOCIAL_20",
      targetPosition,
      learningType: "20% Social Learning",
      skillImprovement: socRec?.relatedSkill || "Executive Mentoring & Stakeholder Influence",
      programName: socText,
      provider: "Board of Management & Internal Berau Coal",
      timeline: socRec?.suggestedDuration || "6 bulan",
      status: "IN_PROGRESS",
      successCriteria:
        socRec?.expectedEvidence ||
        `Terlaksana sesi mentoring & leadership transfer bersama ${targetIncumbent}.`,
      notes: "AI Succession IDP (Mentoring & Executive Shadowing).",
      version: 0,
    });
  }

  if (forText) {
    activities.push({
      employeePersonnelNumber,
      employeeName,
      activityKey: `${prefix}FOR_10`,
      activityType: "FORMAL_10",
      targetPosition,
      learningType: "10% Formal Learning",
      skillImprovement: formalSkill || catalogMatch.skill,
      programName: `[${catalogMatch.id}] ${forText}`,
      provider: `${catalogMatch.vendor} (${catalogMatch.stemType} - ${catalogMatch.trainingType})`,
      timeline: forRec?.suggestedDuration || catalogMatch.date,
      status: "NOT_STARTED",
      successCriteria:
        forRec?.expectedEvidence ||
        `Biaya: Rp ${catalogMatch.totalCost.toLocaleString("id-ID")} (${catalogMatch.budgetCode}) · Pre-assessment: ${catalogMatch.preAssessmentRequired}`,
      notes: `AI Succession IDP sesuai Katalog Pelatihan Berau Coal (${catalogMatch.budgetCode}).`,
      version: 0,
    });
  }

  return activities;
}

export function buildCandidateSuccessionTargets(params: {
  employeePersonnelNumber: string;
  employeeName: string;
  assignments: SuccessorAssignment[];
  successionAiDefaults: Map<string, SkillGapIdpDefault>;
  empSavedRows: SavedMonitoring[];
  monitoringByEmployeeAndKey: Map<string, SavedMonitoring>;
  empRequests: EmployeeTrainingRequest[];
}): IdpCandidateTarget[] {
  const {
    employeePersonnelNumber,
    employeeName,
    assignments,
    successionAiDefaults,
    empSavedRows,
    monitoringByEmployeeAndKey,
    empRequests,
  } = params;
  const isMultiTarget = assignments.length > 1;

  return assignments.map((assignment, index) => {
    const slug = buildSuccessionScopeSlug(assignment.targetPositionTitle, assignment.targetIncumbentName);
    const scopeKey = isMultiTarget ? slug : undefined;
    const successionAi = resolveSuccessionIdpDefault(
      successionAiDefaults,
      employeePersonnelNumber,
      assignment.targetPositionTitle
    );
    const defaultSucc = buildAiSuccessionActivities(
      employeePersonnelNumber,
      employeeName,
      assignment.targetPositionTitle,
      assignment.targetIncumbentName,
      assignment.readiness,
      successionAi,
      scopeKey
    );
    const succKeys = new Set(defaultSucc.map((a) => a.activityKey));
    const customSucc = empSavedRows.filter((saved) => {
      if (succKeys.has(saved.activityKey)) return false;
      if (isMultiTarget) {
        if (saved.activityKey.startsWith(`SUCCESSION:${slug}:`) || saved.activityKey.startsWith(`CUSTOM:SUCCESSION:${slug}:`)) {
          return true;
        }
        // Keep un-scoped legacy custom entries on the primary target
        return index === 0 && (saved.activityKey.startsWith("SUCCESSION_") || /^CUSTOM:SUCCESSION:\d+/.test(saved.activityKey));
      }
      return saved.activityKey.startsWith("SUCCESSION_") || saved.activityKey.startsWith("SUCCESSION:") || saved.activityKey.startsWith("CUSTOM:SUCCESSION:");
    });

    const succActivities = buildDeduplicatedActivities(
      defaultSucc,
      customSucc,
      employeePersonnelNumber,
      employeeName,
      monitoringByEmployeeAndKey,
      empRequests
    );
    const succAiGaps = successionAi?.prioritySkillGaps.map((g) => g.skillName).filter(Boolean) ?? [];

    return {
      key: slug,
      rawPositionTitle: assignment.targetPositionTitle,
      targetPositionTitle: `${assignment.targetPositionTitle} (Suksesor ${assignment.targetIncumbentName})`,
      targetIncumbentName: assignment.targetIncumbentName,
      targetDivision: assignment.targetDivision,
      targetDirectorate: assignment.targetDirectorate,
      readiness: assignment.readiness,
      source: assignment.source,
      gap:
        assignment.notes ||
        (succAiGaps.length
          ? succAiGaps.join(", ")
          : `Penguatan kepemimpinan strategis untuk suksesi ${assignment.targetIncumbentName}`),
      priority: assignment.readiness === "READY_NOW" ? "Ready Now (Critical)" : "Ready Later",
      hasAiDefault: Boolean(successionAi),
      activities: succActivities,
    };
  });
}

export function buildDeduplicatedActivities(
  defaults: EditableLearningActivity[],
  customSaved: SavedMonitoring[],
  employeePersonnelNumber: string,
  employeeName: string,
  monitoringByEmployeeAndKey: Map<string, SavedMonitoring>,
  empRequests: EmployeeTrainingRequest[]
): IdpActivityWithAlignment[] {
  const mappedDefaults = defaults.map((activity) => {
    const saved = monitoringByEmployeeAndKey.get(`${employeePersonnelNumber}:${activity.activityKey}`);
    const act = saved ? savedActivity(activity, saved) : activity;
    return compute3WayAlignmentEnriched(act, saved, empRequests, activity);
  });
  const mappedCustom = customSaved.map((saved) => {
    const act = savedActivityFromScratch(employeeName, saved);
    return compute3WayAlignmentEnriched(act, saved, empRequests);
  });

  const combined = [...mappedDefaults, ...mappedCustom];
  const leaderCustomizedTypes = new Set(
    combined
      .filter((a) => a.alignment.leadReview.status === "MODIFIED")
      .map((a) => a.activityType)
  );
  return combined.filter(
    (a) =>
      a.alignment.leadReview.status === "MODIFIED" || !leaderCustomizedTypes.has(a.activityType)
  );
}

export function buildCareerPathActivitiesForEmployee(
  empProfile: EmployeeProfileForCareerPath,
  monitoringByEmployeeAndKey: Map<string, SavedMonitoring>,
  allSavedForEmployee: SavedMonitoring[],
  empRequests: EmployeeTrainingRequest[],
  targetOverride?: string,
  aiCareerPath?: CareerPathIdpDefault
): IdpEmployeeSection["careerPathTarget"] {
  const simulation = buildCareerPathRotationPlan(empProfile, targetOverride, aiCareerPath);
  const careerKeys = new Set(simulation.activities.map((a) => a.activityKey));
  const customCareerSaved = allSavedForEmployee.filter(
    (saved) =>
      !careerKeys.has(saved.activityKey) &&
      (saved.activityKey.startsWith("CAREER_ROTATION_") ||
        saved.activityKey.startsWith("CUSTOM:CAREER:"))
  );

  const enrichedActivities = buildDeduplicatedActivities(
    simulation.activities,
    customCareerSaved,
    empProfile.profileId,
    empProfile.name,
    monitoringByEmployeeAndKey,
    empRequests
  );

  return {
    ...simulation,
    activities: enrichedActivities,
  };
}

export function compute3WayAlignmentEnriched(
  activity: EditableLearningActivity,
  saved: SavedMonitoring | undefined,
  employeeTrainingRequests?: EmployeeTrainingRequest[],
  defaultActivity?: EditableLearningActivity
): IdpActivityWithAlignment {
  const defProgram = defaultActivity?.programName || activity.programName;
  const defProvider = defaultActivity?.provider || activity.provider;

  const isModifiedByLead = Boolean(
    saved &&
      (!defaultActivity ||
        saved.programName.trim() !== defaultActivity.programName.trim() ||
        saved.provider.trim() !== defaultActivity.provider.trim() ||
        saved.skillImprovement.trim() !== defaultActivity.skillImprovement.trim() ||
        saved.timeline.trim() !== defaultActivity.timeline.trim() ||
        (saved.notes &&
          saved.notes.trim() !== "" &&
          saved.notes.trim() !== (defaultActivity.notes || "").trim()))
  );

  const aiBaseline = {
    label: "Rekomendasi AI Baseline",
    badgeClass: "bg-purple-50 text-purple-900 border-purple-200 font-medium",
    originalProgram: defProgram,
  };

  const leadReview = isModifiedByLead
    ? {
        status: "MODIFIED",
        label: "✏️ Disesuaikan Lead",
        badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
        isModified: true,
        leaderNotes: saved?.notes || undefined,
      }
    : {
        status: "APPROVED",
        label: "✨ Sesuai AI Baseline",
        badgeClass: "bg-purple-50 text-purple-900 border-purple-200 font-medium",
        isModified: false,
      };

  const activityCode = extractProgramCode(activity.programName);
  const activityNormTitle = normalizeProgramTitle(activity.programName);

  let employeeTraining = {
    status: "NOT_REGISTERED",
    label: "Belum Mengajukan",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
    matchedRequestTitle: undefined as string | undefined,
    matchedRequestStatus: undefined as string | undefined,
    isMismatch: false,
    detail: "Belum ada pengajuan di Portal Training",
  };

  const requests = employeeTrainingRequests || [];
  const matchedReq =
    activity.activityType === "FORMAL_10"
      ? requests.find((r) => {
          if (activityCode && r.catalogItemId && r.catalogItemId.toUpperCase() === activityCode) {
            return true;
          }
          const reqCode = extractProgramCode(r.trainingTitle);
          if (activityCode && reqCode && activityCode === reqCode) return true;
          const reqNorm = normalizeProgramTitle(r.trainingTitle);
          if (
            activityNormTitle &&
            reqNorm &&
            (activityNormTitle.includes(reqNorm) || reqNorm.includes(activityNormTitle))
          ) {
            return true;
          }
          if (
            r.skill &&
            activity.skillImprovement &&
            r.skill.toLowerCase().trim() === activity.skillImprovement.toLowerCase().trim()
          ) {
            return true;
          }
          return false;
        })
      : undefined;

  if (matchedReq) {
    if (matchedReq.status === "APPROVED_BY_LEADER") {
      employeeTraining = {
        status: "APPROVED",
        label: "✅ Disetujui Leader",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
        matchedRequestTitle: matchedReq.trainingTitle,
        matchedRequestStatus: matchedReq.status,
        isMismatch: false,
        detail: `Disetujui atasan (${matchedReq.scheduleDate || "TNA Fiori"})`,
      };
    } else if (matchedReq.status === "PENDING_LEADER_APPROVAL") {
      employeeTraining = {
        status: "PENDING_APPROVAL",
        label: "⏳ Menunggu Approval",
        badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
        matchedRequestTitle: matchedReq.trainingTitle,
        matchedRequestStatus: matchedReq.status,
        isMismatch: false,
        detail: "Pengajuan diajukan karyawan, menunggu review atasan",
      };
    } else if (matchedReq.status === "REGISTERED") {
      employeeTraining = {
        status: "REGISTERED",
        label: "🟢 Terdaftar (In-Sync)",
        badgeClass: "bg-blue-50 text-blue-900 border-blue-300 font-semibold",
        matchedRequestTitle: matchedReq.trainingTitle,
        matchedRequestStatus: matchedReq.status,
        isMismatch: false,
        detail: "Karyawan terdaftar resmi pada batch pelatihan",
      };
    } else if (matchedReq.status === "COMPLETED") {
      employeeTraining = {
        status: "COMPLETED",
        label: "🏆 Selesai Pelatihan",
        badgeClass: "bg-teal-50 text-teal-900 border-teal-300 font-semibold",
        matchedRequestTitle: matchedReq.trainingTitle,
        matchedRequestStatus: matchedReq.status,
        isMismatch: false,
        detail: "Karyawan telah menyelesaikan sertifikasi/pelatihan",
      };
    } else if (matchedReq.status === "REJECTED_BY_LEADER") {
      employeeTraining = {
        status: "REJECTED",
        label: "❌ Ditolak Leader",
        badgeClass: "bg-red-50 text-red-900 border-red-200 font-medium",
        matchedRequestTitle: matchedReq.trainingTitle,
        matchedRequestStatus: matchedReq.status,
        isMismatch: false,
        detail: "Pengajuan ditolak/diminta revisi oleh atasan",
      };
    }
  } else if (activity.activityType === "FORMAL_10" && requests.length > 0) {
    const otherReq = requests[0];
    employeeTraining = {
      status: "MISMATCH",
      label: "⚠️ Beda Usulan Training",
      badgeClass: "bg-orange-100 text-orange-950 border-orange-300 font-semibold",
      matchedRequestTitle: otherReq.trainingTitle,
      matchedRequestStatus: otherReq.status,
      isMismatch: true,
      detail: `Karyawan mengajukan: "${otherReq.trainingTitle}" (Berbeda dari rekomendasi IDP)`,
    };
  } else if (activity.activityType !== "FORMAL_10") {
    const norm = activity.status;
    if (norm === "COMPLETED") {
      employeeTraining = {
        status: "COMPLETED",
        label: "✅ Selesai Divalidasi",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
        matchedRequestTitle: undefined,
        matchedRequestStatus: undefined,
        isMismatch: false,
        detail: "Aktivitas OJT/Mentoring telah diselesaikan & divalidasi atasan",
      };
    } else if (norm === "IN_PROGRESS") {
      employeeTraining = {
        status: "IN_PROGRESS",
        label: "🟢 Berjalan (Internal Site)",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
        matchedRequestTitle: undefined,
        matchedRequestStatus: undefined,
        isMismatch: false,
        detail: "Sedang berjalan di unit operasional",
      };
    } else {
      employeeTraining = {
        status: "NOT_STARTED",
        label: "Belum Berjalan",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
        matchedRequestTitle: undefined,
        matchedRequestStatus: undefined,
        isMismatch: false,
        detail: "Menunggu jadwal pelaksanaan",
      };
    }
  }

  return {
    ...activity,
    aiBaselineProgram: defProgram,
    aiBaselineProvider: defProvider,
    alignment: {
      aiBaseline,
      leadReview,
      employeeTraining,
    },
  };
}

export function savedActivity(
  activity: EditableLearningActivity,
  saved: SavedMonitoring
): EditableLearningActivity {
  return {
    ...activity,
    activityKey: saved.activityKey,
    activityType: saved.activityType as LearningActivityType,
    targetPosition: saved.targetPosition ?? activity.targetPosition,
    skillImprovement: saved.skillImprovement,
    programName: saved.programName,
    provider: saved.provider,
    timeline: saved.timeline,
    status: saved.status as LearningMonitoringStatus,
    successCriteria: saved.successCriteria,
    notes: saved.notes ?? "",
    version: saved.version,
  };
}

export function savedActivityFromScratch(
  employeeName: string,
  saved: SavedMonitoring
): EditableLearningActivity {
  const activityType = saved.activityType as LearningActivityType;
  return {
    employeePersonnelNumber: saved.employeePersonnelNumber,
    employeeName,
    activityKey: saved.activityKey,
    activityType,
    learningType: learningTypeLabel(activityType),
    targetPosition: saved.targetPosition ?? "-",
    skillImprovement: saved.skillImprovement,
    programName: saved.programName,
    provider: saved.provider,
    timeline: saved.timeline,
    status: saved.status as LearningMonitoringStatus,
    successCriteria: saved.successCriteria,
    notes: saved.notes ?? "",
    version: saved.version,
  };
}
