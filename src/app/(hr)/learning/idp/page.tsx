import { BookOpenCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import {
  getEmployeeFilterOptions,
  listEmployeeMaster,
  listLearningRecommendations,
} from "@/lib/services/hr-modules.service";
import {
  listLearningMonitoring,
  type LearningActivityType,
  type LearningMonitoringStatus,
} from "@/lib/services/learning-monitoring.service";
import { requireWorkspaceAccess } from "@/lib/session";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import {
  listLatestSkillGapIdpDefaults,
  type SkillGapIdpDefault,
} from "@/lib/services/talent-ai.service";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { listAllSuccessorsDirectory } from "@/lib/services/succession.service";
import {
  buildCareerPathRotationPlan,
  type CareerPathSimulationData,
  type EmployeeProfileForCareerPath,
} from "@/lib/services/career-path-idp.service";
import {
  IdpDirectory,
  type IdpEmployeeSection,
  type IdpActivityWithAlignment,
} from "@/components/learning/idp-directory";
import type { EditableLearningActivity } from "@/components/admin/learning-monitoring-editor";

export const metadata = { title: "Learning IDP & Succession Monitoring - Harmoni" };

export default async function LearningIdpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [filters, session] = await Promise.all([
    searchParams,
    requireWorkspaceAccess(WORKSPACE.LEARNING),
  ]);

  if (!isRoutePermitted("/learning/idp", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const searchQ = (filters.q || "").toLowerCase().trim();

  // 1. Ambil data kandidat regular & suksesi
  const [rows, options, allEmployeesMaster] = await Promise.all([
    listLearningRecommendations(filters),
    getEmployeeFilterOptions(),
    listEmployeeMaster(),
  ]);

  const successionDirectory = listAllSuccessorsDirectory();
  const successionMap = new Map(
    successionDirectory.map((s) => [s.name.toLowerCase(), s])
  );

  // Kumpulkan list profileId untuk mengambil saved monitoring dan AI defaults
  const allProfileIds = Array.from(
    new Set([
      ...rows.map((row) => row.profileId),
      ...allEmployeesMaster.map((emp) => emp.profileId),
      ...successionDirectory.map((succ) => {
        const emp = allEmployeesMaster.find(
          (e) => e.name.toLowerCase() === succ.name.toLowerCase()
        );
        return emp?.profileId || succ.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      }),
    ])
  );

  const [savedMonitoring, canEdit, aiDefaults] = await Promise.all([
    listLearningMonitoring(allProfileIds),
    canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.LEARNING, "EDITOR"),
    listLatestSkillGapIdpDefaults(allProfileIds),
  ]);

  const monitoringByEmployeeAndKey = new Map(
    savedMonitoring.map((item) => [
      `${item.employeePersonnelNumber}:${item.activityKey}`,
      item,
    ])
  );

  // 2. Bangun employee sections untuk SEMUA karyawan di depan
  const seenNames = new Set<string>();
  const employeeSections: IdpEmployeeSection[] = [];

  // A. Karyawan dari rows rekomendasi pembelajaran
  for (const row of rows) {
    seenNames.add(row.employeeName.toLowerCase());
    const ai = aiDefaults.get(row.profileId);
    const succ = successionMap.get(row.employeeName.toLowerCase());
    const isCandidate = Boolean(succ && succ.assignments.length > 0);

    // Aktivitas IDP Based on Current Gap
    const defaultCurrentGapActivities = buildIdpActivities(row, ai);
    const currentGapKeys = new Set(defaultCurrentGapActivities.map((a) => a.activityKey));
    const currentGapActivities: IdpActivityWithAlignment[] = defaultCurrentGapActivities.map((activity) => {
      const saved = monitoringByEmployeeAndKey.get(`${row.profileId}:${activity.activityKey}`);
      const act = saved ? savedActivity(activity, saved) : activity;
      return {
        ...act,
        alignment: compute3WayAlignment(act, saved),
      };
    });

    const customActivities = savedMonitoring
      .filter(
        (saved) =>
          saved.employeePersonnelNumber === row.profileId &&
          !currentGapKeys.has(saved.activityKey) &&
          !saved.activityKey.startsWith("SUCCESSION_")
      )
      .map((saved) => {
        const act = savedActivityFromScratch(row.employeeName, saved);
        return {
          ...act,
          alignment: compute3WayAlignment(act, saved),
        };
      });

    const aiGaps = ai?.prioritySkillGaps.map((gap) => gap.skillName).filter(Boolean) ?? [];
    const currentGapText = aiGaps.length
      ? aiGaps.join(", ")
      : row.promotionGap !== "Ready for promotion validation"
      ? row.promotionGap
      : row.currentPositionGap;

    // Aktivitas IDP Based on Succession Plan (Jika kandidat)
    let candidateTarget: IdpEmployeeSection["candidateTarget"] = undefined;
    if (isCandidate && succ) {
      const primaryAssignment = succ.assignments[0];
      const defaultSuccActivities = buildSuccessionIdpActivities(
        row.profileId,
        row.employeeName,
        primaryAssignment.targetPositionTitle,
        primaryAssignment.targetIncumbentName,
        primaryAssignment.readiness,
        ai
      );
      const succActivities: IdpActivityWithAlignment[] = defaultSuccActivities.map((activity) => {
        const saved = monitoringByEmployeeAndKey.get(`${row.profileId}:${activity.activityKey}`);
        const act = saved ? savedActivity(activity, saved) : activity;
        return {
          ...act,
          alignment: compute3WayAlignment(act, saved),
        };
      });

      const succGap =
        primaryAssignment.notes ||
        `Penguatan kepemimpinan strategis, mitigasi risiko critical pit/plant, dan tata kelola operasional untuk suksesi ${primaryAssignment.targetIncumbentName}`;

      candidateTarget = {
        targetPositionTitle: `${primaryAssignment.targetPositionTitle} (Suksesor ${primaryAssignment.targetIncumbentName})`,
        targetIncumbentName: primaryAssignment.targetIncumbentName,
        readiness: primaryAssignment.readiness,
        source: primaryAssignment.source,
        gap: succGap,
        priority: primaryAssignment.readiness === "READY_NOW" ? "Ready Now (Critical)" : "Ready Later",
        activities: succActivities,
      };
    }

    const emp = allEmployeesMaster.find(
      (e) =>
        e.profileId === row.profileId ||
        e.name.toLowerCase() === row.employeeName.toLowerCase()
    );
    const empProfile: EmployeeProfileForCareerPath = {
      profileId: row.profileId,
      name: row.employeeName,
      currentPosition: row.currentPosition,
      department: row.department,
      division: row.division,
      directorate: row.directorate,
      currentPositionDuration: emp?.currentPositionDuration,
      lastPromotionDate: emp?.lastPromotionDate,
      joinDate: emp?.joinDate,
      careerHistory: emp?.careerHistory,
      aspiration: emp?.aspiration,
      isCandidate,
    };
    const careerPathTarget = buildCareerPathActivities(
      empProfile,
      monitoringByEmployeeAndKey,
      candidateTarget?.targetPositionTitle
    );

    employeeSections.push({
      id: row.profileId,
      profileId: row.profileId,
      employeeName: row.employeeName,
      currentPosition: row.currentPosition,
      department: row.department,
      division: row.division,
      directorate: row.directorate,
      isCandidate,
      candidateTarget,
      careerPathTarget,
      currentGapTarget: {
        targetPositionTitle: ai?.targetPosition || row.targetPosition,
        gap: currentGapText,
        priority: aiPriority(ai) ?? row.priority,
        hasAiDefault: Boolean(ai),
        activities: [...currentGapActivities, ...customActivities],
      },
    });
  }

  // B. Tambahkan kandidat dari successionDirectory yang belum ada di rows
  for (const succ of successionDirectory) {
    if (seenNames.has(succ.name.toLowerCase())) continue;

    // Cek filter pencarian & organisasi
    const matchQ =
      !searchQ ||
      succ.name.toLowerCase().includes(searchQ) ||
      (succ.currentPosition && succ.currentPosition.toLowerCase().includes(searchQ)) ||
      (succ.department && succ.department.toLowerCase().includes(searchQ)) ||
      succ.assignments.some(
        (a) =>
          a.targetIncumbentName.toLowerCase().includes(searchQ) ||
          a.targetPositionTitle.toLowerCase().includes(searchQ)
      );

    const matchDept =
      !filters.department ||
      (succ.department && succ.department.toLowerCase() === filters.department.toLowerCase());
    const matchEmp =
      !filters.employee || succ.name.toLowerCase() === filters.employee.toLowerCase();

    if (!matchQ || !matchDept || !matchEmp) continue;

    seenNames.add(succ.name.toLowerCase());
    const emp = allEmployeesMaster.find(
      (e) => e.name.toLowerCase() === succ.name.toLowerCase()
    );
    const profileId =
      emp?.profileId || succ.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const ai = aiDefaults.get(profileId);
    const primaryAssignment = succ.assignments[0];

    const currentPosition = emp?.currentPosition || succ.currentPosition || "Operational Lead";
    const department = emp?.department || succ.department || "Operations & Mining";
    const division =
      emp?.division || primaryAssignment?.targetDivision || "Mining & Technical Services";
    const directorate =
      emp?.directorate || primaryAssignment?.targetDirectorate || "OPERATION & HSE DIRECTORATE";

    // 1. Succession Activities
    const defaultSuccActivities = buildSuccessionIdpActivities(
      profileId,
      succ.name,
      primaryAssignment.targetPositionTitle,
      primaryAssignment.targetIncumbentName,
      primaryAssignment.readiness,
      ai
    );
    const succActivities: IdpActivityWithAlignment[] = defaultSuccActivities.map((activity) => {
      const saved = monitoringByEmployeeAndKey.get(`${profileId}:${activity.activityKey}`);
      const act = saved ? savedActivity(activity, saved) : activity;
      return {
        ...act,
        alignment: compute3WayAlignment(act, saved),
      };
    });

    const succGap =
      primaryAssignment.notes ||
      `Penguatan kepemimpinan strategis, mitigasi risiko critical pit/plant, dan tata kelola operasional untuk suksesi ${primaryAssignment.targetIncumbentName}`;

    // 2. Current Gap Activities
    const fallbackCurrentGapRow = {
      profileId,
      employeeName: succ.name,
      currentPosition,
      targetPosition: primaryAssignment.targetPositionTitle,
      directorate,
      division,
      department,
      currentPositionGap: "Kepemimpinan operasional dan mitigasi risiko",
      promotionGap: "Kesiapan manajerial operasional pertambangan",
      recommendationType: "Project Assignment",
      recommendationName: "Operational Leadership Project",
      projectOjtPlan: "70% Project/OJT: Operational Excellence Project",
      coachingPlan: "20% Coaching/Mentoring: Supervisory Coaching",
      certificationPlan: "10% Certification/Formal: POP / POM SMKP Minerba",
      successMetric: "Pencapaian KPI operasional & kepatuhan SMKP",
      timeline: "6 bulan",
      priority: primaryAssignment.readiness === "READY_NOW" ? "High" : "Medium",
      projectStatus: "In Progress",
      coachingStatus: "In Progress",
      certificationStatus: "Not Started",
      status: "In Progress",
    };

    const defaultCurrentGapActivities = buildIdpActivities(fallbackCurrentGapRow, ai);
    const currentGapActivities: IdpActivityWithAlignment[] = defaultCurrentGapActivities.map((activity) => {
      const saved = monitoringByEmployeeAndKey.get(`${profileId}:${activity.activityKey}`);
      const act = saved ? savedActivity(activity, saved) : activity;
      return {
        ...act,
        alignment: compute3WayAlignment(act, saved),
      };
    });

    const targetPositionTitle = `${primaryAssignment.targetPositionTitle} (Suksesor ${primaryAssignment.targetIncumbentName})`;
    const candidateTarget = {
      targetPositionTitle,
      targetIncumbentName: primaryAssignment.targetIncumbentName,
      readiness: primaryAssignment.readiness,
      source: primaryAssignment.source,
      gap: succGap,
      priority: primaryAssignment.readiness === "READY_NOW" ? "Ready Now (Critical)" : "Ready Later",
      activities: succActivities,
    };

    const empProfile: EmployeeProfileForCareerPath = {
      profileId,
      name: succ.name,
      currentPosition,
      department,
      division,
      directorate,
      currentPositionDuration: emp?.currentPositionDuration,
      lastPromotionDate: emp?.lastPromotionDate,
      joinDate: emp?.joinDate,
      careerHistory: emp?.careerHistory,
      aspiration: emp?.aspiration,
      isCandidate: true,
    };
    const careerPathTarget = buildCareerPathActivities(
      empProfile,
      monitoringByEmployeeAndKey,
      candidateTarget.targetPositionTitle
    );

    employeeSections.push({
      id: profileId,
      profileId,
      employeeName: succ.name,
      currentPosition,
      department,
      division,
      directorate,
      isCandidate: true,
      candidateTarget,
      careerPathTarget,
      currentGapTarget: {
        targetPositionTitle: primaryAssignment.targetPositionTitle,
        gap: "Penguatan kompetensi kepemimpinan dan teknis operasional",
        priority: primaryAssignment.readiness === "READY_NOW" ? "High" : "Medium",
        hasAiDefault: Boolean(ai),
        activities: currentGapActivities,
      },
    });
  }

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Learning & Succession"
        title="IDP Progress & Alignment Monitoring"
        description="Monitoring keselarasan rekomendasi AI IDP, review keselarasan atasan (Lead), dan status registrasi pelatihan mandiri karyawan."
        icon={BookOpenCheck}
      />

      {/* FILTER PENCARIAN & ORGANISASI */}
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedEmployee={filters.employee}
        qPlaceholder="Cari karyawan, jabatan, departemen, atau suksesi..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
      />

      {/* IDP DIRECTORY CLIENT COMPONENT */}
      <IdpDirectory
        employeeSections={employeeSections}
        canEdit={canEdit}
        initialSelectedDetail={
          filters.detail ||
          filters.selected ||
          filters.employee ||
          (employeeSections.length === 1 && filters.q ? filters.q : undefined)
        }
      />
    </div>
  );
}

// =============================================================================
// HELPER LOGIKA & DATA BUILDER
// =============================================================================

function buildCareerPathActivities(
  empProfile: EmployeeProfileForCareerPath,
  monitoringByEmployeeAndKey: Map<string, SavedMonitoring>,
  targetOverride?: string
): CareerPathSimulationData & { activities: IdpActivityWithAlignment[] } {
  const simulation = buildCareerPathRotationPlan(empProfile, targetOverride);
  const activities: IdpActivityWithAlignment[] = simulation.activities.map((activity) => {
    const saved = monitoringByEmployeeAndKey.get(`${empProfile.profileId}:${activity.activityKey}`);
    const act = saved ? savedActivity(activity, saved) : activity;
    return {
      ...act,
      alignment: compute3WayAlignment(act, saved),
    };
  });

  return {
    ...simulation,
    activities,
  };
}

function compute3WayAlignment(
  activity: EditableLearningActivity,
  saved?: SavedMonitoring
) {
  // 1. Baseline AI
  const aiBaseline = {
    label: "Rekomendasi AI",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
  };

  // 2. Review Lead (Atasan)
  const isModifiedByLead = Boolean(
    saved &&
      (saved.version > 0 ||
        (saved.notes && saved.notes.trim().length > 0) ||
        saved.programName !== activity.programName ||
        saved.skillImprovement !== activity.skillImprovement)
  );

  const leadReview = isModifiedByLead
    ? {
        status: "MODIFIED",
        label: "✏️ Disesuaikan Lead",
        badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
      }
    : {
        status: "APPROVED",
        label: "✨ Sesuai AI Baseline",
        badgeClass: "bg-purple-50 text-purple-900 border-purple-200 font-medium",
      };

  // 3. Status Registrasi Mandiri Karyawan
  const normalizedStatus = activity.status;
  const employeeTraining =
    normalizedStatus === "COMPLETED"
      ? {
          status: "COMPLETED",
          label: "✅ Selesai Divalidasi",
          badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
        }
      : normalizedStatus === "IN_PROGRESS"
      ? {
          status: "IN_PROGRESS",
          label: "🟢 Terdaftar (In-Sync)",
          badgeClass: "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
        }
      : normalizedStatus === "ON_HOLD" || normalizedStatus === "CANCELLED"
      ? {
          status: "ON_HOLD",
          label: "⏸️ Ditangguhkan",
          badgeClass: "bg-rose-50 text-rose-800 border-rose-200 font-medium",
        }
      : {
          status: "PENDING",
          label: "⏳ Belum Terdaftar",
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
        };

  return {
    aiBaseline,
    leadReview,
    employeeTraining,
  };
}

function buildSuccessionIdpActivities(
  employeePersonnelNumber: string,
  employeeName: string,
  targetPosition: string,
  targetIncumbent: string,
  readiness: string,
  ai?: SkillGapIdpDefault
): EditableLearningActivity[] {
  const experienceRecommendation = findAiRecommendation(ai, ["PROJECT_ASSIGNMENT"]);
  const socialRecommendation = findAiRecommendation(ai, ["COACHING", "MENTORING"]);
  const formalRecommendation = findAiRecommendation(ai, ["TRAINING", "CERTIFICATION"]);

  return [
    {
      employeePersonnelNumber,
      employeeName,
      activityKey: "SUCCESSION_EXP_70",
      activityType: "EXPERIENCE_70" as LearningActivityType,
      targetPosition,
      learningType: "70% Experience Learning",
      skillImprovement:
        experienceRecommendation?.relatedSkill || "Strategic Leadership & Operational Governance",
      programName: aiPlanText(
        ai?.idpPlan.seventy,
        experienceRecommendation,
        `Executive Shadowing & Acting Stint: Memimpin delegasi operasional strategis, mitigasi risiko critical pit/plant, dan cross-functional decision-making di bawah supervisi ${targetIncumbent}`
      ),
      provider: "Internal - Directorate Operations & HSE",
      timeline: experienceRecommendation?.suggestedDuration || "6 bulan",
      status: "IN_PROGRESS",
      successCriteria:
        experienceRecommendation?.expectedEvidence ||
        `Mampu memimpin minimal 1 project perbaikan strategis dan bertindak sebagai acting jabatan ${targetPosition} dengan evaluasi kesiapan memuaskan.`,
      notes: `Target suksesi untuk incumbent: ${targetIncumbent} (Kesiapan: ${
        readiness === "READY_NOW" ? "Ready Now" : "Ready Later"
      }).`,
      version: 0,
    },
    {
      employeePersonnelNumber,
      employeeName,
      activityKey: "SUCCESSION_SOC_20",
      activityType: "SOCIAL_20" as LearningActivityType,
      targetPosition,
      learningType: "20% Social Learning",
      skillImprovement:
        socialRecommendation?.relatedSkill || "Executive Mentoring & Stakeholder Influence",
      programName: aiPlanText(
        ai?.idpPlan.twenty,
        socialRecommendation,
        `Executive 1-on-1 Mentoring bersama ${targetIncumbent} & Cross-Directorate Leadership Coaching`
      ),
      provider: "Board of Management & Internal Berau Coal",
      timeline: socialRecommendation?.suggestedDuration || "6 bulan",
      status: "IN_PROGRESS",
      successCriteria:
        socialRecommendation?.expectedEvidence ||
        `Terlaksana minimal 6 sesi transfer kapabilitas kepemimpinan dan penelaahan studi kasus operasional bersama ${targetIncumbent}.`,
      notes: "Sesi pendampingan intensif succession transfer.",
      version: 0,
    },
    {
      employeePersonnelNumber,
      employeeName,
      activityKey: "SUCCESSION_FOR_10",
      activityType: "FORMAL_10" as LearningActivityType,
      targetPosition,
      learningType: "10% Formal Learning",
      skillImprovement:
        formalRecommendation?.relatedSkill || "Executive Competency Development (ECDP)",
      programName: aiPlanText(
        ai?.idpPlan.ten,
        formalRecommendation,
        "Executive Competency Development Program (ECDP/MMDP) & Sertifikasi Manajemen Operasi Pertambangan Berkelanjutan"
      ),
      provider: "PPM Manajemen & Berau Coal Corporate University",
      timeline: formalRecommendation?.suggestedDuration || "90 hari",
      status: "NOT_STARTED",
      successCriteria:
        formalRecommendation?.expectedEvidence ||
        "Kelulusan sertifikasi eksekutif dan presentasi capstone strategic roadmap di hadapan Komite Suksesi.",
      notes: "Sertifikasi prasyarat menduduki posisi kunci struktural.",
      version: 0,
    },
  ];
}

function buildIdpActivities(
  row: Awaited<ReturnType<typeof listLearningRecommendations>>[number],
  ai?: SkillGapIdpDefault
): EditableLearningActivity[] {
  const gap =
    row.promotionGap !== "Ready for promotion validation"
      ? row.promotionGap
      : row.currentPositionGap;
  const aiGap = ai?.prioritySkillGaps[0]?.skillName;
  const skillImprovement = aiGap || getPrimarySkillImprovement(gap, row.recommendationName);
  const formalSkill = aiGap || getFormalSkillImprovement(gap, row.certificationPlan);
  const providerBase = getProviderBase(row.department, row.directorate);
  const targetPosition = ai?.targetPosition || row.targetPosition;
  const experienceRecommendation = findAiRecommendation(ai, ["PROJECT_ASSIGNMENT"]);
  const socialRecommendation = findAiRecommendation(ai, ["COACHING", "MENTORING"]);
  const formalRecommendation = findAiRecommendation(ai, ["TRAINING", "CERTIFICATION"]);

  return [
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "EXPERIENCE_70",
      activityType: "EXPERIENCE_70" as LearningActivityType,
      targetPosition,
      learningType: "70% Experience Learning",
      skillImprovement: experienceRecommendation?.relatedSkill || skillImprovement,
      programName: aiPlanText(
        ai?.idpPlan.seventy,
        experienceRecommendation,
        stripLearningPrefix(row.projectOjtPlan)
      ),
      provider: `Internal - ${providerBase}`,
      timeline: experienceRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.projectStatus),
      successCriteria: experienceRecommendation?.expectedEvidence || row.successMetric,
      notes: "",
      version: 0,
    },
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "SOCIAL_20",
      activityType: "SOCIAL_20" as LearningActivityType,
      targetPosition,
      learningType: "20% Social Learning",
      skillImprovement:
        socialRecommendation?.relatedSkill ||
        (/leadership|stakeholder|influence/i.test(gap)
          ? "Leadership Development"
          : skillImprovement),
      programName: aiPlanText(
        ai?.idpPlan.twenty,
        socialRecommendation,
        stripLearningPrefix(row.coachingPlan)
      ),
      provider: "Internal Berau Coal",
      timeline: socialRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.coachingStatus),
      successCriteria:
        socialRecommendation?.expectedEvidence ||
        `Mentee shows measurable improvement on ${skillImprovement.toLowerCase()} during coaching review.`,
      notes: "",
      version: 0,
    },
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "FORMAL_10",
      activityType: "FORMAL_10" as LearningActivityType,
      targetPosition,
      learningType: "10% Formal Learning",
      skillImprovement: formalRecommendation?.relatedSkill || formalSkill,
      programName: aiPlanText(
        ai?.idpPlan.ten,
        formalRecommendation,
        stripLearningPrefix(row.certificationPlan)
      ),
      provider: getFormalProvider(formalSkill),
      timeline: formalRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.certificationStatus),
      successCriteria: formalRecommendation?.expectedEvidence || row.successMetric,
      notes: "",
      version: 0,
    },
  ];
}

function findAiRecommendation(
  ai: SkillGapIdpDefault | undefined,
  types: SkillGapIdpDefault["developmentRecommendations"][number]["type"][]
) {
  return ai?.developmentRecommendations.find((item) => types.includes(item.type));
}

function aiPlanText(
  plan: string[] | undefined,
  recommendation: SkillGapIdpDefault["developmentRecommendations"][number] | undefined,
  fallback: string
) {
  if (plan?.length) return plan.join("\n");
  if (recommendation) return `${recommendation.title}: ${recommendation.description}`;
  return fallback;
}

type SavedMonitoring = Awaited<ReturnType<typeof listLearningMonitoring>>[number];

function savedActivity(
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

function savedActivityFromScratch(
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

function learningTypeLabel(type: LearningActivityType) {
  if (type === "EXPERIENCE_70") return "70% Experience Learning";
  if (type === "SOCIAL_20") return "20% Social Learning";
  return "10% Formal Learning";
}

function aiPriority(ai?: SkillGapIdpDefault) {
  if (!ai?.developmentRecommendations.length) return null;
  if (ai.developmentRecommendations.some((item) => item.priority === "HIGH")) return "High";
  if (ai.developmentRecommendations.some((item) => item.priority === "MEDIUM"))
    return "Medium";
  return "Low";
}

function normalizeLearningStatus(value: string): LearningMonitoringStatus {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (
    normalized === "IN_PROGRESS" ||
    normalized === "COMPLETED" ||
    normalized === "ON_HOLD" ||
    normalized === "CANCELLED"
  )
    return normalized;
  return "NOT_STARTED";
}

function stripLearningPrefix(value: string) {
  return value.replace(
    /^(70% Project\/OJT|20% Coaching\/Mentoring|10% Certification\/Formal):\s*/i,
    ""
  );
}

function getPrimarySkillImprovement(gap: string, fallback: string) {
  const firstGap = gap.split(",")[0]?.trim();
  if (firstGap && !/no critical gap|ready for promotion/i.test(firstGap)) return firstGap;
  return fallback.replace(
    /^(Coaching|Mentoring|Training|Certification|Project Assignment):\s*/i,
    ""
  );
}

function getFormalSkillImprovement(gap: string, plan: string) {
  if (/safety|hse|risk|k3|smkp/i.test(`${gap} ${plan}`))
    return "Occupational Health and Safety Management";
  if (/cost|budget|financial|finance/i.test(`${gap} ${plan}`))
    return "Financial and Cost Control";
  if (/data|analysis|analytics|dashboard/i.test(`${gap} ${plan}`)) return "Data Analytics";
  if (/leadership|stakeholder|influence/i.test(`${gap} ${plan}`))
    return "Leadership Development";
  if (/operation|operational|mine|pit|production|planning/i.test(`${gap} ${plan}`))
    return "Operational Excellence";
  return getPrimarySkillImprovement(gap, plan);
}

function getFormalProvider(skillImprovement: string) {
  if (/safety|health|k3|leadership|operational/i.test(skillImprovement))
    return "PPM Manajemen";
  if (/data|analytics/i.test(skillImprovement)) return "Internal Data Academy";
  return "Internal Berau Coal";
}

function getProviderBase(department: string, directorate: string) {
  if (/mining|mine|geology|survey/i.test(department)) return "Mine Operation Division";
  if (/plant|cpp|hauling/i.test(department)) return "Operations Division";
  return `${directorate} Directorate`;
}
