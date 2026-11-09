import { prisma } from "@/lib/prisma";

export interface MyAgilitySubordinate {
  personnelNumber: string;
  name: string;
  position: string;
  jobLevel: string;
  directorate: string;
  division: string;
  department: string;
  supervisorNik: string;
  supervisorName: string;
  aspiration: string | null;
  aspirationDate: string | null;
  isAspirationFilled: boolean;
  isSupervisorReviewFilled: boolean;
  supervisorReviewPreview: string | null;
}

export interface MyAgilitySupervisorSummary {
  supervisorNik: string;
  supervisorName: string;
  department: string;
  division: string;
  directorate: string;
  totalSubordinates: number;
  subordinatesAspirationFilledCount: number;
  subordinatesReviewedCount: number;
  reviewCompletionRate: number; // 0 - 100
  aspirationCompletionRate: number; // 0 - 100
  status: "Completed" | "In Progress" | "Not Started";
  subordinates: MyAgilitySubordinate[];
}

export interface MyAgilityMonitoringData {
  year: number;
  kpi: {
    totalEmployees: number;
    employeeFilledCount: number;
    employeePendingCount: number;
    employeeFilledRate: number;
    totalSupervisors: number;
    supervisorCompletedCount: number;
    supervisorInProgressCount: number;
    supervisorNotStartedCount: number;
    supervisorCompletedRate: number;
  };
  subordinates: MyAgilitySubordinate[];
  supervisors: MyAgilitySupervisorSummary[];
}

interface RawAgilityRow {
  personnel_number: string;
  employee_name: string | null;
  position_name: string | null;
  ps_level: string | null;
  direktorat: string | null;
  divisi: string | null;
  department: string | null;
  supervisor_nik: string | null;
  supervisor_name: string | null;
  aspiration: string | null;
  bu_visibility: string | null;
  three_sixty_comments: string | null;
  three_sixty_strength: string | null;
  three_sixty_weakness: string | null;
}

export async function listMyAgilityMonitoringData(
  targetYear: number = 2026
): Promise<MyAgilityMonitoringData> {
  const rows = await prisma.$queryRawUnsafe<RawAgilityRow[]>(`
    SELECT
      btrim(p.personnel_number) AS personnel_number,
      COALESCE(e.employee_name, p.employee_name) AS employee_name,
      COALESCE(e.position_name, p.position_name, '-') AS position_name,
      COALESCE(e.ps_level, '-') AS ps_level,
      COALESCE(e.direktorat, '-') AS direktorat,
      COALESCE(e.divisi, '-') AS divisi,
      COALESCE(e.department, '-') AS department,
      COALESCE(e.supervisor_nik, '-') AS supervisor_nik,
      COALESCE(e.supervisor_name, '-') AS supervisor_name,
      btrim(p.aspiration) AS aspiration,
      btrim(p.bu_visibility) AS bu_visibility,
      btrim(p."360_comments") AS three_sixty_comments,
      btrim(p."360_strength") AS three_sixty_strength,
      btrim(p."360_weakness") AS three_sixty_weakness
    FROM bq_raw.p_talent_profile p
    LEFT JOIN (
      SELECT DISTINCT ON (btrim(personnel_number))
        personnel_number, employee_name, position_name, ps_level, direktorat, divisi, department, supervisor_nik, supervisor_name
      FROM bq_raw.p_emps
      ORDER BY btrim(personnel_number), data_period DESC
    ) e ON btrim(e.personnel_number) = btrim(p.personnel_number)
    WHERE p.talent_year = ${targetYear}
    ORDER BY employee_name ASC
  `);

  const subordinates: MyAgilitySubordinate[] = [];
  const supervisorMap = new Map<
    string,
    {
      supervisorNik: string;
      supervisorName: string;
      department: string;
      division: string;
      directorate: string;
      subordinates: MyAgilitySubordinate[];
    }
  >();

  let employeeFilledCount = 0;

  for (const r of rows) {
    const rawAsp = r.aspiration ? r.aspiration.trim() : "";
    const isAspirationFilled = Boolean(rawAsp && rawAsp !== "-" && rawAsp.length > 2);

    let aspirationDate: string | null = null;
    let cleanAspirationText = rawAsp;

    if (isAspirationFilled) {
      employeeFilledCount++;
      const dateMatch = rawAsp.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        aspirationDate = dateMatch[1];
        cleanAspirationText = rawAsp.replace(/^(\d{4}-\d{2}-\d{2}\s*-\s*)/, "").trim();
      }
    }

    const hasComments = Boolean(r.three_sixty_comments && r.three_sixty_comments.trim().length > 1 && r.three_sixty_comments.trim() !== "-");
    const hasStrength = Boolean(r.three_sixty_strength && r.three_sixty_strength.trim().length > 1 && r.three_sixty_strength.trim() !== "-");
    const hasBuVisibility = Boolean(r.bu_visibility && r.bu_visibility.trim().length > 1 && r.bu_visibility.trim() !== "-");
    const isSupervisorReviewFilled = hasComments || hasStrength || hasBuVisibility;

    let supervisorReviewPreview: string | null = null;
    if (r.three_sixty_comments && r.three_sixty_comments.trim().length > 0) {
      // Pick first line
      const firstLine = r.three_sixty_comments.split("\n")[0].trim();
      supervisorReviewPreview = firstLine.length > 120 ? firstLine.slice(0, 117) + "..." : firstLine;
    } else if (r.three_sixty_strength && r.three_sixty_strength.trim().length > 0) {
      const firstLine = r.three_sixty_strength.split("\n")[0].trim();
      supervisorReviewPreview = firstLine.length > 120 ? firstLine.slice(0, 117) + "..." : firstLine;
    }

    const cleanSupervisorName = r.supervisor_name && r.supervisor_name !== "-" ? r.supervisor_name.trim() : "Belum Terpetakan";
    const cleanSupervisorNik = r.supervisor_nik && r.supervisor_nik !== "0" && r.supervisor_nik !== "-" ? r.supervisor_nik.trim() : "-";

    const subItem: MyAgilitySubordinate = {
      personnelNumber: r.personnel_number,
      name: r.employee_name || r.personnel_number,
      position: r.position_name || "-",
      jobLevel: r.ps_level || "-",
      directorate: r.direktorat || "-",
      division: r.divisi || "-",
      department: r.department || "-",
      supervisorNik: cleanSupervisorNik,
      supervisorName: cleanSupervisorName,
      aspiration: isAspirationFilled ? cleanAspirationText : null,
      aspirationDate,
      isAspirationFilled,
      isSupervisorReviewFilled,
      supervisorReviewPreview,
    };

    subordinates.push(subItem);

    // Group into supervisors
    const supKey = cleanSupervisorName.toLowerCase();
    if (!supervisorMap.has(supKey)) {
      supervisorMap.set(supKey, {
        supervisorNik: cleanSupervisorNik,
        supervisorName: cleanSupervisorName,
        department: r.department || "-",
        division: r.divisi || "-",
        directorate: r.direktorat || "-",
        subordinates: [],
      });
    }
    supervisorMap.get(supKey)!.subordinates.push(subItem);
  }

  // Build supervisor summaries
  let supervisorCompletedCount = 0;
  let supervisorInProgressCount = 0;
  let supervisorNotStartedCount = 0;

  const supervisors: MyAgilitySupervisorSummary[] = Array.from(supervisorMap.values())
    .map((s) => {
      const total = s.subordinates.length;
      const aspFilled = s.subordinates.filter((sub) => sub.isAspirationFilled).length;
      const reviewed = s.subordinates.filter((sub) => sub.isSupervisorReviewFilled).length;

      const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;
      const aspRate = total > 0 ? Math.round((aspFilled / total) * 100) : 0;

      let status: "Completed" | "In Progress" | "Not Started" = "Not Started";
      if (reviewed === total && total > 0) {
        status = "Completed";
        supervisorCompletedCount++;
      } else if (reviewed > 0) {
        status = "In Progress";
        supervisorInProgressCount++;
      } else {
        supervisorNotStartedCount++;
      }

      return {
        supervisorNik: s.supervisorNik,
        supervisorName: s.supervisorName,
        department: s.department,
        division: s.division,
        directorate: s.directorate,
        totalSubordinates: total,
        subordinatesAspirationFilledCount: aspFilled,
        subordinatesReviewedCount: reviewed,
        reviewCompletionRate: reviewRate,
        aspirationCompletionRate: aspRate,
        status,
        subordinates: s.subordinates,
      };
    })
    .sort((a, b) => {
      // Sort by in-progress/not-started first, or by total subordinates desc
      if (a.status !== b.status) {
        if (a.status === "In Progress") return -1;
        if (b.status === "In Progress") return 1;
        if (a.status === "Not Started") return -1;
        if (b.status === "Not Started") return 1;
      }
      return b.totalSubordinates - a.totalSubordinates;
    });

  const totalEmployees = subordinates.length;
  const employeePendingCount = totalEmployees - employeeFilledCount;
  const employeeFilledRate = totalEmployees > 0 ? Math.round((employeeFilledCount / totalEmployees) * 100) : 0;
  const totalSupervisors = supervisors.length;
  const supervisorCompletedRate =
    totalSupervisors > 0 ? Math.round((supervisorCompletedCount / totalSupervisors) * 100) : 0;

  return {
    year: targetYear,
    kpi: {
      totalEmployees,
      employeeFilledCount,
      employeePendingCount,
      employeeFilledRate,
      totalSupervisors,
      supervisorCompletedCount,
      supervisorInProgressCount,
      supervisorNotStartedCount,
      supervisorCompletedRate,
    },
    subordinates,
    supervisors,
  };
}

