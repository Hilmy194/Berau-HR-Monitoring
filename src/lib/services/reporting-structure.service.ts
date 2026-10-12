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
  departmentId: string;
  departmentName: string;
  divisionName: string;
  directorateName: string;
  reportsToId: string | null;
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
  source?: "BIGQUERY" | "MANUAL_STORE";
  latestPeriod?: string | null;
};

export async function getReportingStructure(): Promise<ReportingStructureData> {
  // 1. Attempt to load live organization reporting structure from BigQuery mirror (bq_raw.p_emps)
  try {
    const bqData = await getBigQueryReportingStructure();
    if (bqData && bqData.totalEmployees > 0) {
      return bqData;
    }
  } catch (error) {
    console.warn("[REPORTING_STRUCTURE] BigQuery raw mirror unavailable, falling back to static store.", error);
  }

  // 2. Fallback to static OrganizationPosition table
  return getStaticReportingStructure();
}

type RawBqEmployee = {
  nik: string;
  name: string | null;
  position: string | null;
  supervisor_nik: string | null;
  supervisor_name: string | null;
  directorate: string | null;
  division: string | null;
  department: string | null;
  ps_level: string | null;
  layer: string | null;
  latest_period: bigint | number | null;
};

async function getBigQueryReportingStructure(): Promise<ReportingStructureData | null> {
  const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT (to_regclass('bq_raw.p_emps') IS NOT NULL) AS "exists";
  `;
  if (!tableCheck[0]?.exists) {
    return null;
  }

  // Fetch unique active employees taking the latest data_period per personnel_number
  const rows = await prisma.$queryRaw<RawBqEmployee[]>`
    WITH latest_emp AS (
      SELECT 
        btrim(personnel_number) AS nik,
        (array_agg(employee_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(employee_name), '') IS NOT NULL))[1] AS name,
        (array_agg(position_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(position_name), '') IS NOT NULL))[1] AS position,
        (array_agg(supervisor_nik ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(supervisor_nik), '') IS NOT NULL))[1] AS supervisor_nik,
        (array_agg(supervisor_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(supervisor_name), '') IS NOT NULL))[1] AS supervisor_name,
        (array_agg(direktorat ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(direktorat), '') IS NOT NULL))[1] AS directorate,
        (array_agg(divisi ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(divisi), '') IS NOT NULL))[1] AS division,
        (array_agg(department ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(department), '') IS NOT NULL))[1] AS department,
        (array_agg(ps_level ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(ps_level), '') IS NOT NULL))[1] AS ps_level,
        (array_agg(layer ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(layer), '') IS NOT NULL))[1] AS layer,
        MAX(data_period) AS latest_period
      FROM bq_raw.p_emps
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
      GROUP BY btrim(personnel_number)
    )
    SELECT * FROM latest_emp;
  `;

  if (!rows.length) return null;

  // Build node lookup map
  const nodeMap = new Map<string, ReportingTreeNode>();
  for (const r of rows) {
    const nik = r.nik;
    const dirName = r.directorate && r.directorate.trim() !== "-" && r.directorate.trim() !== "" ? r.directorate.trim() : "GENERAL DIRECTORATE";
    const divName = r.division && r.division.trim() !== "-" && r.division.trim() !== "" ? r.division.trim() : "-";
    const deptName = r.department && r.department.trim() !== "-" && r.department.trim() !== "" ? r.department.trim() : "-";

    const cleanSupervisorNik = r.supervisor_nik ? r.supervisor_nik.trim() : "";
    const validReportsToId = cleanSupervisorNik && cleanSupervisorNik !== "0" && cleanSupervisorNik !== nik
      ? `bq-${cleanSupervisorNik}`
      : null;

    nodeMap.set(nik, {
      id: `bq-${nik}`,
      positionCode: `POS-${nik}`,
      positionName: r.position?.trim() || "Posisi belum ditentukan",
      jobLevel: r.layer?.trim() || r.ps_level?.trim() || "-",
      holderName: r.name?.trim() || "Tanpa Nama",
      holderNik: nik,
      departmentId: `dept-${deptName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      departmentName: deptName,
      divisionName: divName,
      directorateName: dirName,
      reportsToId: validReportsToId,
      externalSupervisor: r.supervisor_name?.trim() || null,
      directReportsCount: 0,
      totalSubordinatesCount: 0,
      children: [],
    });
  }

  // Detect and break cycles
  function isAncestor(ancestorNik: string, targetNik: string): boolean {
    let cur: string | undefined = targetNik;
    const visited = new Set<string>();
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      const node = nodeMap.get(cur);
      if (!node || !node.reportsToId) return false;
      const parentNik = node.reportsToId.replace("bq-", "");
      if (parentNik === ancestorNik) return true;
      cur = parentNik;
    }
    return false;
  }

  const roots: ReportingTreeNode[] = [];
  for (const [nik, node] of nodeMap) {
    if (node.reportsToId) {
      const parentNik = node.reportsToId.replace("bq-", "");
      if (nodeMap.has(parentNik)) {
        if (isAncestor(nik, parentNik)) {
          // Break cycle
          node.reportsToId = null;
          roots.push(node);
        } else {
          const parent = nodeMap.get(parentNik)!;
          parent.children.push(node);
          parent.directReportsCount += 1;
        }
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Calculate subordinates recursively & sort
  function calculateSubordinates(node: ReportingTreeNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += calculateSubordinates(child);
    }
    node.totalSubordinatesCount = count;
    node.children.sort((a, b) => b.totalSubordinatesCount - a.totalSubordinatesCount || a.holderName.localeCompare(b.holderName));
    return count;
  }

  for (const root of roots) {
    calculateSubordinates(root);
  }

  // Sort roots: largest branches first
  roots.sort((a, b) => b.totalSubordinatesCount - a.totalSubordinatesCount || a.holderName.localeCompare(b.holderName));

  // Build Directorate -> Division -> Department grouping
  const dirMap = new Map<string, DirectorateGroupItem>();
  for (const [, node] of nodeMap) {
    const dirKey = node.directorateName;
    const divKey = `${dirKey}\0${node.divisionName}`;
    const deptKey = `${divKey}\0${node.departmentName}`;

    if (!dirMap.has(dirKey)) {
      dirMap.set(dirKey, {
        id: `dir-${dirKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: dirKey,
        code: dirKey,
        employeeCount: 0,
        divisions: [],
      });
    }
    const dirGroup = dirMap.get(dirKey)!;
    dirGroup.employeeCount += 1;

    let divGroup = dirGroup.divisions.find((d) => d.name === node.divisionName);
    if (!divGroup) {
      divGroup = {
        id: `div-${divKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: node.divisionName,
        code: node.divisionName,
        employeeCount: 0,
        departments: [],
      };
      dirGroup.divisions.push(divGroup);
    }
    divGroup.employeeCount += 1;

    let deptGroup = divGroup.departments.find((d) => d.name === node.departmentName);
    if (!deptGroup) {
      deptGroup = {
        id: `dept-${deptKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: node.departmentName,
        code: node.departmentName,
        employeeCount: 0,
        positions: [],
      };
      divGroup.departments.push(deptGroup);
    }
    deptGroup.employeeCount += 1;

    deptGroup.positions.push({
      id: node.id,
      positionCode: node.positionCode,
      positionName: node.positionName,
      jobLevel: node.jobLevel,
      holderName: node.holderName,
      holderNik: node.holderNik,
      supervisorName: node.reportsToId ? (nodeMap.get(node.reportsToId.replace("bq-", ""))?.holderName ?? node.externalSupervisor) : node.externalSupervisor,
    });
  }

  const directorates = Array.from(dirMap.values()).sort((a, b) => b.employeeCount - a.employeeCount);
  const totalDepts = new Set(Array.from(nodeMap.values()).map((n) => `${n.directorateName}-${n.divisionName}-${n.departmentName}`)).size;
  const totalDivs = new Set(Array.from(nodeMap.values()).map((n) => `${n.directorateName}-${n.divisionName}`)).size;
  const totalDirs = dirMap.size;

  const latestPeriodNum = rows[0]?.latest_period ? String(rows[0].latest_period) : null;

  return {
    totalEmployees: nodeMap.size,
    totalDepartments: totalDepts,
    totalDivisions: totalDivs,
    totalDirectorates: totalDirs,
    roots,
    directorates,
    importedAt: new Date(),
    source: "BIGQUERY",
    latestPeriod: latestPeriodNum,
  };
}

async function getStaticReportingStructure(): Promise<ReportingStructureData> {
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
      source: "MANUAL_STORE",
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
      departmentId: pos.departmentId,
      departmentName: pos.department.name,
      divisionName: pos.department.division.name,
      directorateName: pos.department.division.directorate.name,
      reportsToId: pos.reportsToId,
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
    source: "MANUAL_STORE",
  };
}
