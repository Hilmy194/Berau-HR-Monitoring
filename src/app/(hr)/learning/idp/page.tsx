import { BookOpenCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ROLE, isAdmin } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  getEmployeeFilterOptions,
  listEmployeeMaster,
  resolveEmployeeForSession,
} from "@/lib/services/hr-modules.service";
import {
  listLearningMonitoring,
} from "@/lib/services/learning-monitoring.service";
import { requireAuth } from "@/lib/session";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import {
  listEmployeesWithGeneratedIdpAi,
  listLatestCareerPathIdpDefaults,
  listLatestSkillGapIdpDefaults,
  listLatestSuccessionIdpDefaults,
} from "@/lib/services/talent-ai.service";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import {
  listAllSuccessorsDirectory,
  getSuccessionPipelineFromDb,
} from "@/lib/services/succession.service";
import {
  listEmployeeTrainingRequests,
} from "@/lib/services/training-catalog.service";
import {
  aiPriority,
  buildAiCurrentGapActivities,
  buildCandidateSuccessionTargets,
  buildCareerPathActivitiesForEmployee,
  buildDeduplicatedActivities,
} from "@/lib/services/idp-builder.service";
import {
  IdpDirectory,
  type IdpEmployeeSection,
} from "@/components/learning/idp-directory";

export const metadata = { title: "Learning IDP & Succession Monitoring - Harmoni" };

export default async function LearningIdpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = await searchParams;
  const session = await requireAuth();

  const isLeaderParam = filters.role === "leader";
  const isLeaderRole = session.user.role === ROLE.MANAGER;
  const isLeaderMode = isLeaderRole || isLeaderParam;

  // Hanya lakukan redirect permission jika bukan mode Leader dan bukan Admin
  if (!isLeaderMode) {
    if (session.user.role !== ROLE.SUPER_ADMIN && session.user.role !== ROLE.HR_ADMIN) {
      if (!isRoutePermitted("/learning/idp", session.user.role, session.user.allowedRoutes)) {
        redirect("/choose-role");
      }
    }
  }

  const searchQ = (filters.q || "").toLowerCase().trim();

  // 1. Ambil seluruh sumber eligibility IDP: AI Generated, Succession Pipeline, LearningMonitoring, & Training Requests
  const [
    options,
    allEmployeesMaster,
    allTrainingRequests,
    dbSuccessionPipeline,
    aiEligibility,
    existingMonitoringEmployees,
  ] = await Promise.all([
    getEmployeeFilterOptions(),
    listEmployeeMaster(),
    listEmployeeTrainingRequests(),
    getSuccessionPipelineFromDb(),
    listEmployeesWithGeneratedIdpAi(),
    prisma.learningMonitoring.findMany({
      select: { employeePersonnelNumber: true },
      distinct: ["employeePersonnelNumber"],
    }),
  ]);

  const savedMonitoringEmployeeIds = new Set(
    existingMonitoringEmployees.map((r) => r.employeePersonnelNumber.trim()).filter(Boolean)
  );
  const successionDirectory = listAllSuccessorsDirectory(dbSuccessionPipeline);

  // Identifikasi profil atasan aktif dari session user dan master SO
  const userEmail = (session.user.email || "").toLowerCase().trim();
  const userName = (session.user.name || "").toLowerCase().trim();

  const leaderInMaster = resolveEmployeeForSession(allEmployeesMaster, session.user, {
    allowFebriwiadiAlias: true,
  });

  const isFebriwiadi = userEmail.includes("febriwiadi") || userName.includes("febriwiadi");
  const activeLeaderName =
    leaderInMaster?.name || (isFebriwiadi ? "Febriwiadi Djali" : session.user.name || "Pengguna");
  const activeLeaderDivision =
    leaderInMaster?.division || (isFebriwiadi ? "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON" : "");
  const activeLeaderPosition =
    leaderInMaster?.currentPosition ||
    (isFebriwiadi
      ? "System Compliance & Environment GM"
      : isAdmin(session.user.role)
        ? "Super Administrator"
        : "Karyawan");

  // Cari bawahan langsung di Struktur Organisasi (SO)
  const leaderKey = (leaderInMaster?.name || (isFebriwiadi ? "Febriwiadi Djali" : ""))
    .toLowerCase()
    .trim();

  let directSubordinatesFromSO: typeof allEmployeesMaster = [];
  if (leaderKey) {
    directSubordinatesFromSO = allEmployeesMaster.filter((emp) => {
      const sup = (emp.supervisorName || "").toLowerCase().trim();
      return (
        sup &&
        (sup === leaderKey ||
          sup.includes(leaderKey) ||
          leaderKey.includes(sup) ||
          leaderKey.split(" ").some((part) => part.length >= 4 && sup.includes(part)))
      );
    });
  }

  const isLeaderWithSubordinates = directSubordinatesFromSO.length > 0;
  const canApprove = Boolean(isLeaderMode && isLeaderWithSubordinates);

  const subordinateIds = new Set(
    directSubordinatesFromSO.flatMap((e) => [e.profileId, e.employeeId].filter(Boolean))
  );
  const subordinateNames = new Set(
    directSubordinatesFromSO.map((e) => e.name.toLowerCase().trim())
  );

  const effectiveTrainingRequests = isLeaderMode
    ? isLeaderWithSubordinates
      ? allTrainingRequests.filter(
          (req) =>
            subordinateIds.has(req.employeePersonnelNumber) ||
            subordinateNames.has(req.employeeName.toLowerCase().trim())
        )
      : []
    : allTrainingRequests;

  const effectiveSuccession = isLeaderMode
    ? isLeaderWithSubordinates
      ? successionDirectory.filter((succ) =>
          subordinateNames.has(succ.name.toLowerCase().trim())
        )
      : []
    : successionDirectory;

  const successionMap = new Map(effectiveSuccession.map((s) => [s.name.toLowerCase(), s]));

  // 2. Bangun daftar karyawan eligible:
  //    - Masuk Succession, ATAU
  //    - Sudah pernah digenerate AI Current Gap (SKILL_GAP), ATAU
  //    - Sudah pernah digenerate AI Career Path (CAREER_PATH), ATAU
  //    - Sudah pernah digenerate AI Succession IDP (SUCCESSION_IDP), ATAU
  //    - Sudah punya data LearningMonitoring tersimpan
  const isEligibleByAiOrSuccession = (
    profileId: string,
    employeeId: string | undefined,
    name: string
  ) => {
    const keys = [profileId, employeeId].filter((v): v is string => Boolean(v));
    if (successionMap.has(name.toLowerCase())) return true;
    if (keys.some((k) => aiEligibility.skillGapIds.has(k))) return true;
    if (keys.some((k) => aiEligibility.careerPathIds.has(k))) return true;
    if (keys.some((k) => aiEligibility.successionIdpIds.has(k))) return true;
    if (keys.some((k) => savedMonitoringEmployeeIds.has(k))) return true;
    return false;
  };

  type EligibleBase = {
    profileId: string;
    employeeId: string;
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
  };

  const eligibleMap = new Map<string, EligibleBase>();

  const candidateEmployees = isLeaderMode
    ? isLeaderWithSubordinates
      ? directSubordinatesFromSO
      : []
    : allEmployeesMaster;

  for (const emp of candidateEmployees) {
    if (!isEligibleByAiOrSuccession(emp.profileId, emp.employeeId, emp.name)) continue;
    eligibleMap.set(emp.name.toLowerCase(), {
      profileId: emp.profileId,
      employeeId: emp.employeeId,
      name: emp.name,
      currentPosition: emp.currentPosition || "-",
      department: emp.department || "-",
      division: emp.division || "-",
      directorate: emp.directorate || "-",
      currentPositionDuration: emp.currentPositionDuration,
      lastPromotionDate: emp.lastPromotionDate,
      joinDate: emp.joinDate,
      careerHistory: emp.careerHistory,
      aspiration: emp.aspiration,
    });
  }

  for (const succ of effectiveSuccession) {
    const key = succ.name.toLowerCase();
    if (eligibleMap.has(key)) continue;
    const primary = succ.assignments[0];
    eligibleMap.set(key, {
      profileId: succ.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      employeeId: succ.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: succ.name,
      currentPosition: succ.currentPosition || "Operational Lead",
      department: succ.department || "Operations & Mining",
      division: primary?.targetDivision || "Operations",
      directorate: primary?.targetDirectorate || "OPERATION & HSE DIRECTORATE",
    });
  }

  // Terapkan filter organisasi & search
  const filteredEligible = Array.from(eligibleMap.values()).filter((emp) => {
    const succ = successionMap.get(emp.name.toLowerCase());
    if (filters.directorate && emp.directorate !== filters.directorate) return false;
    if (filters.division && emp.division !== filters.division) return false;
    if (filters.department && emp.department !== filters.department) return false;
    if (filters.employee && emp.name !== filters.employee) return false;
    if (searchQ) {
      const succHit = succ?.assignments.some(
        (a) =>
          a.targetIncumbentName.toLowerCase().includes(searchQ) ||
          a.targetPositionTitle.toLowerCase().includes(searchQ)
      );
      const matchText =
        emp.name.toLowerCase().includes(searchQ) ||
        emp.currentPosition.toLowerCase().includes(searchQ) ||
        emp.department.toLowerCase().includes(searchQ) ||
        Boolean(succHit);
      if (!matchText) return false;
    }
    return true;
  });

  const allProfileIds = Array.from(
    new Set(filteredEligible.flatMap((e) => [e.profileId, e.employeeId].filter(Boolean)))
  );

  const [savedMonitoring, canEdit, aiDefaults, careerPathAiDefaults, successionAiDefaults] =
    await Promise.all([
      listLearningMonitoring(allProfileIds),
      canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.LEARNING, "EDITOR"),
      listLatestSkillGapIdpDefaults(allProfileIds),
      listLatestCareerPathIdpDefaults(allProfileIds),
      listLatestSuccessionIdpDefaults(allProfileIds),
    ]);

  const monitoringByEmployeeAndKey = new Map(
    savedMonitoring.map((item) => [
      `${item.employeePersonnelNumber}:${item.activityKey}`,
      item,
    ])
  );

  const employeeSections: IdpEmployeeSection[] = filteredEligible.map((emp) => {
    const succ = successionMap.get(emp.name.toLowerCase());
    const isCandidate = Boolean(succ && succ.assignments.length > 0);
    const ai = aiDefaults.get(emp.profileId);
    const careerPathAi = careerPathAiDefaults.get(emp.profileId);

    const empRequests = allTrainingRequests.filter(
      (r) =>
        r.employeePersonnelNumber === emp.profileId ||
        r.employeePersonnelNumber === emp.employeeId ||
        r.employeeName.toLowerCase().trim() === emp.name.toLowerCase().trim()
    );

    const empSavedRows = savedMonitoring.filter(
      (saved) => saved.employeePersonnelNumber === emp.profileId
    );

    // A. Current Gap Target (Strictly AI SKILL_GAP + Leader LearningMonitoring overrides)
    const defaultCurrentGap = buildAiCurrentGapActivities(
      emp.profileId,
      emp.name,
      emp.department,
      ai
    );
    const currentGapKeys = new Set(defaultCurrentGap.map((a) => a.activityKey));
    const customCurrentGap = empSavedRows.filter(
      (saved) =>
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
      emp.profileId,
      emp.name,
      monitoringByEmployeeAndKey,
      empRequests
    );
    const aiGaps = ai?.prioritySkillGaps.map((g) => g.skillName).filter(Boolean) ?? [];
    const currentGapText = aiGaps.length
      ? aiGaps.join(", ")
      : "Belum digenerate oleh AI Current Gap. Silakan generate di menu Talent → Current Gap / Skill Needs.";

    // B. Succession Targets (Supports 1..N distinct incumbent targets per employee)
    const candidateTargets =
      isCandidate && succ
        ? buildCandidateSuccessionTargets({
            employeePersonnelNumber: emp.profileId,
            employeeName: emp.name,
            assignments: succ.assignments,
            successionAiDefaults,
            empSavedRows,
            monitoringByEmployeeAndKey,
            empRequests,
          })
        : [];
    const candidateTarget = candidateTargets[0];

    // C. Career Path Target (Strictly AI CAREER_PATH + Leader LearningMonitoring overrides)
    const careerPathTarget = buildCareerPathActivitiesForEmployee(
      {
        profileId: emp.profileId,
        name: emp.name,
        currentPosition: emp.currentPosition,
        department: emp.department,
        division: emp.division,
        directorate: emp.directorate,
        currentPositionDuration: emp.currentPositionDuration,
        lastPromotionDate: emp.lastPromotionDate,
        joinDate: emp.joinDate,
        careerHistory: emp.careerHistory,
        aspiration: emp.aspiration,
        isCandidate,
      },
      monitoringByEmployeeAndKey,
      empSavedRows,
      empRequests,
      candidateTarget?.targetPositionTitle,
      careerPathAi
    );

    return {
      id: emp.profileId,
      profileId: emp.profileId,
      employeeName: emp.name,
      currentPosition: emp.currentPosition,
      department: emp.department,
      division: emp.division,
      directorate: emp.directorate,
      isCandidate,
      candidateTarget,
      candidateTargets,
      careerPathTarget,
      currentGapTarget: {
        targetPositionTitle: ai?.targetPosition || "-",
        gap: currentGapText,
        priority: aiPriority(ai) ?? "-",
        hasAiDefault: Boolean(ai),
        activities: currentGapActivities,
      },
    };
  });

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Learning & Succession"
        title="IDP Progress & Alignment Monitoring"
        description="Pantau rekomendasi AI IDP (Succession otomatis saat masuk pipeline; Current Gap & Career Path setelah di-generate AI di menu Talent), review atasan, dan status pelatihan."
        icon={BookOpenCheck}
      />

      {/* LEADER PERSPECTIVE BANNER */}
      {isLeaderMode ? (
        isLeaderWithSubordinates ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px] tracking-wide shrink-0">
                LEADER POV (SO)
              </span>
              <div>
                <span className="font-bold text-emerald-900">
                  Mode Atasan Aktif: {activeLeaderName} &middot; {activeLeaderPosition} ({activeLeaderDivision})
                </span>
                <p className="text-[11px] text-emerald-700/90 mt-0.5">
                  Menampilkan {employeeSections.length} dari {directSubordinatesFromSO.length} bawahan langsung yang sudah memiliki IDP AI (Succession, Current Gap, atau Career Path).
                </p>
              </div>
            </div>
            {isAdmin(session.user.role) && (
              <Link
                href="/learning/idp"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 shrink-0 bg-white/60 hover:bg-white px-2.5 py-1 rounded border border-emerald-200 transition-colors"
              >
                Lihat Seluruh Karyawan (Mode HR Admin) &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center space-y-3.5 my-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Tidak Terdaftar sebagai Atasan Tim di SO
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Akun Anda (<strong>{session.user.name}</strong> &middot; {session.user.email}) tidak tercatat memiliki staf bawahan langsung pada data Struktur Organisasi (SO) Dakar.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {isAdmin(session.user.role) && (
                <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5">
                  <Link href="/learning/idp">
                    <span>Buka IDP Monitoring (Akses Penuh HR Admin)</span>
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="border-slate-300 bg-white text-xs font-semibold">
                <Link href="/choose-role">Kembali ke Pilih Peran</Link>
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <ShieldAlert className="h-4 w-4 shrink-0 text-slate-500" />
          <span>
            <strong className="font-semibold text-slate-800">Mode HR (monitoring saja).</strong> Menampilkan karyawan yang sudah masuk Succession atau sudah digenerate AI Current Gap / Career Path di menu Talent.
          </span>
        </div>
      )}

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
        canEdit={canApprove}
        canApprove={canApprove}
        trainingRequests={effectiveTrainingRequests}
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
