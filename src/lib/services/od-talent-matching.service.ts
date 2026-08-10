import { prisma } from "@/lib/prisma";
import { DIRECTORATES } from "@/lib/constants";

export type OdTalentFilters = {
  q?: string;
  search?: string;
  employee?: string;
  target?: string;
  directorateId?: string;
  divisionId?: string;
  departmentId?: string;
  competencyCategory?: string;
  level?: string;
  limit?: string;
};

export type OdCompetencyGap = {
  competencyId: string;
  competencyName: string;
  competencyCategory: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
};

export type OdTalentMatchRow = {
  candidateId: string;
  employeeCode: string | null;
  employeeName: string;
  currentPosition: string;
  currentPositionGroup: string | null;
  currentDivision: string;
  currentDepartment: string;
  sourceFile: string;
  targetPositionId: string | null;
  targetPosition: string;
  targetPositionGroup: string | null;
  targetDirectorateId: string | null;
  targetDirectorate: string;
  targetDivisionId: string | null;
  targetDivision: string;
  targetDepartmentId: string | null;
  targetDepartment: string;
  matchScore: number;
  readinessLabel: string;
  matchedCompetencies: string[];
  partialCompetencies: string[];
  priorityGaps: string[];
  competencyGaps: OdCompetencyGap[];
  developmentNeed: string;
  recommendationNote: string;
};

export type TalentPositionAiProfile = {
  id: string;
  positionName: string;
  jobLevel: string;
  directorate: string;
  division: string;
  department: string;
  positionSummary: string | null;
  jobDescription: string | null;
  rolesResponsibilities: string[];
  experienceRequirements: string[];
  competencyRequirements: Array<{
    competencyName: string;
    competencyCategory: string;
    requiredLevel: number;
    mandatory: boolean;
    weight: number;
    evidenceNotes: string | null;
  }>;
};

type PositionWithRequirements = Awaited<ReturnType<typeof loadPositionsWithRequirements>>[number];
type AssessmentWithSkill = Awaited<ReturnType<typeof loadAssessments>>[number];

export async function getOdTalentFilterOptions() {
  const [positions, employees, categories, directorates, divisions, departments] = await Promise.all([
    prisma.organizationPosition.findMany({
      where: { isActive: true, competencyRequirements: { some: { isActive: true } } },
      include: { department: { include: { division: { include: { directorate: true } } } } },
      orderBy: { positionName: "asc" },
    }),
    prisma.talentPersonSkillAssessment.findMany({
      distinct: ["employeeName"],
      select: { employeeName: true },
      orderBy: { employeeName: "asc" },
    }),
    prisma.talentSkillCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.organizationDirectorate.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.organizationDivision.findMany({
      where: { isActive: true },
      select: { id: true, name: true, directorateId: true },
      orderBy: { name: "asc" },
    }),
    prisma.organizationDepartment.findMany({
      where: { isActive: true },
      select: { id: true, name: true, divisionId: true, division: { select: { directorateId: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    employees: employees.map((item) => item.employeeName),
    directorates: DIRECTORATES.map((name) => ({ id: name, name })),
    divisions: divisions.map((division) => ({
      ...division,
      directorateId: normalizeDirectorateName(directorates.find((directorate) => directorate.id === division.directorateId)?.name ?? division.directorateId),
    })),
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      divisionId: department.divisionId,
      directorateId: normalizeDirectorateName(directorates.find((directorate) => directorate.id === department.division.directorateId)?.name ?? department.division.directorateId),
    })),
    competencyCategories: categories.map((item) => item.name),
    positionLevels: Array.from(new Set(positions.map((position) => normalizePositionLevel(position.positionName, position.jobLevel)))).sort(sortPositionLevels),
    targetPositions: positions.map((position) => ({
      id: position.id,
      name: position.positionName,
      level: normalizePositionLevel(position.positionName, position.jobLevel),
      directorateId: normalizeDirectorateName(position.department.division.directorate.name),
      directorate: normalizeDirectorateName(position.department.division.directorate.name),
      divisionId: position.department.divisionId,
      division: position.department.division.name,
      departmentId: position.departmentId,
      department: position.department.name,
      label: `${position.positionName} - ${position.department.division.name}`,
    })),
  };
}

export async function getTalentPositionAiProfile(target: string | undefined): Promise<TalentPositionAiProfile | null> {
  const position = await loadTargetPosition(target);
  if (!position) return null;
  const descriptionParts = splitPositionText(position.jobDescription);
  return {
    id: position.id,
    positionName: position.positionName,
    jobLevel: position.jobLevel,
    directorate: position.department.division.directorate.name,
    division: position.department.division.name,
    department: position.department.name,
    positionSummary: position.positionSummary,
    jobDescription: position.jobDescription,
    rolesResponsibilities: descriptionParts,
    experienceRequirements: position.competencyRequirements
      .map((item) => item.evidenceNotes)
      .filter((item): item is string => Boolean(item?.trim())),
    competencyRequirements: position.competencyRequirements.map((item) => ({
      competencyName: item.skill.skillName,
      competencyCategory: item.skill.category.name,
      requiredLevel: item.requiredLevel,
      mandatory: item.isMandatory,
      weight: Number(item.weight),
      evidenceNotes: item.evidenceNotes,
    })),
  };
}

export async function listOdMobilityRecommendations(target: string | undefined, filters: OdTalentFilters = {}) {
  const targetPosition = await loadTargetPosition(target);
  if (!targetPosition) return { targetPosition: null, rows: [] as OdTalentMatchRow[] };

  const assessments = await loadAssessments();
  const candidates = groupAssessments(assessments);
  const rows = candidates
    .map((candidate) => buildMatchRow(candidate, targetPosition))
    .filter((row) => matchesFilters(row, filters))
    .sort((a, b) => b.matchScore - a.matchScore || a.employeeName.localeCompare(b.employeeName))
    .slice(0, normalizedLimit(filters.limit, 30));

  return { targetPosition, rows };
}

export async function listOdSkillNeeds(filters: OdTalentFilters = {}) {
  const [positions, assessments] = await Promise.all([loadPositionsWithRequirements(), loadAssessments()]);
  const bySourceAndName = new Map(positions.map((position) => [`${position.sourceFile ?? ""}::${position.positionName}`, position]));
  const byName = new Map(positions.map((position) => [position.positionName, position]));
  const candidates = groupAssessments(assessments);

  return candidates
    .map((candidate) => {
      const targetPosition = bySourceAndName.get(`${candidate.sourceFile}::${candidate.currentPosition}`) ?? byName.get(candidate.currentPosition);
      return targetPosition ? buildMatchRow(candidate, targetPosition) : null;
    })
    .filter((row): row is OdTalentMatchRow => Boolean(row))
    .filter((row) => matchesFilters(row, filters))
    .sort((a, b) => b.priorityGaps.length - a.priorityGaps.length || a.employeeName.localeCompare(b.employeeName))
    .slice(0, normalizedLimit(filters.limit, 80));
}

export async function getOdEmployeeAnalysisContext(candidateId: string, target: string | undefined) {
  const decoded = decodeCandidateId(candidateId);
  if (!decoded) return null;
  const targetPosition = await loadTargetPosition(target);
  const assessments = await loadAssessments();
  const candidate = groupAssessments(assessments).find((item) =>
    item.employeeName === decoded.employeeName
    && item.currentPosition === decoded.positionName
    && item.sourceFile === decoded.sourceFile
  );
  if (!candidate || !targetPosition) return null;
  return buildMatchRow(candidate, targetPosition);
}

export async function getOdMobilityAnalysisContext(target: string | undefined, selectedCandidateIds?: string[]) {
  const { targetPosition, rows } = await listOdMobilityRecommendations(target, { limit: "10" });
  if (!targetPosition) return null;
  const selected = selectedCandidateIds?.length
    ? rows.filter((row) => selectedCandidateIds.includes(row.candidateId))
    : rows.slice(0, 5);
  return { targetPosition, rows: selected.length ? selected : rows.slice(0, 5) };
}

async function loadTargetPosition(target: string | undefined) {
  const positions = await loadPositionsWithRequirements();
  if (!positions.length) return null;
  if (target) {
    return positions.find((position) => position.id === target)
      ?? positions.find((position) => position.positionName === target)
      ?? positions.find((position) => normalize(position.positionName) === normalize(target))
      ?? null;
  }
  return positions[0];
}

function loadPositionsWithRequirements() {
  return prisma.organizationPosition.findMany({
    where: { isActive: true, competencyRequirements: { some: { isActive: true } } },
    include: {
      department: { include: { division: { include: { directorate: true } } } },
      competencyRequirements: {
        where: { isActive: true },
        include: { skill: { include: { category: true } } },
      },
    },
    orderBy: { positionName: "asc" },
  });
}

function loadAssessments() {
  return prisma.talentPersonSkillAssessment.findMany({
    include: { skill: { include: { category: true } } },
    orderBy: [{ employeeName: "asc" }, { positionName: "asc" }],
  });
}

function groupAssessments(assessments: AssessmentWithSkill[]) {
  const groups = new Map<string, {
    candidateId: string;
    employeeCode: string | null;
    employeeName: string;
    currentPosition: string;
    currentPositionGroup: string | null;
    currentDivision: string;
    currentDepartment: string;
    sourceFile: string;
    assessments: AssessmentWithSkill[];
  }>();

  for (const assessment of assessments) {
    const key = `${assessment.employeeName}::${assessment.positionName}::${assessment.sourceFile}`;
    const existing = groups.get(key) ?? {
      candidateId: encodeCandidateId(assessment.employeeName, assessment.positionName, assessment.sourceFile),
      employeeCode: assessment.employeeCode,
      employeeName: assessment.employeeName,
      currentPosition: assessment.positionName,
      currentPositionGroup: assessment.positionGroup,
      currentDivision: assessment.skill.category.name,
      currentDepartment: assessment.skill.category.name,
      sourceFile: assessment.sourceFile,
      assessments: [],
    };
    existing.assessments.push(assessment);
    if (!existing.employeeCode && assessment.employeeCode) existing.employeeCode = assessment.employeeCode;
    groups.set(key, existing);
  }

  return Array.from(groups.values());
}

function buildMatchRow(candidate: ReturnType<typeof groupAssessments>[number], targetPosition: PositionWithRequirements): OdTalentMatchRow {
  const currentLevels = new Map<string, AssessmentWithSkill>();
  for (const assessment of candidate.assessments) {
    const key = normalize(assessment.skill.skillName);
    const existing = currentLevels.get(key);
    if (!existing || assessment.currentLevel > existing.currentLevel) currentLevels.set(key, assessment);
  }

  const competencyGaps = targetPosition.competencyRequirements.map((requirement) => {
    const current = currentLevels.get(normalize(requirement.skill.skillName));
    const currentLevel = current?.currentLevel ?? 0;
    return {
      competencyId: requirement.skillId,
      competencyName: requirement.skill.skillName,
      competencyCategory: requirement.skill.category.name,
      requiredLevel: requirement.requiredLevel,
      currentLevel,
      gap: Math.max(0, requirement.requiredLevel - currentLevel),
    };
  }).sort((a, b) => b.gap - a.gap || b.requiredLevel - a.requiredLevel || a.competencyName.localeCompare(b.competencyName));

  const totalRequired = competencyGaps.reduce((sum, item) => sum + item.requiredLevel, 0) || 1;
  const totalCovered = competencyGaps.reduce((sum, item) => sum + Math.min(item.currentLevel, item.requiredLevel), 0);
  const matchScore = Math.round((totalCovered / totalRequired) * 100);
  const matchedCompetencies = competencyGaps.filter((item) => item.currentLevel >= item.requiredLevel).map((item) => item.competencyName);
  const partialCompetencies = competencyGaps.filter((item) => item.currentLevel > 0 && item.currentLevel < item.requiredLevel).map((item) => `${item.competencyName} S${item.currentLevel}/S${item.requiredLevel}`);
  const priorityGaps = competencyGaps.filter((item) => item.gap > 0).slice(0, 5).map((item) => `${item.competencyName} S${item.currentLevel}/S${item.requiredLevel}`);
  const targetDirectorate = normalizeDirectorateName(targetPosition.department.division.directorate.name);
  const targetDivision = targetPosition.department.division.name;
  const targetDepartment = targetPosition.department.name;

  return {
    candidateId: candidate.candidateId,
    employeeCode: candidate.employeeCode,
    employeeName: candidate.employeeName,
    currentPosition: candidate.currentPosition,
    currentPositionGroup: candidate.currentPositionGroup,
    currentDivision: candidate.currentDivision,
    currentDepartment: candidate.currentDepartment,
    sourceFile: candidate.sourceFile,
    targetPositionId: targetPosition.id,
    targetPosition: targetPosition.positionName,
    targetPositionGroup: targetPosition.jobLevel,
    targetDirectorateId: targetDirectorate,
    targetDirectorate,
    targetDivisionId: targetPosition.department.divisionId,
    targetDivision,
    targetDepartmentId: targetPosition.departmentId,
    targetDepartment,
    matchScore,
    readinessLabel: matchScore >= 85 ? "Ready" : matchScore >= 65 ? "Ready with development" : "Needs development",
    matchedCompetencies,
    partialCompetencies,
    priorityGaps,
    competencyGaps,
    developmentNeed: priorityGaps.length ? `IDP fokus: ${priorityGaps.slice(0, 3).join(", ")}` : "Maintain proficiency dan validasi readiness dengan atasan.",
    recommendationNote: priorityGaps.length
      ? `Gap dihitung dari OD person vs OD position untuk target ${targetPosition.positionName}.`
      : `Seluruh competency target ${targetPosition.positionName} sudah memenuhi required scale.`,
  };
}

function matchesFilters(row: OdTalentMatchRow, filters: OdTalentFilters) {
  const keyword = clean(filters.search ?? filters.q);
  if (filters.employee && row.employeeName !== filters.employee) return false;
  if (filters.target && row.targetPositionId !== filters.target && row.targetPosition !== filters.target) return false;
  if (filters.directorateId && row.targetDirectorateId !== filters.directorateId && normalizeDirectorateName(row.targetDirectorate) !== filters.directorateId) return false;
  if (filters.divisionId && row.targetDivisionId !== filters.divisionId) return false;
  if (filters.departmentId && row.targetDepartmentId !== filters.departmentId) return false;
  if (filters.level) {
    const currentLevel = normalizePositionLevel(row.currentPosition, row.currentPositionGroup);
    const targetLevel = normalizePositionLevel(row.targetPosition, row.targetPositionGroup);
    if (currentLevel !== filters.level && targetLevel !== filters.level) return false;
  }
  if (filters.competencyCategory && !row.competencyGaps.some((gap) => gap.competencyCategory === filters.competencyCategory)) return false;
  if (!keyword) return true;
  return [row.employeeName, row.currentPosition, row.targetPosition, row.currentDivision, row.currentDepartment, row.targetDirectorate, row.targetDivision, row.targetDepartment, ...row.priorityGaps, ...row.matchedCompetencies]
    .some((item) => item.toLocaleLowerCase("id-ID").includes(keyword.toLocaleLowerCase("id-ID")));
}

function normalizedLimit(value: string | undefined, fallback: number) {
  return Math.min(200, Math.max(10, Number(value ?? fallback) || fallback));
}

function encodeCandidateId(employeeName: string, positionName: string, sourceFile: string) {
  return `od:${Buffer.from(JSON.stringify({ employeeName, positionName, sourceFile })).toString("base64url")}`;
}

function decodeCandidateId(candidateId: string) {
  if (!candidateId.startsWith("od:")) return null;
  try {
    const parsed = JSON.parse(Buffer.from(candidateId.slice(3), "base64url").toString("utf8")) as {
      employeeName?: string;
      positionName?: string;
      sourceFile?: string;
    };
    return parsed.employeeName && parsed.positionName && parsed.sourceFile
      ? { employeeName: parsed.employeeName, positionName: parsed.positionName, sourceFile: parsed.sourceFile }
      : null;
  } catch {
    return null;
  }
}

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function splitPositionText(value: string | null | undefined) {
  return clean(value)
    .split(/(?:\r?\n|[;\u2022])/)
    .map((item) => item.replace(/^[-\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function normalize(value: string) {
  return clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}

function normalizeDirectorateName(value: string) {
  const normalized = clean(value).toLocaleLowerCase("id-ID");
  if (/marketing|commercial|sales/.test(normalized)) return "MARKETING DIRECTORATE";
  if (/legal|compliance/.test(normalized)) return "LEGAL DIRECTORATE";
  if (/hr|human|general|corporate|community/.test(normalized)) return "HRGS DIRECTORATE";
  if (/finance|audit|accounting|treasury|budget/.test(normalized)) return "FINANCE DIRECTORATE";
  return "OPERATION & HSE DIRECTORATE";
}

function normalizePositionLevel(positionName: string, jobLevel: string | null | undefined) {
  const source = `${jobLevel ?? ""} ${positionName}`.toLocaleLowerCase("id-ID");
  if (/\bgm\b|general manager/.test(source)) return "GM";
  if (/sr\.?\s*manager|senior manager/.test(source)) return "Sr Manager / Manager";
  if (/manager/.test(source)) return "Sr Manager / Manager";
  if (/superintendent|\bsupt\b|sr\.?\s*specialist|senior specialist/.test(source)) return "Superintendent / Sr Specialist";
  if (/supervisor|specialist/.test(source)) return "Supervisor / Specialist";
  if (/foreman/.test(source)) return "Foreman";
  if (/operator/.test(source)) return "Operator";
  if (/engineer|geologist|surveyor|analyst|officer/.test(source)) return "Engineer / Officer";
  return clean(jobLevel) || "Unmapped";
}

function sortPositionLevels(a: string, b: string) {
  const order = ["GM", "Sr Manager / Manager", "Superintendent / Sr Specialist", "Supervisor / Specialist", "Engineer / Officer", "Foreman", "Operator", "Unmapped"];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  if (indexA >= 0 || indexB >= 0) return (indexA >= 0 ? indexA : order.length) - (indexB >= 0 ? indexB : order.length);
  return a.localeCompare(b);
}
