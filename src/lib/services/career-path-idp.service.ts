import type { EditableLearningActivity } from "@/components/admin/learning-monitoring-editor";
import type { LearningActivityType } from "@/lib/services/learning-monitoring.service";
import type { CareerPathIdpDefault } from "@/lib/services/talent-ai.service";
import { findBestCatalogMatchForSkill } from "@/lib/services/training-catalog.service";

export interface CareerRotationPhase {
  phaseNumber: number;
  phaseTitle: string;
  targetDepartment: string;
  targetDivision: string;
  duration: string;
  projectAssignment: string;
  expectedDeliverable: string;
  mentorRole: string;
  focusCompetency: string;
}

export interface CareerPathSimulationData {
  targetPositionTitle: string;
  targetRoleRationale: string;
  rotationNeedLevel: "HIGH" | "MEDIUM" | "NORMAL";
  rotationNeedLabel: string;
  currentPositionDuration: string;
  tenureYears: number;
  stagnationAnalysis: string;
  careerHistorySummary: string[];
  crossFunctionalGaps: string[];
  scenarioTitle: string;
  totalDurationMonths: number;
  phases: CareerRotationPhase[];
  activities: EditableLearningActivity[];
  aiEnriched?: boolean;
  aiFitScore?: number;
  aiPathType?: string;
}

export interface EmployeeProfileForCareerPath {
  profileId: string;
  name: string;
  currentPosition: string;
  department: string;
  division: string;
  directorate: string;
  currentPositionDuration?: string | null;
  lastPromotionDate?: string | null;
  joinDate?: string | null;
  careerHistory?: string[];
  aspiration?: string;
  isCandidate?: boolean;
}

/**
 * Menganalisis durasi masa jabatan dan mendeteksi apakah karyawan sudah lama di posisinya
 * (stuck / butuh rotasi lintas fungsi).
 */
export function analyzePositionTenure(
  durationStr?: string | null,
  lastPromotionDate?: string | null,
  joinDate?: string | null
): {
  durationText: string;
  tenureYears: number;
  rotationNeedLevel: "HIGH" | "MEDIUM" | "NORMAL";
  rotationNeedLabel: string;
  stagnationAnalysis: string;
} {
  let years = 0;
  let months = 0;

  if (durationStr && typeof durationStr === "string") {
    const yearMatch = durationStr.match(/(\d+)\s*(?:years|tahun|thn)/i);
    const monthMatch = durationStr.match(/(\d+)\s*(?:months|bulan|bln)/i);
    if (yearMatch) years = parseInt(yearMatch[1], 10);
    if (monthMatch) months = parseInt(monthMatch[1], 10);
  }

  if (years === 0 && months === 0) {
    const refDateStr = lastPromotionDate || joinDate;
    if (refDateStr) {
      const refDate = new Date(refDateStr);
      if (!isNaN(refDate.getTime())) {
        const now = new Date("2026-11-23");
        const diffMonths = Math.max(
          1,
          (now.getFullYear() - refDate.getFullYear()) * 12 + (now.getMonth() - refDate.getMonth())
        );
        years = Math.floor(diffMonths / 12);
        months = diffMonths % 12;
      }
    }
  }

  if (years === 0 && months === 0) {
    years = 2;
    months = 4;
  }

  const tenureYears = Number((years + months / 12).toFixed(1));
  const durationText = `${years} Tahun ${months} Bulan`;

  if (tenureYears >= 3.0) {
    return {
      durationText,
      tenureYears,
      rotationNeedLevel: "HIGH",
      rotationNeedLabel: "⚠️ Prioritas Rotasi (> 3 Thn di Posisi)",
      stagnationAnalysis: `Karyawan telah berada ${durationText} di posisi saat ini tanpa rotasi fungsi.`,
    };
  }

  if (tenureYears >= 2.0) {
    return {
      durationText,
      tenureYears,
      rotationNeedLevel: "MEDIUM",
      rotationNeedLabel: "🔄 Siap Rotasi Pengembangan (2–3 Thn)",
      stagnationAnalysis: `Karyawan telah berada ${durationText} di posisi saat ini.`,
    };
  }

  return {
    durationText,
    tenureYears,
    rotationNeedLevel: "NORMAL",
    rotationNeedLabel: "On-Track / Persiapan Rotasi",
    stagnationAnalysis: `Masa jabatan saat ini ${durationText}.`,
  };
}

/**
 * Membangun data Career Path IDP murni dari hasil AI Career Path Copilot (Talent).
 * Jika belum di-generate AI di menu Talent -> Career Path, mengembalikan activities = []
 * dan phases = [] (tidak memakai template rule-based manual).
 */
export function buildCareerPathRotationPlan(
  emp: EmployeeProfileForCareerPath,
  targetPositionOverride?: string,
  aiCareerPath?: CareerPathIdpDefault
): CareerPathSimulationData {
  const tenure = analyzePositionTenure(
    emp.currentPositionDuration,
    emp.lastPromotionDate,
    emp.joinDate
  );

  const careerHistorySummary =
    emp.careerHistory && emp.careerHistory.length > 0
      ? emp.careerHistory.map((item) => item.trim()).filter(Boolean)
      : [`Posisi Sekarang: ${emp.currentPosition} (${emp.department})`];

  const pathLabelMap: Record<string, string> = {
    LATERAL_ENRICHMENT: "Pengayaan Lateral (Setara)",
    NEXT_ROLE: "Promosi Vertikal (Next Role)",
    LONG_TERM: "Pengembangan Jangka Panjang",
  };

  if (!aiCareerPath) {
    return {
      targetPositionTitle: targetPositionOverride || "-",
      targetRoleRationale:
        "Belum ada hasil AI Career Path. Silakan generate analisis di menu Talent → Career Path.",
      rotationNeedLevel: tenure.rotationNeedLevel,
      rotationNeedLabel: tenure.rotationNeedLabel,
      currentPositionDuration: tenure.durationText,
      tenureYears: tenure.tenureYears,
      stagnationAnalysis: tenure.stagnationAnalysis,
      careerHistorySummary,
      crossFunctionalGaps: [],
      scenarioTitle: "Career Path (Menunggu Generate AI)",
      totalDurationMonths: 0,
      phases: [],
      activities: [],
      aiEnriched: false,
    };
  }

  const targetPositionTitle = aiCareerPath.targetPosition || targetPositionOverride || "-";
  const finalRationale = `${aiCareerPath.rationale}${aiCareerPath.summary ? ` — ${aiCareerPath.summary}` : ""}`;
  const finalGaps = aiCareerPath.gaps;

  const actions = aiCareerPath.developmentActions.filter(Boolean);
  const aiAction70 = actions[0];
  const aiAction20 = actions[1] || actions[0];
  const aiAction10 = actions[2] || actions[actions.length - 1] || actions[0];
  const catalogMatch = findBestCatalogMatchForSkill(finalGaps[2] || finalGaps[0] || targetPositionTitle);

  const phases: CareerRotationPhase[] = actions.slice(0, 3).map((action, idx) => ({
    phaseNumber: idx + 1,
    phaseTitle: `Fokus Pengembangan ${idx + 1}`,
    targetDepartment: emp.department,
    targetDivision: emp.division,
    duration: "8 Bulan",
    projectAssignment: action,
    expectedDeliverable: finalGaps[idx]
      ? `Menutup gap: ${finalGaps[idx]}`
      : `Kesiapan target posisi ${targetPositionTitle}`,
    mentorRole: "Atasan Langsung / Division Head",
    focusCompetency: finalGaps[idx] || targetPositionTitle,
  }));

  const activities: EditableLearningActivity[] = [];

  if (aiAction70) {
    activities.push({
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_70",
      activityType: "EXPERIENCE_70" as LearningActivityType,
      learningType: "70% Experience Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: finalGaps[0] || targetPositionTitle,
      programName: aiAction70,
      provider: `Internal - ${emp.division || "Unit Operasional"}`,
      timeline: "12–16 bulan",
      status: "NOT_STARTED",
      successCriteria: `Pencapaian target proyek & penutupan gap ${finalGaps[0] || targetPositionTitle}.`,
      notes: `Disinkronkan dari AI Career Path (${aiCareerPath.aiFitScore}% Fit).`,
      version: 0,
    });
  }

  if (aiAction20) {
    activities.push({
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_20",
      activityType: "SOCIAL_20" as LearningActivityType,
      learningType: "20% Social Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: finalGaps[1] || finalGaps[0] || "Stakeholder & Leadership Mentoring",
      programName: aiAction20,
      provider: "Internal Berau Coal (Executive Mentoring)",
      timeline: "6–12 bulan",
      status: "NOT_STARTED",
      successCriteria: `Evaluasi kesiapan peran ${targetPositionTitle} bersama mentor/atasan.`,
      notes: `Disinkronkan dari AI Career Path (${aiCareerPath.aiFitScore}% Fit).`,
      version: 0,
    });
  }

  if (aiAction10) {
    activities.push({
      employeePersonnelNumber: emp.profileId,
      employeeName: emp.name,
      activityKey: "CAREER_ROTATION_10",
      activityType: "FORMAL_10" as LearningActivityType,
      learningType: "10% Formal Learning",
      targetPosition: targetPositionTitle,
      skillImprovement: finalGaps[2] || finalGaps[0] || catalogMatch.skill,
      programName: `[${catalogMatch.id}] ${aiAction10}`,
      provider: `${catalogMatch.vendor} (${catalogMatch.stemType} - ${catalogMatch.trainingType})`,
      timeline: catalogMatch.date,
      status: "NOT_STARTED",
      successCriteria: `Biaya: Rp ${catalogMatch.totalCost.toLocaleString("id-ID")} (${catalogMatch.budgetCode}) · Pre-assessment: ${catalogMatch.preAssessmentRequired}`,
      notes: `Disinkronkan dari AI Career Path (${aiCareerPath.aiFitScore}% Fit).`,
      version: 0,
    });
  }

  return {
    targetPositionTitle,
    targetRoleRationale: finalRationale,
    rotationNeedLevel: tenure.rotationNeedLevel,
    rotationNeedLabel: tenure.rotationNeedLabel,
    currentPositionDuration: tenure.durationText,
    tenureYears: tenure.tenureYears,
    stagnationAnalysis: tenure.stagnationAnalysis,
    careerHistorySummary,
    crossFunctionalGaps: finalGaps,
    scenarioTitle: `AI Career Path (${pathLabelMap[aiCareerPath.pathType] || aiCareerPath.pathType})`,
    totalDurationMonths: 24,
    phases,
    activities,
    aiEnriched: true,
    aiFitScore: aiCareerPath.aiFitScore,
    aiPathType: pathLabelMap[aiCareerPath.pathType] || aiCareerPath.pathType,
  };
}
