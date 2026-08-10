import { listEmployeeMaster, type EmployeeMaster } from "@/lib/services/hr-modules.service";
import { simulateEntomoSync } from "@/lib/services/integrations/entomo/entomo.adapter";
import type { EmployeeGoal, GoalCycle, GoalSyncLog, SilPatAssessment } from "./goal-setting.types";

const cycle: GoalCycle = {
  id: "sample-excel-cycle-2026",
  externalId: "SAMPLE-EXCEL-2026",
  cycleName: "Performance Cycle 2026",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-12-31"),
  status: "Active",
  source: "Entomo",
  lastSync: new Date("2026-08-06T08:00:00.000Z"),
};

export async function loadGoalSettingReadModel() {
  const employees = await listEmployeeMaster();
  return {
    goals: employees.flatMap(buildGoals),
    cycles: [cycle],
    syncLogs: [buildSyncLog(employees.length)],
    patAssessments: employees.map(buildPatAssessment),
  };
}

export async function runGoalSettingSyncSimulation() {
  return simulateEntomoSync();
}

function buildGoals(employee: EmployeeMaster, index: number): EmployeeGoal[] {
  const baseScore = averagePerformance(employee);
  const goalTitle = goalTitleFor(employee.currentPosition);
  const goalCategory = categoryFor(employee.currentPosition);
  const actualValue = Math.min(100, Math.max(55, baseScore - (index % 4) * 3));
  const achievement = Math.round((actualValue / 100) * 100);
  const status = achievement >= 92 ? "On Track" : achievement >= 80 ? "In Progress" : "At Risk";
  const updatedAt = new Date("2026-08-06T08:00:00.000Z");

  return [
    {
      id: `${employee.profileId}-goal-main`,
      externalId: `SAMPLE-${employee.employeeId}-MAIN`,
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
      description: `Goal setting ${employee.name} berdasarkan posisi ${employee.currentPosition} dari sample_input_berau_5orang_terisi.xlsx.`,
      expectedOutcome: `Pencapaian KPI ${goalCategory} sesuai target posisi saat ini.`,
      category: goalCategory,
      organizationObjective: "Operational Excellence",
      departmentObjective: `Improve ${employee.department}`,
      baselineValue: 70,
      supportingInformation: employee.currentSkills.join(", ") || employee.currentPosition,
      targetValue: 100,
      actualValue,
      unit: "%",
      achievement,
      weight: 60,
      priority: index % 3 === 0 ? "Critical" : "High",
      status,
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-12-31"),
      smart: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      source: "Entomo",
      sourceUpdatedAt: updatedAt,
      lastSyncedAt: updatedAt,
      entomoUrl: `https://entomo.example.com/employees/${employee.profileId}/goals`,
      history: [
        {
          id: `${employee.profileId}-goal-main-history`,
          goalId: `${employee.profileId}-goal-main`,
          progressDate: updatedAt,
          previousActualValue: Math.max(0, actualValue - 8),
          updatedActualValue: actualValue,
          previousAchievement: Math.max(0, achievement - 8),
          updatedAchievement: achievement,
          progressDescription: "Progress sample dari data employee/DP Excel.",
          updatedBy: employee.name,
          source: "Entomo",
          syncDate: updatedAt,
        },
      ],
    },
    {
      id: `${employee.profileId}-goal-development`,
      externalId: `SAMPLE-${employee.employeeId}-DEV`,
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
      title: "Close current competency gap",
      description: `Menutup gap utama posisi saat ini melalui project, coaching, dan learning plan.`,
      expectedOutcome: "Gap kompetensi prioritas turun dan evidence pekerjaan terdokumentasi.",
      category: "Learning & Growth",
      organizationObjective: "People Capability",
      departmentObjective: `Strengthen ${employee.department} capability`,
      baselineValue: 70,
      supportingInformation: employee.weakness.join(", ") || "Current gap dari people review",
      targetValue: 100,
      actualValue: Math.min(100, actualValue + 4),
      unit: "%",
      achievement: Math.min(100, achievement + 4),
      weight: 40,
      priority: "High",
      status: "In Progress",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-12-31"),
      smart: { specific: true, measurable: true, achievable: true, relevant: true, timeBound: true },
      source: "Entomo",
      sourceUpdatedAt: updatedAt,
      lastSyncedAt: updatedAt,
      entomoUrl: `https://entomo.example.com/employees/${employee.profileId}/goals`,
      history: [],
    },
  ];
}

function buildPatAssessment(employee: EmployeeMaster, index: number): SilPatAssessment {
  const score = Math.min(100, Math.max(70, averagePerformance(employee) - (index % 3) * 2));
  const updatedAt = new Date("2026-08-06T08:00:00.000Z");
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
    id: "sample-excel-sync",
    sourceSystem: "Entomo",
    syncType: "Scheduled",
    syncStartedAt: new Date("2026-08-06T08:00:00.000Z"),
    syncFinishedAt: new Date("2026-08-06T08:00:02.000Z"),
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

function goalTitleFor(position: string) {
  if (/safety|hse/i.test(position)) return "Improve safety risk control";
  if (/community/i.test(position)) return "Improve stakeholder and community program delivery";
  if (/geotech|geolog/i.test(position)) return "Improve geotechnical review quality";
  if (/mine|mining|production|operation/i.test(position)) return "Improve operational plan execution";
  return "Improve current role performance";
}

function categoryFor(position: string) {
  if (/safety|hse/i.test(position)) return "HSE";
  if (/community/i.test(position)) return "Stakeholder";
  if (/geotech|geolog|mine|mining|production|operation/i.test(position)) return "Operation";
  return "Business Process";
}
