import { listEmployeeMaster, type EmployeeMaster } from "./hr-modules.service";
import {
  listOdCareerPathRecommendationsForPerson,
  type OdCompetencyGap,
  type OdCareerPathRow,
  type OdTalentFilters,
} from "./od-talent-matching.service";
import { syncCareerOptionsFromRealTables } from "./career-options-sync.service";
import { prisma } from "@/lib/prisma";

export async function listCareerPathRecommendationsForEmployee(
  employeeId: string,
  filters: OdTalentFilters = {},
  providedEmployee?: EmployeeMaster
) {
  const employee =
    providedEmployee?.profileId === employeeId
      ? providedEmployee
      : (await listEmployeeMaster(employeeId))[0];
  if (!employee) return { employee: null, rows: [] as OdCareerPathRow[], source: "NONE" as const };

  // 1. Query persisted real-DB Career Options from `career_options` table
  let persisted = await prisma.careerOption.findMany({
    where: { employeeNik: employee.employeeId, isActive: true },
    orderBy: [{ priorityRank: "asc" }, { matchScore: "desc" }],
  });

  // 2. If not computed yet for this employee, compute from real DB tables (bq_raw.p_emps + bq_raw.p_talent_profile) & persist
  if (!persisted.length) {
    await syncCareerOptionsFromRealTables(employee.employeeId);
    persisted = await prisma.careerOption.findMany({
      where: { employeeNik: employee.employeeId, isActive: true },
      orderBy: [{ priorityRank: "asc" }, { matchScore: "desc" }],
    });
  }

  if (persisted.length) {
    const rows = filterAndMapPersistedOptions(employee, persisted, filters);
    return { employee, rows, source: "CAREER_OPTIONS_DB" as const };
  }

  // 3. Secondary fallback: Excel-imported OD catalog matching (only sourceFile != null)
  const od = await listOdCareerPathRecommendationsForPerson(
    {
      employeeName: employee.name,
      currentPosition: employee.currentPosition,
      employeeCode: employee.employeeId,
    },
    filters
  );
  return {
    employee,
    rows: od.candidate && od.rows.length ? od.rows : [],
    source: od.candidate && od.rows.length ? ("OD" as const) : ("NONE" as const),
  };
}

function filterAndMapPersistedOptions(
  employee: EmployeeMaster,
  records: Awaited<ReturnType<typeof prisma.careerOption.findMany>>,
  filters: OdTalentFilters
): OdCareerPathRow[] {
  const q = clean(filters.q ?? filters.search).toLocaleLowerCase("id-ID");
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);

  return records
    .filter(
      (item) =>
        !q ||
        [
          item.targetPosition,
          item.targetDirectorate,
          item.targetDivision,
          item.targetDepartment,
          item.pathStage,
          item.pathRationale,
        ].some((val) => clean(val).toLocaleLowerCase("id-ID").includes(q))
    )
    .filter((item) => !filters.target || item.targetPositionId === filters.target || normalize(item.targetPosition) === normalize(filters.target))
    .filter((item) => !filters.level || clean(item.targetLayer) === filters.level)
    .filter((item) => !filters.directorateId || normalize(item.targetDirectorate ?? "") === normalize(filters.directorateId!))
    .filter((item) => !filters.divisionId || normalize(item.targetDivision ?? "") === normalize(filters.divisionId!))
    .filter((item) => !filters.departmentId || normalize(item.targetDepartment ?? "") === normalize(filters.departmentId!))
    .slice(0, limit)
    .map((item) => ({
      candidateId: employee.profileId,
      employeeCode: item.employeeNik,
      employeeName: item.employeeName,
      currentPosition: item.currentPosition,
      currentPositionGroup: item.currentLayer ?? item.currentPsLevel ?? employee.currentLevel,
      currentDivision: item.currentDivision ?? employee.division,
      currentDepartment: item.currentDepartment ?? employee.department,
      sourceFile: item.sourceSystem,
      targetPositionId: item.targetPositionId,
      targetPosition: item.targetPosition,
      targetPositionGroup: item.targetLayer ?? item.targetPsLevel,
      targetDirectorateId: null,
      targetDirectorate: item.targetDirectorate ?? "-",
      targetDivisionId: null,
      targetDivision: item.targetDivision ?? "-",
      targetDepartmentId: null,
      targetDepartment: item.targetDepartment ?? "-",
      matchScore: item.matchScore,
      readinessLabel: item.estimatedReadiness,
      matchedCompetencies: toStringArray(item.matchedCompetencies),
      partialCompetencies: [],
      priorityGaps: toStringArray(item.priorityGaps),
      competencyGaps: toGapArray(item.competencyGaps),
      developmentNeed: item.developmentNeed,
      recommendationNote: item.recommendationNote,
      pathStage: item.pathStage,
      transitionType: item.transitionType,
      estimatedReadiness: item.estimatedReadiness,
      pathRationale: item.pathRationale,
    }));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => clean(String(item ?? ""))).filter(Boolean) : [];
}

function toGapArray(value: unknown): OdCompetencyGap[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const obj = (item ?? {}) as Record<string, unknown>;
    return {
      competencyId: String(obj.competencyId ?? ""),
      competencyName: String(obj.competencyName ?? ""),
      competencyCategory: String(obj.competencyCategory ?? "Technical"),
      requiredLevel: Number(obj.requiredLevel ?? 0),
      currentLevel: Number(obj.currentLevel ?? 0),
      gap: Number(obj.gap ?? 0),
    };
  });
}

function normalize(value: string) {
  return clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}
