import "server-only";

import { prisma } from "@/lib/prisma";
import { REPORTING_LINE_CODE_PREFIX } from "@/lib/reporting-line";

export type ReportingTreeNode = {
  id: string;
  positionCode: string;
  positionName: string;
  jobLevel: string;
  holderName: string;
  holderNik: string;
  departmentName: string;
  divisionName: string;
  directorateName: string;
  externalSupervisor: string | null;
  directReportsCount: number;
  totalSubordinatesCount: number;
  children: ReportingTreeNode[];
};

export type DepartmentGroupItem = {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  positions: Array<{
    id: string;
    positionCode: string;
    positionName: string;
    jobLevel: string;
    holderName: string;
    holderNik: string;
    supervisorName: string | null;
  }>;
};

export type DivisionGroupItem = {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  departments: DepartmentGroupItem[];
};

export type DirectorateGroupItem = {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  divisions: DivisionGroupItem[];
};

export type ReportingStructureData = {
  totalEmployees: number;
  totalDepartments: number;
  totalDivisions: number;
  totalDirectorates: number;
  roots: ReportingTreeNode[];
  directorates: DirectorateGroupItem[];
  importedAt: Date | null;
};

export async function getReportingStructure(): Promise<ReportingStructureData> {
  const positions = await prisma.organizationPosition.findMany({
    where: {
      isActive: true,
      positionCode: { startsWith: REPORTING_LINE_CODE_PREFIX },
    },
    include: {
      department: {
        include: {
          division: {
            include: {
              directorate: true,
            },
          },
        },
      },
    },
    orderBy: [
      { department: { division: { directorate: { name: "asc" } } } },
      { department: { division: { name: "asc" } } },
      { department: { name: "asc" } },
      { positionName: "asc" },
    ],
  });

  if (!positions.length) {
    return {
      totalEmployees: 0,
      totalDepartments: 0,
      totalDivisions: 0,
      totalDirectorates: 0,
      roots: [],
      directorates: [],
      importedAt: null,
    };
  }

  // Build node lookup map
  const nodeMap = new Map<string, ReportingTreeNode>();
  const parentOf = new Map<string, string | null>();

  for (const pos of positions) {
    nodeMap.set(pos.id, {
      id: pos.id,
      positionCode: pos.positionCode,
      positionName: pos.positionName,
      jobLevel: pos.jobLevel,
      holderName: pos.currentHolder ?? "Tanpa Nama",
      holderNik: pos.holderPersonnelNumber ?? pos.positionCode.replace(REPORTING_LINE_CODE_PREFIX, ""),
      departmentName: pos.department.name,
      divisionName: pos.department.division.name,
      directorateName: pos.department.division.directorate.name,
      externalSupervisor: pos.externalSupervisor,
      directReportsCount: 0,
      totalSubordinatesCount: 0,
      children: [],
    });
    parentOf.set(pos.id, pos.reportsToId);
  }

  // Link children
  const roots: ReportingTreeNode[] = [];
  for (const pos of positions) {
    const node = nodeMap.get(pos.id)!;
    const parentId = pos.reportsToId;
    if (parentId && nodeMap.has(parentId)) {
      const parentNode = nodeMap.get(parentId)!;
      parentNode.children.push(node);
      parentNode.directReportsCount += 1;
    } else {
      roots.push(node);
    }
  }

  // Calculate total subordinates recursively
  function calculateSubordinates(node: ReportingTreeNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += calculateSubordinates(child);
    }
    node.totalSubordinatesCount = count;
    // Sort children by subordinates count descending, then by name
    node.children.sort((a, b) => b.totalSubordinatesCount - a.totalSubordinatesCount || a.holderName.localeCompare(b.holderName));
    return count;
  }

  for (const root of roots) {
    calculateSubordinates(root);
  }

  // Sort roots: President Director / largest branches first
  roots.sort((a, b) => b.totalSubordinatesCount - a.totalSubordinatesCount || a.holderName.localeCompare(b.holderName));

  // Build Directorate -> Division -> Department grouping
  const dirMap = new Map<string, DirectorateGroupItem>();

  for (const pos of positions) {
    const dir = pos.department.division.directorate;
    const div = pos.department.division;
    const dept = pos.department;

    if (!dirMap.has(dir.id)) {
      dirMap.set(dir.id, {
        id: dir.id,
        name: dir.name,
        code: dir.code,
        employeeCount: 0,
        divisions: [],
      });
    }
    const dirGroup = dirMap.get(dir.id)!;
    dirGroup.employeeCount += 1;

    let divGroup = dirGroup.divisions.find((d) => d.id === div.id);
    if (!divGroup) {
      divGroup = {
        id: div.id,
        name: div.name,
        code: div.code,
        employeeCount: 0,
        departments: [],
      };
      dirGroup.divisions.push(divGroup);
    }
    divGroup.employeeCount += 1;

    let deptGroup = divGroup.departments.find((d) => d.id === dept.id);
    if (!deptGroup) {
      deptGroup = {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        employeeCount: 0,
        positions: [],
      };
      divGroup.departments.push(deptGroup);
    }
    deptGroup.employeeCount += 1;

    deptGroup.positions.push({
      id: pos.id,
      positionCode: pos.positionCode,
      positionName: pos.positionName,
      jobLevel: pos.jobLevel,
      holderName: pos.currentHolder ?? "Tanpa Nama",
      holderNik: pos.holderPersonnelNumber ?? pos.positionCode.replace(REPORTING_LINE_CODE_PREFIX, ""),
      supervisorName: pos.reportsToId ? (nodeMap.get(pos.reportsToId)?.holderName ?? pos.externalSupervisor ?? null) : (pos.externalSupervisor ?? null),
    });
  }

  const directorates = Array.from(dirMap.values()).sort((a, b) => b.employeeCount - a.employeeCount);

  const totalDepts = new Set(positions.map((p) => p.departmentId)).size;
  const totalDivs = new Set(positions.map((p) => p.department.divisionId)).size;
  const totalDirs = dirMap.size;
  const importedAt = positions[0]?.importedAt ?? null;

  return {
    totalEmployees: positions.length,
    totalDepartments: totalDepts,
    totalDivisions: totalDivs,
    totalDirectorates: totalDirs,
    roots,
    directorates,
    importedAt,
  };
}
