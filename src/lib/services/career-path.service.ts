import { listEmployeeMaster, listPositionSkills, type EmployeeMaster } from "./hr-modules.service";
import { listOdCareerPathRecommendationsForPerson, type OdCareerPathRow, type OdTalentFilters } from "./od-talent-matching.service";
import { prisma } from "@/lib/prisma";

type CareerCatalogPosition = {
  id: string | null;
  position: string;
  jobLevel: string;
  departmentId: string | null;
  department: string;
  divisionId: string | null;
  division: string;
  directorateId: string | null;
  directorate: string;
  requirements: Array<{ id: string; name: string; category: string; level: number }>;
};

export async function listCareerPathRecommendationsForEmployee(
  employeeId: string,
  filters: OdTalentFilters = {},
  providedEmployee?: EmployeeMaster,
) {
  const employee = providedEmployee?.profileId === employeeId
    ? providedEmployee
    : (await listEmployeeMaster(employeeId))[0];
  if (!employee) return { employee: null, rows: [] as OdCareerPathRow[], source: "NONE" as const };

  const od = await listOdCareerPathRecommendationsForPerson({
    employeeName: employee.name,
    currentPosition: employee.currentPosition,
    employeeCode: employee.employeeId,
  }, filters);
  if (od.candidate && od.rows.length) return { employee, rows: od.rows, source: "OD" as const };

  return { employee, rows: await buildBqCareerPath(employee, filters), source: "BQ_FALLBACK" as const };
}

async function buildBqCareerPath(employee: EmployeeMaster, filters: OdTalentFilters): Promise<OdCareerPathRow[]> {
  const currentRank = positionRank(`${employee.currentLevel} ${employee.currentPosition}`);
  const q = clean(filters.q).toLocaleLowerCase("id-ID");
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
  const evidence = unique([
    ...employee.currentSkills, ...employee.behavioralSkills, ...employee.strength,
    ...employee.projects, ...employee.certifications, ...employee.careerHistory,
  ]);
  const catalog = await loadCareerCatalog();

  return catalog
    .filter((position) => normalize(position.position) !== normalize(employee.currentPosition))
    .filter((position) => !q || [position.position, position.department, position.division, position.directorate, ...position.requirements.map((item) => item.name)]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(q)))
    .filter((position) => !filters.target || position.id === filters.target || normalize(position.position) === normalize(filters.target))
    .filter((position) => !filters.level || normalizedLevel(`${position.jobLevel} ${position.position}`) === filters.level)
    .filter((position) => !filters.directorateId || position.directorateId === filters.directorateId || normalize(position.directorate) === normalize(filters.directorateId!))
    .filter((position) => !filters.divisionId || position.divisionId === filters.divisionId)
    .filter((position) => !filters.departmentId || position.departmentId === filters.departmentId)
    .filter((position) => {
      const rank = positionRank(`${position.jobLevel} ${position.position}`);
      if (!rank) return false;
      return !currentRank || (rank >= currentRank && rank <= currentRank + 2);
    })
    .map((position) => {
      const targetRank = positionRank(`${position.jobLevel} ${position.position}`);
      const matchedRequirements = position.requirements.filter((required) => evidence.some((actual) => skillMatches(actual, required.name)));
      const matched = matchedRequirements.map((item) => item.name);
      const gaps = position.requirements.filter((required) => !matched.includes(required.name)).map((item) => item.name);
      const skillScore = position.requirements.length ? (matched.length / position.requirements.length) * 65 : 0;
      const orgScore = normalize(position.department) === normalize(employee.department) ? 15
        : normalize(position.division) === normalize(employee.division) ? 10
          : normalize(position.directorate) === normalize(employee.directorate) ? 6 : 0;
      const roleScore = tokenOverlap(employee.currentPosition, position.position) >= 0.4 ? 12 : 0;
      const aspirationScore = employee.aspiration !== "-" && normalize(employee.aspiration).includes(normalize(position.position)) ? 8 : 0;
      const evidenceScore = Math.min(5, employee.projects.length + employee.certifications.length);
      const matchScore = clamp(Math.round(skillScore + orgScore + roleScore + aspirationScore + evidenceScore));
      const pathStage = targetRank === currentRank ? "Lateral / enrichment" : targetRank === currentRank + 1 ? "Next role" : "Long-term path";
      return {
        candidateId: employee.profileId,
        employeeCode: employee.employeeId,
        employeeName: employee.name,
        currentPosition: employee.currentPosition,
        currentPositionGroup: employee.currentLevel,
        currentDivision: employee.division,
        currentDepartment: employee.department,
        sourceFile: "BIGQUERY_RAW",
        targetPositionId: position.id,
        targetPosition: position.position,
        targetPositionGroup: normalizedLevel(`${position.jobLevel} ${position.position}`),
        targetDirectorateId: position.directorateId,
        targetDirectorate: position.directorate,
        targetDivisionId: position.divisionId,
        targetDivision: position.division,
        targetDepartmentId: position.departmentId,
        targetDepartment: position.department,
        matchScore,
        readinessLabel: readiness(matchScore),
        matchedCompetencies: matched,
        partialCompetencies: [],
        priorityGaps: gaps.slice(0, 5),
        competencyGaps: position.requirements.map((requirement) => ({
          competencyId: requirement.id,
          competencyName: requirement.name,
          competencyCategory: requirement.category,
          requiredLevel: requirement.level,
          currentLevel: matched.includes(requirement.name) ? Math.max(1, requirement.level - 1) : 0,
          gap: matched.includes(requirement.name) ? 1 : requirement.level,
        })),
        developmentNeed: gaps.length ? `Prioritas pengembangan: ${gaps.slice(0, 3).join(", ")}.` : "Validasi evidence dan kesiapan melalui assessment/panel.",
        recommendationNote: "Shortlist deterministik dari profil BQ dan katalog posisi sementara; wajib divalidasi HR.",
        pathStage,
        transitionType: targetRank > currentRank ? "Vertical progression" : "Horizontal mobility",
        estimatedReadiness: readiness(matchScore),
        pathRationale: rationale(employee, position.position, matched, gaps),
      } satisfies OdCareerPathRow;
    })
    .sort((a, b) => pathPriority(a.pathStage) - pathPriority(b.pathStage) || b.matchScore - a.matchScore || a.targetPosition.localeCompare(b.targetPosition))
    .slice(0, limit);
}

async function loadCareerCatalog(): Promise<CareerCatalogPosition[]> {
  const positions = await prisma.organizationPosition.findMany({
    where: { isActive: true, competencyRequirements: { some: { isActive: true } } },
    include: {
      department: { include: { division: { include: { directorate: true } } } },
      competencyRequirements: {
        where: { isActive: true },
        include: { skill: { include: { category: true } } },
      },
    },
  });
  if (positions.length) {
    return positions.map((position) => ({
      id: position.id,
      position: position.positionName,
      jobLevel: position.jobLevel,
      departmentId: position.departmentId,
      department: position.department.name,
      divisionId: position.department.divisionId,
      division: position.department.division.name,
      directorateId: position.department.division.directorateId,
      directorate: position.department.division.directorate.name,
      requirements: position.competencyRequirements.map((item) => ({
        id: item.skillId,
        name: item.skill.skillName,
        category: item.skill.category.name,
        level: item.requiredLevel,
      })),
    }));
  }
  return listPositionSkills().map((position, index) => ({
    id: null,
    position: position.position,
    jobLevel: position.proficiencyLevel,
    departmentId: null,
    department: position.department,
    divisionId: null,
    division: position.division,
    directorateId: null,
    directorate: position.directorate,
    requirements: position.requiredSkills.map((name, skillIndex) => ({
      id: `static-${index}-${skillIndex}`,
      name,
      category: "Position skill",
      level: proficiencyLevel(position.proficiencyLevel),
    })),
  }));
}

function rationale(employee: EmployeeMaster, target: string, matched: string[], gaps: string[]) {
  const strength = matched.slice(0, 3).join(", ") || "belum ada kompetensi yang tervalidasi";
  const gap = gaps.slice(0, 3).join(", ") || "tidak ada gap utama pada katalog sementara";
  return `${target} dipertimbangkan dari posisi ${employee.currentPosition}, evidence kekuatan ${strength}, dan gap ${gap}.`;
}

function skillMatches(actual: string, required: string) {
  const left = normalize(actual);
  const right = normalize(required);
  return Boolean(left && right && (left.includes(right) || right.includes(left) || tokenOverlap(actual, required) >= 0.5));
}

function tokenOverlap(left: string, right: string) {
  const a = new Set(left.toLocaleLowerCase("id-ID").split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const b = new Set(right.toLocaleLowerCase("id-ID").split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  if (!a.size || !b.size) return 0;
  return [...a].filter((token) => b.has(token)).length / Math.min(a.size, b.size);
}

function positionRank(value: string) {
  const source = value.toLocaleLowerCase("id-ID");
  if (/\bgm\b|general manager|\bhead\b/.test(source)) return 6;
  if (/senior manager|sr\.? manager/.test(source)) return 5;
  if (/manager/.test(source)) return 4;
  if (/superintendent|senior specialist|sr\.? specialist/.test(source)) return 3;
  if (/supervisor|specialist|foreman|lead/.test(source)) return 2;
  if (/engineer|officer|analyst|geologist|surveyor|operator|staff/.test(source)) return 1;
  return 0;
}

function normalizedLevel(value: string) {
  const rank = positionRank(value);
  return rank >= 6 ? "GM" : rank >= 4 ? "Sr Manager / Manager" : rank === 3 ? "Superintendent / Sr Specialist" : rank === 2 ? "Supervisor / Specialist" : "Engineer / Officer";
}

function proficiencyLevel(value: string) {
  return value === "Expert" ? 5 : value === "Advanced" ? 4 : value === "Intermediate" ? 3 : 2;
}

function readiness(score: number) {
  return score >= 85 ? "Ready for validation" : score >= 70 ? "Ready with development" : score >= 55 ? "Build readiness" : "Long-term development";
}

function pathPriority(stage: string) {
  return stage === "Next role" ? 0 : stage === "Lateral / enrichment" ? 1 : 2;
}

function normalize(value: string) { return clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, ""); }
function clean(value: string | null | undefined) { return String(value ?? "").trim(); }
function unique(values: string[]) { return [...new Set(values.map(clean).filter((value) => value && value !== "-"))]; }
function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
