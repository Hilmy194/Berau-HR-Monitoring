import { prisma } from "@/lib/prisma";
import { DIRECTORATES } from "@/lib/constants";

export type OrganizationDevelopmentFilters = {
  search?: string;
  q?: string;
  directorateId?: string;
  divisionId?: string;
  departmentId?: string;
  organizationUnitId?: string;
  positionGroup?: string;
  level?: string;
  competencyCategory?: string;
  jobDescriptionStatus?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type PositionDirectoryItem = {
  id: string;
  positionCode: string;
  positionName: string;
  positionGroup: string;
  directorate: { id: string; name: string };
  division: { id: string; name: string };
  department: { id: string; name: string };
  competencyCount: number;
  hasJobDescription: boolean;
  hasOrganizationMapping: boolean;
  sourceFile: string | null;
  sourceSheet: string | null;
  isActive: boolean;
};

export type PositionRequirementItem = {
  id: string;
  competencyId: string;
  competencyName: string;
  competencyCategory: string;
  competencyDefinition: string | null;
  priorityLevel: number;
  priorityLabel: string;
  levelDescription: string | null;
  behaviorIndicators: string[];
};

export type PositionDetail = PositionDirectoryItem & {
  jobDescription: string | null;
  functionalArea: string | null;
  requirements: PositionRequirementItem[];
};

export type CompetencyDetail = {
  id: string;
  competencyName: string;
  competencyCategory: string;
  competencyDefinition: string | null;
  levels: Array<{
    level: number;
    levelName: string;
    description: string;
    behaviorIndicators: string[];
  }>;
};

export type PositionCompetencyMatrixRow = {
  positionId: string;
  positionName: string;
  positionGroup: string;
  positionLevel: string;
  directorate: string;
  division: string;
  department: string;
  byPriority: Record<number, Array<{
    id: string;
    competencyName: string;
    competencyCategory: string;
    priorityLevel: number;
  }>>;
};

export type OrganizationHierarchyPosition = {
  id: string;
  positionName: string;
  positionGroup: string;
  currentHolders: string[];
  slotCount: number;
  vacantCount: number;
};

export type OrganizationHierarchyLevel = {
  name: string;
  positionCount: number;
  positions: OrganizationHierarchyPosition[];
};

export type OrganizationHierarchyJobFamily = {
  id: string;
  name: string;
  positionCount: number;
  incumbentCount: number;
  vacantCount: number;
  levels: OrganizationHierarchyLevel[];
};

export type OrganizationHierarchyFunctionalArea = {
  id: string;
  name: string;
  positionCount: number;
  incumbentCount: number;
  vacantCount: number;
  jobFamilies: OrganizationHierarchyJobFamily[];
};

export async function getOrganizationDevelopmentSummary() {
  const [directorates, divisions, departments, competencies, positionRecords] = await Promise.all([
    prisma.organizationDirectorate.count({ where: { isActive: true } }),
    prisma.organizationDivision.count({ where: { isActive: true } }),
    prisma.organizationDepartment.count({ where: { isActive: true } }),
    prisma.talentSkill.count({ where: { isActive: true } }),
    prisma.organizationPosition.findMany({
      where: { isActive: true, sourceFile: { not: null } },
      select: {
        positionName: true,
        jobDescription: true,
        departmentId: true,
        _count: { select: { competencyRequirements: true } },
      },
    }),
  ]);

  const groupedPositions = new Map<string, typeof positionRecords>();
  for (const position of positionRecords) {
    const key = normalize(position.positionName);
    groupedPositions.set(key, [...(groupedPositions.get(key) ?? []), position]);
  }
  const uniquePositions = Array.from(groupedPositions.values());
  const positions = uniquePositions.length;
  const positionsWithJobDescription = uniquePositions.filter((records) => records.some((item) => Boolean(clean(item.jobDescription)))).length;
  const positionsWithCompetencyMapping = uniquePositions.filter((records) => records.some((item) => item._count.competencyRequirements > 0)).length;
  const positionsWithOrganizationMapping = uniquePositions.filter((records) => records.some((item) => Boolean(item.departmentId))).length;
  const organizationUnits = directorates + divisions + departments;
  return {
    totalOrganizationUnits: organizationUnits,
    totalPositions: positions,
    totalTechnicalCompetencies: competencies,
    positionsWithCompleteJobDescription: positionsWithJobDescription,
    positionsWithCompetencyMapping,
    positionsWithIncompleteData: Math.max(0, positions - Math.min(positionsWithJobDescription, positionsWithCompetencyMapping, positionsWithOrganizationMapping)),
    jobDescriptionCompleteness: percentage(positionsWithJobDescription, positions),
    competencyMappingCompleteness: percentage(positionsWithCompetencyMapping, positions),
    organizationMappingCompleteness: percentage(positionsWithOrganizationMapping, positions),
  };
}

export async function getOrganizationHierarchy() {
  const directorates = await prisma.organizationDirectorate.findMany({
    where: { isActive: true },
    include: {
      divisions: {
        where: { isActive: true },
        include: {
          departments: {
            where: { isActive: true },
            include: {
              positions: {
                where: { isActive: true },
                orderBy: { positionName: "asc" },
                select: {
                  id: true,
                  positionName: true,
                  jobLevel: true,
                  jobDescription: true,
                  currentHolder: true,
                  sourceFile: true,
                  sourceSheet: true,
                  _count: { select: { competencyRequirements: true } },
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const groupedDirectorates = new Map<string, {
    id: string;
    name: string;
    positionCount: number;
    incumbentCount: number;
    vacantCount: number;
    functionalAreas: OrganizationHierarchyFunctionalArea[];
  }>();

  for (const directorate of directorates) {
    const directorateName = normalizeDirectorateName(directorate.name);

    const rawPositions = directorate.divisions.flatMap((division) =>
      division.departments.flatMap((department) =>
        department.positions.map((position) => ({ ...position, divisionName: division.name }))
      )
    ).filter((position) => Boolean(clean(position.sourceFile)));
    const functionalAreas = groupFunctionalAreas(directorateName, rawPositions);
    const existing = groupedDirectorates.get(directorateName);
    const mergedFunctionalAreas = existing
      ? mergeFunctionalAreas([...existing.functionalAreas, ...functionalAreas])
      : functionalAreas;

    groupedDirectorates.set(directorateName, {
      id: existing?.id ?? directorate.id,
      name: directorateName,
      positionCount: mergedFunctionalAreas.reduce((total, item) => total + item.positionCount, 0),
      incumbentCount: mergedFunctionalAreas.reduce((total, item) => total + item.incumbentCount, 0),
      vacantCount: mergedFunctionalAreas.reduce((total, item) => total + item.vacantCount, 0),
      functionalAreas: mergedFunctionalAreas,
    });
  }

  for (const name of DIRECTORATES) {
    if (groupedDirectorates.has(name)) continue;
    groupedDirectorates.set(name, {
      id: `placeholder-${normalize(name)}`,
      name,
      positionCount: 0,
      incumbentCount: 0,
      vacantCount: 0,
      functionalAreas: [],
    });
  }

  return Array.from(groupedDirectorates.values()).sort((a, b) =>
    DIRECTORATES.indexOf(a.name as typeof DIRECTORATES[number]) - DIRECTORATES.indexOf(b.name as typeof DIRECTORATES[number])
  );
}

export async function getPositions(filters: OrganizationDevelopmentFilters = {}) {
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(5, Number(filters.limit ?? 15) || 15));
  const search = clean(filters.search ?? filters.q);
  const where = buildPositionWhere(filters, search);
  const orderBy = buildPositionOrder(filters);

  const [total, positions] = await Promise.all([
    prisma.organizationPosition.count({ where }),
    prisma.organizationPosition.findMany({
      where,
      include: {
        department: { include: { division: { include: { directorate: true } } } },
        _count: { select: { competencyRequirements: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    rows: positions.map(mapPositionDirectoryItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getPositionById(positionId: string): Promise<PositionDetail | null> {
  const position = await prisma.organizationPosition.findUnique({
    where: { id: positionId },
    include: {
      department: { include: { division: { include: { directorate: true } } } },
      competencyRequirements: {
        where: { isActive: true },
        include: {
          skill: {
            include: {
              category: true,
              levels: { orderBy: { level: "asc" } },
            },
          },
        },
        orderBy: { requiredLevel: "desc" },
      },
      _count: { select: { competencyRequirements: true } },
    },
  });

  if (!position) return null;
  return {
    ...mapPositionDirectoryItem(position),
    jobDescription: position.jobDescription,
    functionalArea: position.department.division.directorate.name,
    requirements: position.competencyRequirements.map((requirement) => {
      const level = requirement.skill.levels.find((item) => item.level === requirement.requiredLevel);
      return {
        id: requirement.id,
        competencyId: requirement.skill.id,
        competencyName: requirement.skill.skillName,
        competencyCategory: requirement.skill.category.name,
        competencyDefinition: requirement.skill.description,
        priorityLevel: requirement.requiredLevel,
        priorityLabel: priorityLabel(requirement.requiredLevel),
        levelDescription: level?.definition ?? null,
        behaviorIndicators: toStringArray(level?.behaviorIndicators),
      };
    }),
  };
}

export async function getPositionCompetencyRequirements(positionId: string) {
  const position = await getPositionById(positionId);
  return position?.requirements ?? [];
}

export async function getCompetencyLevelDefinition(competencyId: string, level: number) {
  return prisma.talentSkillLevelDefinition.findFirst({
    where: { skillId: competencyId, level },
  });
}

export async function getCompetencyById(competencyId: string): Promise<CompetencyDetail | null> {
  const competency = await prisma.talentSkill.findUnique({
    where: { id: competencyId },
    include: {
      category: true,
      levels: { orderBy: { level: "asc" } },
    },
  });
  if (!competency) return null;
  return {
    id: competency.id,
    competencyName: competency.skillName,
    competencyCategory: competency.category.name,
    competencyDefinition: competency.description,
    levels: competency.levels.map((level) => ({
      level: level.level,
      levelName: level.levelName,
      description: level.definition,
      behaviorIndicators: toStringArray(level.behaviorIndicators),
    })),
  };
}

export async function getOrganizationDevelopmentFilterOptions() {
  const [directorates, divisions, departments, groups, positions, categories] = await Promise.all([
    prisma.organizationDirectorate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.organizationDivision.findMany({ where: { isActive: true }, include: { directorate: true }, orderBy: { name: "asc" } }),
    prisma.organizationDepartment.findMany({ where: { isActive: true }, include: { division: { include: { directorate: true } } }, orderBy: { name: "asc" } }),
    prisma.organizationPosition.findMany({ distinct: ["jobLevel"], select: { jobLevel: true }, orderBy: { jobLevel: "asc" } }),
    prisma.organizationPosition.findMany({ where: { isActive: true }, select: { positionName: true, jobLevel: true } }),
    prisma.talentSkillCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    directorates: DIRECTORATES.map((name) => ({ id: name, name })),
    divisions: divisions.map((item) => ({ id: item.id, name: item.name, directorateId: normalizeDirectorateName(item.directorate.name) })),
    departments: departments.map((item) => ({
      id: item.id,
      name: item.name,
      divisionId: item.divisionId,
      directorateId: normalizeDirectorateName(item.division.directorate.name),
    })),
    positionGroups: groups.map((item) => item.jobLevel).filter(Boolean),
    positionLevels: Array.from(new Set(positions.map((item) => normalizePositionLevel(item.positionName, item.jobLevel)))).sort(sortPositionLevels),
    positionLevelOptions: Array.from(new Set(positions.map((item) => normalizePositionLevel(item.positionName, item.jobLevel))))
      .sort(sortPositionLevels)
      .map((level) => ({ value: level, label: positionLevelLabel(level) })),
    competencyCategories: categories.map((item) => item.name),
    orgOptions: departments.map((item) => ({
      directorate: normalizeDirectorateName(item.division.directorate.name),
      division: item.division.name,
      department: item.name,
    })),
  };
}

export async function listPositionSkillRows(filters: OrganizationDevelopmentFilters = {}) {
  const search = clean(filters.search ?? filters.q);
  const where = buildPositionWhere(filters, search);
  const requirements = await prisma.talentPositionSkillRequirement.findMany({
    where: {
      isActive: true,
      position: where,
      ...(filters.competencyCategory ? { skill: { category: { name: filters.competencyCategory } } } : {}),
    },
    include: {
      position: { include: { department: { include: { division: { include: { directorate: true } } } } } },
      skill: { include: { category: true, levels: true } },
    },
    orderBy: [{ position: { positionName: "asc" } }, { requiredLevel: "desc" }],
    take: 5000,
  });

  return requirements.map((requirement) => {
    const level = requirement.skill.levels.find((item) => item.level === requirement.requiredLevel);
    return {
      id: requirement.id,
      positionId: requirement.positionId,
      positionName: requirement.position.positionName,
      positionGroup: requirement.position.jobLevel,
      positionLevel: normalizePositionLevel(requirement.position.positionName, requirement.position.jobLevel),
      directorate: requirement.position.department.division.directorate.name,
      division: requirement.position.department.division.name,
      department: requirement.position.department.name,
      competencyName: requirement.skill.skillName,
      competencyCategory: requirement.skill.category.name,
      priorityLevel: requirement.requiredLevel,
      priorityLabel: priorityLabel(requirement.requiredLevel),
      levelDescription: level?.definition ?? null,
    };
  }).filter((row) => !filters.level || row.positionLevel === filters.level);
}

export async function getPositionCompetencyMatrix(filters: OrganizationDevelopmentFilters = {}) {
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const limit = Math.min(40, Math.max(10, Number(filters.limit ?? 20) || 20));
  const search = clean(filters.search ?? filters.q);
  const where = buildPositionWhere(filters, search);
  const categoryWhere = filters.competencyCategory ? { category: { name: filters.competencyCategory } } : {};

  const candidates = await prisma.organizationPosition.findMany({
    where: {
      ...where,
      competencyRequirements: {
        some: {
          isActive: true,
          ...(filters.competencyCategory ? { skill: { category: { name: filters.competencyCategory } } } : {}),
        },
      },
    },
    select: {
      id: true,
      positionName: true,
      jobLevel: true,
      department: {
        select: {
          name: true,
          division: {
            select: {
              name: true,
              directorate: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { positionName: "asc" },
  });

  const filteredPositions = candidates.filter((position) =>
    (!filters.directorateId || !isCanonicalDirectorate(filters.directorateId) || normalizeDirectorateName(position.department.division.directorate.name) === filters.directorateId)
    && (!filters.level || normalizePositionLevel(position.positionName, position.jobLevel) === filters.level)
  );
  const pagePositions = filteredPositions.slice((page - 1) * limit, page * limit);
  const positionIds = pagePositions.map((position) => position.id);

  const requirements = positionIds.length
    ? await prisma.talentPositionSkillRequirement.findMany({
        where: {
          isActive: true,
          positionId: { in: positionIds },
          skill: categoryWhere,
        },
        select: {
          id: true,
          positionId: true,
          requiredLevel: true,
          skill: {
            select: {
              skillName: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: [{ requiredLevel: "desc" }, { skill: { skillName: "asc" } }],
      })
    : [];

  const requirementsByPosition = new Map<string, typeof requirements>();
  for (const requirement of requirements) {
    requirementsByPosition.set(requirement.positionId, [
      ...(requirementsByPosition.get(requirement.positionId) ?? []),
      requirement,
    ]);
  }

  const rows: PositionCompetencyMatrixRow[] = pagePositions.map((position) => {
    const positionRequirements = requirementsByPosition.get(position.id) ?? [];
    const byPriority: PositionCompetencyMatrixRow["byPriority"] = {};
    for (const requirement of positionRequirements) {
      const item = {
        id: requirement.id,
        competencyName: requirement.skill.skillName,
        competencyCategory: requirement.skill.category.name,
        priorityLevel: requirement.requiredLevel,
      };
      byPriority[requirement.requiredLevel] = [...(byPriority[requirement.requiredLevel] ?? []), item];
    }
    return {
      positionId: position.id,
      positionName: position.positionName,
      positionGroup: position.jobLevel,
      positionLevel: normalizePositionLevel(position.positionName, position.jobLevel),
      directorate: normalizeDirectorateName(position.department.division.directorate.name),
      division: resolveHierarchyJobFamily(position.department.division.name, position.positionName),
      department: position.department.name,
      byPriority,
    };
  });

  return {
    rows,
    pagination: {
      page,
      limit,
      total: filteredPositions.length,
      totalPages: Math.max(1, Math.ceil(filteredPositions.length / limit)),
    },
  };
}

export async function listJobDescriptionRows(filters: OrganizationDevelopmentFilters = {}) {
  const search = clean(filters.search ?? filters.q);
  const where = buildPositionWhere(filters, search);
  const limit = Math.min(500, Math.max(10, Number(filters.limit ?? 100) || 100));
  const positions = await prisma.organizationPosition.findMany({
    where: { ...where, sourceFile: { not: null } },
    include: {
      department: { include: { division: { include: { directorate: true } } } },
      _count: { select: { competencyRequirements: true } },
    },
    orderBy: { positionName: "asc" },
    take: 5000,
  });

  const grouped = new Map<string, typeof positions>();
  for (const position of positions) {
    const key = normalize(position.positionName);
    grouped.set(key, [...(grouped.get(key) ?? []), position]);
  }

  return Array.from(grouped.values()).map((positionRecords) => {
    const canonical = [...positionRecords].sort((a, b) => jobDescriptionSourceScore(b) - jobDescriptionSourceScore(a))[0];
    const jobDescription = bestText(...positionRecords.map((item) => item.jobDescription));
    const psLevel = positionRecords.map((item) => clean(item.jobLevel)).find((item) => /ps\s*level\s*\d+/i.test(item));
    return {
      id: canonical.id,
      positionName: canonical.positionName,
      positionGroup: psLevel ?? canonical.jobLevel,
      positionLevel: normalizePositionLevel(canonical.positionName, psLevel ?? canonical.jobLevel),
      directorate: normalizeDirectorateName(canonical.department.division.directorate.name),
      division: resolveHierarchyJobFamily(canonical.department.division.name, canonical.positionName),
      department: canonical.department.name,
      jobDescription,
      competencyCount: Math.max(...positionRecords.map((item) => item._count.competencyRequirements)),
    };
  }).filter((row) =>
    (!filters.directorateId || !isCanonicalDirectorate(filters.directorateId) || row.directorate === filters.directorateId)
    && (!filters.level || row.positionLevel === filters.level)
    && (filters.jobDescriptionStatus !== "mapped" || Boolean(row.jobDescription))
    && (filters.jobDescriptionStatus !== "missing" || !row.jobDescription)
  ).sort((a, b) => a.positionName.localeCompare(b.positionName)).slice(0, limit);
}

function jobDescriptionSourceScore(position: {
  jobDescription: string | null;
  sourceSheet: string | null;
  _count: { competencyRequirements: number };
}) {
  return (position._count.competencyRequirements * 100)
    + (clean(position.jobDescription) ? 20 : 0)
    + (/position qualification/i.test(clean(position.sourceSheet)) ? 10 : 0);
}

function buildPositionWhere(filters: OrganizationDevelopmentFilters, search: string) {
  const departmentFilter = filters.departmentId || filters.organizationUnitId
    ? { id: filters.departmentId ?? filters.organizationUnitId }
    : filters.divisionId
      ? { divisionId: filters.divisionId }
      : filters.directorateId && !isCanonicalDirectorate(filters.directorateId)
        ? { division: { directorateId: filters.directorateId } }
        : undefined;

  return {
    isActive: true,
    ...(search
      ? {
          OR: [
            { positionName: { contains: search, mode: "insensitive" as const } },
            { positionCode: { contains: search, mode: "insensitive" as const } },
            { jobDescription: { contains: search, mode: "insensitive" as const } },
            { competencyRequirements: { some: { skill: { skillName: { contains: search, mode: "insensitive" as const } } } } },
          ],
        }
      : {}),
    ...(departmentFilter ? { department: departmentFilter } : {}),
    ...(filters.positionGroup ? { jobLevel: filters.positionGroup } : {}),
    ...(filters.competencyCategory
      ? { competencyRequirements: { some: { skill: { category: { name: filters.competencyCategory } } } } }
      : {}),
  };
}

function buildPositionOrder(filters: OrganizationDevelopmentFilters) {
  const sortOrder = filters.sortOrder === "desc" ? "desc" : "asc";
  if (filters.sortBy === "positionGroup") return { jobLevel: sortOrder } as const;
  if (filters.sortBy === "status") return { isActive: sortOrder } as const;
  return { positionName: sortOrder } as const;
}

function mapPositionDirectoryItem(position: {
  id: string;
  positionCode: string;
  positionName: string;
  jobLevel: string;
  jobDescription: string | null;
  sourceFile: string | null;
  sourceSheet: string | null;
  isActive: boolean;
  department: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
      directorate: { id: string; name: string };
    };
  };
  _count: { competencyRequirements: number };
}): PositionDirectoryItem {
  return {
    id: position.id,
    positionCode: position.positionCode,
    positionName: position.positionName,
    positionGroup: position.jobLevel,
    directorate: position.department.division.directorate,
    division: position.department.division,
    department: position.department,
    competencyCount: position._count.competencyRequirements,
    hasJobDescription: Boolean(clean(position.jobDescription)),
    hasOrganizationMapping: Boolean(position.department.id),
    sourceFile: position.sourceFile,
    sourceSheet: position.sourceSheet,
    isActive: position.isActive,
  };
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function isCanonicalDirectorate(value: string) {
  return DIRECTORATES.includes(value as typeof DIRECTORATES[number]);
}

function priorityLabel(level: number) {
  if (level >= 5) return "Critical Priority";
  if (level === 4) return "High Priority";
  if (level === 3) return "Important Priority";
  if (level === 2) return "Supporting Priority";
  return "Awareness Priority";
}

function normalizePositionLevel(positionName: string, jobLevel: string | null | undefined) {
  const source = `${jobLevel ?? ""} ${positionName}`.toLocaleLowerCase("id-ID");
  const psLevel = clean(jobLevel).match(/ps\s*level\s*(\d+)/i);
  if (psLevel) return `PS Level ${psLevel[1]}`;
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
  const psA = Number(a.match(/ps\s*level\s*(\d+)/i)?.[1] ?? 0);
  const psB = Number(b.match(/ps\s*level\s*(\d+)/i)?.[1] ?? 0);
  if (psA || psB) return psB - psA;
  const order = ["GM", "Sr Manager / Manager", "Superintendent / Sr Specialist", "Supervisor / Specialist", "Engineer / Officer", "Foreman", "Operator", "Unmapped"];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  if (indexA >= 0 || indexB >= 0) return (indexA >= 0 ? indexA : order.length) - (indexB >= 0 ? indexB : order.length);
  return a.localeCompare(b);
}

function positionLevelLabel(level: string) {
  const psLevel = level.match(/ps\s*level\s*(\d+)/i)?.[1];
  if (psLevel) return `Jenjang PS Level ${psLevel}`;
  if (level === "GM") return "Jenjang GM / General Manager";
  if (level === "Sr Manager / Manager") return "Jenjang Senior Manager / Manager";
  if (level === "Superintendent / Sr Specialist") return "Jenjang Superintendent / Senior Specialist";
  if (level === "Supervisor / Specialist") return "Jenjang Supervisor / Specialist";
  if (level === "Engineer / Officer") return "Jenjang Engineer / Officer";
  if (level === "Foreman") return "Jenjang Foreman";
  if (level === "Operator") return "Jenjang Operator";
  return `Jenjang ${level}`;
}

type HierarchySourcePosition = {
  id: string;
  positionName: string;
  jobLevel: string;
  jobDescription: string | null;
  currentHolder: string | null;
  sourceFile: string | null;
  sourceSheet: string | null;
  divisionName: string;
  _count: { competencyRequirements: number };
};

function groupFunctionalAreas(directorateName: string, records: HierarchySourcePosition[]): OrganizationHierarchyFunctionalArea[] {
  const grouped = new Map<string, Map<string, HierarchySourcePosition[]>>();
  for (const record of records) {
    const jobFamily = resolveHierarchyJobFamily(record.divisionName, record.positionName);
    const functionalArea = directorateName === "OPERATION & HSE DIRECTORATE"
      ? operationalFunctionalArea(jobFamily)
      : clean(record.divisionName) || directorateName;
    const families = grouped.get(functionalArea) ?? new Map<string, HierarchySourcePosition[]>();
    families.set(jobFamily, [...(families.get(jobFamily) ?? []), record]);
    grouped.set(functionalArea, families);
  }

  return Array.from(grouped.entries()).map(([name, families]) => {
    const jobFamilies = Array.from(families.entries()).map(([familyName, familyRecords]) =>
      buildJobFamily(familyName, familyRecords)
    ).sort((a, b) => sortJobFamilies(a.name, b.name));
    return summarizeFunctionalArea(name, jobFamilies);
  }).sort((a, b) => sortFunctionalAreas(a.name, b.name));
}

function buildJobFamily(name: string, records: HierarchySourcePosition[]): OrganizationHierarchyJobFamily {
  const groupedPositions = new Map<string, HierarchySourcePosition[]>();
  for (const record of records) {
    const key = normalize(record.positionName);
    groupedPositions.set(key, [...(groupedPositions.get(key) ?? []), record]);
  }
  const positions = Array.from(groupedPositions.values()).map((items) => buildHierarchyPosition(items, name));
  return summarizeJobFamily(name, positions);
}

function buildHierarchyPosition(records: HierarchySourcePosition[], jobFamily: string): OrganizationHierarchyPosition {
  const preferredSourceRecords = records.filter((item) => sourceMatchesJobFamily(item.sourceFile, jobFamily));
  const effectiveRecords = preferredSourceRecords.length ? preferredSourceRecords : records;
  const canonical = [...effectiveRecords].sort((a, b) => positionSourceScore(b) - positionSourceScore(a))[0];
  const masterRecords = effectiveRecords.filter((item) => /^master$/i.test(clean(item.sourceSheet)));
  const qualificationRecords = effectiveRecords.filter((item) => /position qualification/i.test(clean(item.sourceSheet)));
  const occupancyRecords = masterRecords.length
    ? masterRecords
    : effectiveRecords.filter((item) => !qualificationRecords.includes(item));
  const effectiveOccupancyRecords = occupancyRecords.length ? occupancyRecords : effectiveRecords;
  const currentHolders = Array.from(new Set(effectiveOccupancyRecords.map((item) => clean(item.currentHolder)).filter(Boolean)));
  const slotCount = Math.max(1, effectiveOccupancyRecords.length);
  const vacantCount = effectiveOccupancyRecords.filter((item) => !clean(item.currentHolder)).length;
  const psLevel = effectiveRecords.map((item) => clean(item.jobLevel)).find((item) => /ps\s*level\s*\d+/i.test(item));

  return {
    id: canonical.id,
    positionName: canonical.positionName,
    positionGroup: psLevel ?? normalizePositionLevel(canonical.positionName, canonical.jobLevel),
    currentHolders,
    slotCount,
    vacantCount,
  };
}

function positionSourceScore(position: HierarchySourcePosition) {
  return (position._count.competencyRequirements * 100)
    + (clean(position.jobDescription) ? 20 : 0)
    + (/position qualification/i.test(clean(position.sourceSheet)) ? 10 : 0)
    + (/^master$/i.test(clean(position.sourceSheet)) ? 1 : 0);
}

function groupHierarchyLevels(positions: OrganizationHierarchyPosition[]): OrganizationHierarchyLevel[] {
  const grouped = new Map<string, OrganizationHierarchyPosition[]>();
  for (const position of positions) {
    const level = normalizePositionLevel(position.positionName, position.positionGroup);
    grouped.set(level, [...(grouped.get(level) ?? []), position]);
  }

  return Array.from(grouped.entries())
    .map(([name, items]) => ({
      name,
      positionCount: items.length,
      positions: items.sort((a, b) => a.positionName.localeCompare(b.positionName)),
    }))
    .sort((a, b) => sortPositionLevels(a.name, b.name));
}

function summarizeJobFamily(name: string, positions: OrganizationHierarchyPosition[]): OrganizationHierarchyJobFamily {
  const sortedPositions = positions.sort((a, b) =>
    sortPositionLevels(normalizePositionLevel(a.positionName, a.positionGroup), normalizePositionLevel(b.positionName, b.positionGroup))
    || a.positionName.localeCompare(b.positionName)
  );
  return {
    id: `job-family-${normalize(name)}`,
    name,
    positionCount: sortedPositions.length,
    incumbentCount: sortedPositions.reduce((total, item) => total + item.currentHolders.length, 0),
    vacantCount: sortedPositions.reduce((total, item) => total + item.vacantCount, 0),
    levels: groupHierarchyLevels(sortedPositions),
  };
}

function summarizeFunctionalArea(name: string, jobFamilies: OrganizationHierarchyJobFamily[]): OrganizationHierarchyFunctionalArea {
  return {
    id: `functional-area-${normalize(name)}`,
    name,
    positionCount: jobFamilies.reduce((total, item) => total + item.positionCount, 0),
    incumbentCount: jobFamilies.reduce((total, item) => total + item.incumbentCount, 0),
    vacantCount: jobFamilies.reduce((total, item) => total + item.vacantCount, 0),
    jobFamilies,
  };
}

function mergeFunctionalAreas(areas: OrganizationHierarchyFunctionalArea[]) {
  const grouped = new Map<string, OrganizationHierarchyFunctionalArea>();
  for (const area of areas) {
    const existing = grouped.get(area.name);
    if (!existing) {
      grouped.set(area.name, area);
      continue;
    }
    const jobFamilies = mergeJobFamilies([...existing.jobFamilies, ...area.jobFamilies]);
    grouped.set(area.name, summarizeFunctionalArea(area.name, jobFamilies));
  }
  return Array.from(grouped.values()).sort((a, b) => sortFunctionalAreas(a.name, b.name));
}

function mergeJobFamilies(families: OrganizationHierarchyJobFamily[]) {
  const grouped = new Map<string, OrganizationHierarchyJobFamily>();
  for (const family of families) {
    const existing = grouped.get(family.name);
    if (!existing) {
      grouped.set(family.name, family);
      continue;
    }
    const positionsByName = new Map<string, OrganizationHierarchyPosition>();
    for (const position of [...existing.levels, ...family.levels].flatMap((level) => level.positions)) {
      const key = normalize(position.positionName);
      const current = positionsByName.get(key);
      positionsByName.set(key, current ? {
        ...current,
        currentHolders: Array.from(new Set([...current.currentHolders, ...position.currentHolders])),
        slotCount: current.slotCount + position.slotCount,
        vacantCount: current.vacantCount + position.vacantCount,
      } : position);
    }
    grouped.set(family.name, summarizeJobFamily(family.name, Array.from(positionsByName.values())));
  }
  return Array.from(grouped.values()).sort((a, b) => sortJobFamilies(a.name, b.name));
}

function operationalFunctionalArea(jobFamily: string) {
  if (["OHS", "OSREL", "System Compliance & Environment"].includes(jobFamily)) return jobFamily;
  return "Mining";
}

function normalizeJobFamily(value: string) {
  const normalized = clean(value).toLocaleLowerCase("id-ID");
  if (/^ohs$|occupational health|health safety environment/.test(normalized)) return "OHS";
  if (/osrel|operation.*support.*relation/.test(normalized)) return "OSREL";
  if (/system.*compliance|compliance.*environment/.test(normalized)) return "System Compliance & Environment";
  if (/geolog|exploration/.test(normalized)) return "Geology & Exploration";
  if (/mine plan|planning|survey/.test(normalized)) return "Mine Planning";
  if (/infrastructure|construction|facility|project/.test(normalized)) return "Mining Infrastructure & Project";
  if (/mining|mine operation/.test(normalized)) return "Mining Operation";
  return clean(value) || "Unmapped";
}

function resolveHierarchyJobFamily(divisionName: string, positionName: string) {
  const position = clean(positionName).toLocaleLowerCase("id-ID");
  if (/safety|occupational health|industrial hygiene|emergency|\ber commander\b|fire prevention|marine safety|data & reporting specialist/.test(position)) return "OHS";
  if (/environment|amdal|mine closure|system compliance|regulatory compliance/.test(position)) return "System Compliance & Environment";
  if (/community relation|land protector|conflict management|operation support & relation/.test(position)) return "OSREL";
  return normalizeJobFamily(divisionName);
}

function sourceMatchesJobFamily(sourceFile: string | null, jobFamily: string) {
  const source = clean(sourceFile).toLocaleLowerCase("id-ID");
  if (jobFamily === "OHS") return /\bohs\b|occupational/.test(source);
  if (jobFamily === "OSREL") return /osrel|operation.*support.*relation/.test(source);
  if (jobFamily === "System Compliance & Environment") return /system compliance|environment/.test(source);
  return /mining|mine plan|geology|construction/.test(source);
}

function sortFunctionalAreas(a: string, b: string) {
  const order = ["Mining", "OHS", "OSREL", "System Compliance & Environment"];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  return (indexA >= 0 ? indexA : order.length) - (indexB >= 0 ? indexB : order.length) || a.localeCompare(b);
}

function sortJobFamilies(a: string, b: string) {
  const order = ["Mining Operation", "Mine Planning", "Geology & Exploration", "Mining Infrastructure & Project"];
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);
  return (indexA >= 0 ? indexA : order.length) - (indexB >= 0 ? indexB : order.length) || a.localeCompare(b);
}

function normalizeDirectorateName(value: string) {
  const normalized = clean(value).toLocaleLowerCase("id-ID");
  if (/marketing|commercial|sales/.test(normalized)) return "MARKETING DIRECTORATE";
  if (/legal|compliance/.test(normalized)) return "LEGAL DIRECTORATE";
  if (/hr|human|general|corporate|community/.test(normalized)) return "HRGS DIRECTORATE";
  if (/finance|audit|accounting|treasury|budget/.test(normalized)) return "FINANCE DIRECTORATE";
  return "OPERATION & HSE DIRECTORATE";
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function bestText(...values: Array<string | null | undefined>) {
  return values.map((value) => clean(value)).filter(Boolean).sort((a, b) => b.length - a.length)[0] ?? null;
}

function normalize(value: string | null | undefined) {
  return clean(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}
