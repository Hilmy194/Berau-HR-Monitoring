import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { listEmployeeMaster, type EmployeeMaster } from "@/lib/services/hr-modules.service";
import { simulateEntomoSync } from "@/lib/services/integrations/entomo/entomo.adapter";
import type { EmployeeGoal, GoalCycle, GoalStatus, GoalSyncLog, SilPatAssessment } from "./goal-setting.types";

const cycle: GoalCycle = {
  id: "bc-scorecard-cycle-2026",
  externalId: "BC-SCORECARD-2026",
  cycleName: "Scorecard Cycle 2026",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-12-31"),
  status: "Active",
  source: "Entomo",
  lastSync: new Date("2026-10-26T00:00:00.000Z"),
};

export const loadGoalSettingReadModel = cache(async function loadGoalSettingReadModel() {
  const dbRows = await prisma.employeeScorecardSetting.findMany({
    orderBy: [{ employeeId: "asc" }, { weight: "desc" }],
  });

  const employees = await listEmployeeMaster();
  const masterMap = new Map<string, EmployeeMaster>();
  for (const m of employees) {
    masterMap.set(m.employeeId, m);
    masterMap.set(m.employeeId.replace(/^0+/, ""), m);
    masterMap.set(m.profileId, m);
  }

  if (dbRows.length === 0) {
    return {
      goals: employees.flatMap(buildFallbackGoals),
      cycles: [cycle],
      syncLogs: [buildSyncLog(employees.length)],
      patAssessments: employees.map(buildFallbackPatAssessment),
    };
  }

  const goals: EmployeeGoal[] = dbRows.map((row) => {
    const empMaster = masterMap.get(row.employeeId);
    const kpiScore = Number(row.kpiScore ?? 0);
    const achievement = kpiScore > 0 ? Math.round((kpiScore / 5) * 100) : (row.status === "Completed" ? 100 : 0);
    const goalStatus: GoalStatus =
      row.status === "Completed" ? "Completed" : row.status === "In Progress" ? "In Progress" : "Not Started";

    return {
      id: row.id,
      externalId: `GS-${row.employeeId}-${row.id.slice(0, 8)}`,
      employeeId: row.employeeId,
      employeeName: row.employeeName || empMaster?.name || row.employeeId,
      position: empMaster?.currentPosition || row.orgUnit || "Karyawan",
      directorate: empMaster?.directorate || "PT Berau Coal",
      division: empMaster?.division || row.orgUnit || "Operational",
      department: empMaster?.department || row.orgUnit || "General",
      managerId: `MGR-${row.employeeId}`,
      managerName: row.supervisorName || empMaster?.supervisorName || "Atasan Langsung",
      workLocation: "Berau Coal",
      cycleId: cycle.id,
      goalCycle: cycle.cycleName,
      title: row.goalName,
      description: row.goalDescription || `Sasaran kerja: ${row.goalName} (${row.program})`,
      expectedOutcome: `Target: ${row.target || "-"} ${row.uom || ""}`,
      category: row.strategyPillar || row.program || "Operation",
      organizationObjective: row.strategyPillar || "Operational Excellence",
      departmentObjective: row.orgUnit || "Department Performance",
      baselineValue: 70,
      targetValue: parseFloat(row.target ?? "100") || 100,
      actualValue: kpiScore > 0 ? Math.round(kpiScore * 20) : (row.status === "Completed" ? 100 : 0),
      unit: row.uom || "%",
      achievement,
      weight: Number(row.weight ?? 0),
      priority: Number(row.weight ?? 0) >= 20 ? "Critical" : "High",
      status: goalStatus,
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-12-31"),
      smart: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      source: "Entomo",
      sourceUpdatedAt: row.updatedAt,
      lastSyncedAt: row.updatedAt,
      entomoUrl: `/organization-development/goal-setting/employees/${row.employeeId}`,
      history: [],
    };
  });

  // Group by employee for PAT Assessments
  const empMap = new Map<string, typeof dbRows>();
  for (const r of dbRows) {
    const list = empMap.get(r.employeeId) ?? [];
    list.push(r);
    empMap.set(r.employeeId, list);
  }

  const patAssessments: SilPatAssessment[] = Array.from(empMap.entries()).map(([empId, empRows]) => {
    const first = empRows[0];
    const empMaster = masterMap.get(empId);
    const scScore = empRows.find((r) => r.scorecardScore !== null)?.scorecardScore;
    const finalScore = scScore ? Math.round(Number(scScore) * 20) : (empRows.some((r) => r.status === "Completed") ? 90 : 75);
    const hasInProg = empRows.some((r) => r.status === "In Progress");
    const allCompleted = empRows.every((r) => r.status === "Completed");
    const status: SilPatAssessment["status"] = allCompleted ? "Complete" : hasInProg ? "In Progress" : "Reviewed";

    return {
      id: `pat-${empId}-2026`,
      externalId: `PAT-${empId}-2026`,
      employeeId: empId,
      employeeName: first.employeeName || empMaster?.name || empId,
      year: 2026,
      patName: "PAT Scorecard 2026",
      cycleName: cycle.cycleName,
      status,
      finalScore,
      performanceRating: finalScore >= 85 ? "Exceed" : finalScore >= 70 ? "Meet" : "Need Improvement",
      dynamicSections: [
        {
          id: `${empId}-pat-kpi`,
          title: "Scorecard KPI",
          fields: [
            { key: "org_unit", label: "Org Unit", value: first.orgUnit || "-" },
            { key: "total_goals", label: "Total Goals", value: empRows.length },
            { key: "total_weight", label: "Total Weight", value: `${empRows.reduce((sum, r) => sum + Number(r.weight ?? 0), 0)}%` },
          ],
        },
      ],
      feedback360: {
        strengths: empMaster?.strength.length ? empMaster.strength : ["Pencapaian sasaran kerja konsisten", "Disiplin operasional"],
        weaknesses: empMaster?.weakness.length ? empMaster.weakness : ["Monitoring berkala tindak lanjut target"],
        comments: [
          {
            reviewerGroup: "Manager",
            comment: first.supervisorName ? `Atasan langsung: ${first.supervisorName}` : "Kinerja sesuai scorecard target Berau Coal.",
            submittedAt: new Date("2026-10-26T00:00:00.000Z"),
          },
        ],
      },
      sourceSystem: "SIL/PAT",
      sourceUpdatedAt: new Date("2026-10-26T00:00:00.000Z"),
      lastSyncedAt: new Date("2026-10-26T00:00:00.000Z"),
    };
  });

  return {
    goals,
    cycles: [cycle],
    syncLogs: [buildSyncLog(patAssessments.length)],
    patAssessments,
  };
});

export async function runGoalSettingSyncSimulation() {
  return simulateEntomoSync();
}

function buildFallbackGoals(employee: EmployeeMaster, index: number): EmployeeGoal[] {
  const baseScore = averagePerformance(employee);
  const goalTitle = "Improve current role performance";
  const goalCategory = "Operation";
  const actualValue = Math.min(100, Math.max(55, baseScore - (index % 4) * 3));
  const achievement = Math.round((actualValue / 100) * 100);
  const status = achievement >= 92 ? "On Track" : achievement >= 80 ? "In Progress" : "At Risk";
  const updatedAt = new Date("2026-10-26T00:00:00.000Z");

  return [
    {
      id: `${employee.profileId}-goal-main`,
      externalId: `GS-${employee.employeeId}-MAIN`,
      employeeId: employee.profileId,
      employeeName: employee.name,
      position: employee.currentPosition,
      directorate: employee.directorate,
      division: employee.division,
      department: employee.department,
      managerId: `${employee.profileId}-manager`,
      managerName: "Atasan Langsung",
      workLocation: "Berau Coal",
      cycleId: cycle.id,
      goalCycle: cycle.cycleName,
      title: goalTitle,
      description: `Sasaran kerja ${employee.name} berdasarkan posisi ${employee.currentPosition}.`,
      expectedOutcome: `Pencapaian KPI sesuai target posisi saat ini.`,
      category: goalCategory,
      organizationObjective: "Operational Excellence",
      departmentObjective: `Improve ${employee.department}`,
      baselineValue: 70,
      supportingInformation: employee.currentSkills.join(", ") || employee.currentPosition,
      targetValue: 100,
      actualValue,
      unit: "%",
      achievement,
      weight: 100,
      priority: "High",
      status,
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-12-31"),
      smart: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      source: "Entomo",
      sourceUpdatedAt: updatedAt,
      lastSyncedAt: updatedAt,
      entomoUrl: `/organization-development/goal-setting/employees/${employee.profileId}`,
      history: [],
    },
  ];
}

function buildFallbackPatAssessment(employee: EmployeeMaster, index: number): SilPatAssessment {
  const score = Math.min(100, Math.max(70, averagePerformance(employee) - (index % 3) * 2));
  const updatedAt = new Date("2026-10-26T00:00:00.000Z");
  return {
    id: `${employee.profileId}-pat-2026`,
    externalId: `PAT-${employee.employeeId}-2026`,
    employeeId: employee.profileId,
    employeeName: employee.name,
    year: 2026,
    patName: "PAT 2026",
    cycleName: cycle.cycleName,
    status: score >= 90 ? "Reviewed" : "In Progress",
    finalScore: score,
    performanceRating: score >= 90 ? "Exceed" : "Meet",
    dynamicSections: [
      {
        id: `${employee.profileId}-pat-kpi`,
        title: "Scorecard KPI",
        fields: [
          { key: "current_position", label: "Current Position", value: employee.currentPosition },
          { key: "talent_class", label: "Talent Class", value: employee.talentClass },
          { key: "achievement", label: "Achievement", value: score, unit: "%" },
        ],
      },
    ],
    feedback360: {
      strengths: employee.strength.length ? employee.strength : ["Performance konsisten"],
      weaknesses: employee.weakness.length ? employee.weakness : ["Current gap perlu divalidasi"],
      comments: [
        {
          reviewerGroup: "Manager",
          comment: employee.supervisorNotes || "Belum ada catatan supervisor.",
          submittedAt: updatedAt,
        },
      ],
    },
    sourceSystem: "SIL/PAT",
    sourceUpdatedAt: updatedAt,
    lastSyncedAt: updatedAt,
  };
}

function buildSyncLog(employeeCount: number): GoalSyncLog {
  return {
    id: "bc-scorecard-sync",
    sourceSystem: "Entomo",
    syncType: "Scheduled",
    syncStartedAt: new Date("2026-10-26T08:00:00.000Z"),
    syncFinishedAt: new Date("2026-10-26T08:00:02.000Z"),
    status: "Success",
    recordsReceived: employeeCount,
    recordsInserted: employeeCount,
    recordsUpdated: 0,
    recordsFailed: 0,
    durationMs: 2000,
  };
}

function averagePerformance(employee: EmployeeMaster) {
  const values = employee.performance;
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 82;
}
