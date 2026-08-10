import { loadGoalSettingReadModel, runGoalSettingSyncSimulation } from "./goal-setting.repository";
import { DIRECTORATES } from "@/lib/constants";
import { listEmployeeMaster } from "@/lib/services/hr-modules.service";
import { GOAL_STATUSES, SMART_KEYS, type EmployeeGoal, type EmployeeGoalSummary, type GoalSettingFilters, type GoalStatus, type ScorecardKpiSetting, type SilPatAssessment, type SmartEvaluation } from "./goal-setting.types";

const scorecardKpiSettings: ScorecardKpiSetting[] = [
  {
    id: "scorecard-kpi-a",
    strategyPillarName: "Finance",
    goalName: "KPI A",
    goalDescription: "xxx",
    reviewPeriod: "Monthly",
    uom: "%",
    weight: 5,
    levels: { l1: "60", l2: "70", l3: "80", l4: "90", l5: "100" },
  },
  {
    id: "scorecard-kpi-b",
    strategyPillarName: "Customer",
    goalName: "KPI B",
    goalDescription: "xxx",
    reviewPeriod: "Quarterly",
    uom: "Days",
    weight: 10,
    levels: { l1: "5", l2: "4", l3: "3", l4: "2", l5: "1" },
  },
  {
    id: "scorecard-kpi-c",
    strategyPillarName: "Learning & Growth",
    goalName: "KPI C",
    goalDescription: "xxx",
    reviewPeriod: "Half Yearly",
    uom: "Hours",
    weight: 15,
    levels: { l1: "5", l2: "4", l3: "3", l4: "2", l5: "1" },
  },
  {
    id: "scorecard-kpi-d",
    strategyPillarName: "Internal Business Process",
    goalName: "KPI D",
    goalDescription: "xxx",
    reviewPeriod: "Once",
    uom: "IDR Bn",
    weight: 20,
    levels: { l1: "3000", l2: "3500", l3: "4000", l4: "4900", l5: "5100" },
  },
];

export async function getScorecardKpiSettingDashboard(filters: GoalSettingFilters = {}) {
  const rows = filterScorecardKpiSettings(scorecardKpiSettings, filters);
  return {
    summary: {
      totalGoals: rows.length,
      totalWeight: rows.reduce((sum, row) => sum + row.weight, 0),
      strategyPillars: unique(rows.map((row) => row.strategyPillarName)).length,
      reviewPeriods: unique(rows.map((row) => row.reviewPeriod)).length,
      averageWeight: average(rows.map((row) => row.weight)),
    },
    rows,
  };
}

export async function getScorecardKpiSettingFilterOptions() {
  return {
    strategyPillars: unique(scorecardKpiSettings.map((row) => row.strategyPillarName)),
    reviewPeriods: unique(scorecardKpiSettings.map((row) => row.reviewPeriod)),
    uoms: unique(scorecardKpiSettings.map((row) => row.uom)),
  };
}

export function scorecardKpiSettingsToCsv(rows: ScorecardKpiSetting[]) {
  const headers = ["Strategy Pillar Name", "Goal Name", "Goal Description", "Review Period", "UOM", "Wgt", "L1", "L2", "L3", "L4", "L5"];
  const data = rows.map((row) => [
    row.strategyPillarName,
    row.goalName,
    row.goalDescription,
    row.reviewPeriod,
    row.uom,
    String(row.weight),
    row.levels.l1,
    row.levels.l2,
    row.levels.l3,
    row.levels.l4,
    row.levels.l5,
  ]);
  return [headers, ...data].map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function getGoalSettingDashboard(filters: GoalSettingFilters = {}) {
  const { goals, cycles, syncLogs } = await loadGoalSettingReadModel();
  const filteredGoals = filterGoals(goals, filters);
  const employees = summarizeEmployees(filteredGoals);
  const totalGoals = filteredGoals.length;
  const completed = filteredGoals.filter((goal) => goal.status === "Completed").length;
  const averageAchievement = average(filteredGoals.map((goal) => goal.achievement));
  const smartAverage = average(filteredGoals.map((goal) => evaluateSmart(goal).percentage));

  return {
    summary: {
      employeesWithGoals: employees.length,
      totalGoals,
      notStarted: countStatus(filteredGoals, "Not Started"),
      inProgress: countStatus(filteredGoals, "In Progress"),
      onTrack: countStatus(filteredGoals, "On Track"),
      atRisk: countStatus(filteredGoals, "At Risk"),
      overdue: countStatus(filteredGoals, "Overdue"),
      completed,
      averageAchievement,
      completionRate: percentage(completed, totalGoals),
      smartCompliance: smartAverage,
    },
    charts: {
      statusDistribution: GOAL_STATUSES.filter((status) => status !== "Cancelled").map((status) => ({
        name: status,
        value: countStatus(filteredGoals, status),
        fill: statusColor(status),
      })),
      completionByDirectorate: completionBy(filteredGoals, "directorate"),
      completionByDivision: completionBy(filteredGoals, "division"),
      achievementByDepartment: achievementBy(filteredGoals, "department"),
      monthlyProgress: monthlyProgress(filteredGoals),
      achievementDistribution: achievementDistribution(filteredGoals),
    },
    employees,
    cycles,
    syncLogs,
  };
}

export async function getPatGoalSettingDashboard(filters: GoalSettingFilters = {}) {
  const { goals, patAssessments, syncLogs } = await loadGoalSettingReadModel();
  const employeeSummaries = summarizeEmployees(goals);
  const rows = filterPatRows(patAssessments.map((pat) => ({
    pat,
    employee: employeeSummaries.find((employee) => employee.employeeId === pat.employeeId) ?? null,
  })), filters);
  const averageScore = average(rows.map((row) => row.pat.finalScore));
  const reviewedCount = rows.filter((row) => row.pat.status === "Reviewed").length;
  const inProgressCount = rows.filter((row) => row.pat.status === "In Progress").length;
  const completeCount = rows.filter((row) => row.pat.status === "Complete").length;
  const totalComments = rows.reduce((sum, row) => sum + row.pat.feedback360.comments.length, 0);
  const totalStrengths = rows.reduce((sum, row) => sum + row.pat.feedback360.strengths.length, 0);
  const totalWeaknesses = rows.reduce((sum, row) => sum + row.pat.feedback360.weaknesses.length, 0);

  return {
    summary: {
      year: Number(filters.year ?? 2026) || 2026,
      employees: rows.length,
      reviewed: reviewedCount,
      inProgress: inProgressCount,
      complete: completeCount,
      averagePatScore: averageScore,
      feedbackComments: totalComments,
      strengths: totalStrengths,
      weaknesses: totalWeaknesses,
      lastSync: maxDate(rows.map((row) => row.pat.lastSyncedAt)),
    },
    charts: {
      monthlyPatMonitoring: monthlyPatMonitoring(rows.map((row) => row.pat)),
      directorateReviewStatus: directorateReviewStatus(rows),
    },
    rows: rows.map(({ pat, employee }) => ({
      employeeId: pat.employeeId,
      employeeName: pat.employeeName,
      position: employee?.position ?? "Not mapped",
      directorate: employee?.directorate ?? "Not mapped",
      division: employee?.division ?? "Not mapped",
      department: employee?.department ?? "Not mapped",
      managerName: employee?.managerName ?? "Not mapped",
      year: pat.year,
      patName: pat.patName,
      status: pat.status,
      finalScore: pat.finalScore,
      performanceRating: pat.performanceRating,
      strengths: pat.feedback360.strengths,
      weaknesses: pat.feedback360.weaknesses,
      comments: pat.feedback360.comments,
      lastSync: pat.lastSyncedAt,
      entomoUrl: `https://entomo.example.com/employees/${pat.employeeId}/pat/${pat.year}`,
    })),
    syncLogs,
  };
}

export async function listGoalEmployees(filters: GoalSettingFilters = {}) {
  const { goals } = await loadGoalSettingReadModel();
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(5, Number(filters.limit ?? 20) || 20));
  const rows = sortEmployees(summarizeEmployees(filterGoals(goals, filters)), filters);
  return {
    rows: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
  };
}

export async function listGoals(filters: GoalSettingFilters = {}) {
  const { goals } = await loadGoalSettingReadModel();
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const limit = Math.min(200, Math.max(10, Number(filters.limit ?? 50) || 50));
  const rows = sortGoals(filterGoals(goals, filters), filters);
  return {
    rows,
    pagedRows: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
  };
}

export async function getGoalEmployeeDetail(employeeId: string) {
  const { goals, patAssessments } = await loadGoalSettingReadModel();
  const employeeGoals = goals.filter((goal) => goal.employeeId === employeeId);
  if (!employeeGoals.length) return null;
  const employeeMaster = (await listEmployeeMaster()).find((employee) => employee.profileId === employeeId);
  return {
    employee: {
      ...summarizeEmployee(employeeGoals),
      employeeId: employeeMaster?.employeeId ?? employeeId,
      employeeProfileId: employeeId,
    },
    goals: employeeGoals,
    patAssessment: patAssessments.find((pat) => pat.employeeId === employeeId) ?? null,
    scorecardKpiSettings,
  };
}

export async function findGoalEmployeeDetail(identifier: string | null | undefined, employeeName?: string | null) {
  const { goals, patAssessments } = await loadGoalSettingReadModel();
  const normalizedIdentifier = clean(identifier).toLocaleLowerCase("id-ID");
  const normalizedName = clean(employeeName).toLocaleLowerCase("id-ID");
  const employeeGoals = goals.filter((goal) =>
    (normalizedIdentifier && goal.employeeId.toLocaleLowerCase("id-ID") === normalizedIdentifier)
    || (normalizedName && goal.employeeName.toLocaleLowerCase("id-ID") === normalizedName)
  );
  if (!employeeGoals.length) return null;
  return {
    employee: summarizeEmployee(employeeGoals),
    goals: employeeGoals,
    patAssessment: patAssessments.find((pat) =>
      pat.employeeId === employeeGoals[0].employeeId
      || pat.employeeName.toLocaleLowerCase("id-ID") === employeeGoals[0].employeeName.toLocaleLowerCase("id-ID")
    ) ?? null,
    scorecardKpiSettings,
  };
}

export async function getPatAssessmentByEmployee(employeeId: string) {
  const { patAssessments } = await loadGoalSettingReadModel();
  return patAssessments.find((pat) => pat.employeeId === employeeId) ?? null;
}

export async function getGoalById(goalId: string) {
  const { goals } = await loadGoalSettingReadModel();
  return goals.find((goal) => goal.id === goalId || goal.externalId === goalId) ?? null;
}

export async function getGoalHistory(goalId: string) {
  return (await getGoalById(goalId))?.history ?? [];
}

export async function getGoalCycles() {
  return (await loadGoalSettingReadModel()).cycles;
}

export async function getGoalSyncLogs() {
  return (await loadGoalSettingReadModel()).syncLogs;
}

export async function syncGoalsFromEntomo() {
  return runGoalSettingSyncSimulation();
}

export async function getGoalFilterOptions() {
  const { goals, cycles, patAssessments } = await loadGoalSettingReadModel();
  return {
    directorates: [...DIRECTORATES],
    divisions: unique(goals.map((goal) => goal.division)),
    departments: unique(goals.map((goal) => goal.department)),
    positions: unique(goals.map((goal) => goal.position)),
    managers: unique(goals.map((goal) => goal.managerName)),
    cycles: cycles.map((cycle) => cycle.cycleName),
    statuses: [...GOAL_STATUSES],
    smartStatuses: ["Complete", "Partial", "Incomplete"],
    achievementRanges: ["Below 50%", "50%-74%", "75%-99%", "100%", "Above 100%"],
    years: unique(patAssessments.map((pat) => String(pat.year))),
    patStatuses: unique(patAssessments.map((pat) => pat.status)),
    ratings: unique(patAssessments.map((pat) => pat.performanceRating)),
  };
}

export function evaluateSmart(goal: EmployeeGoal): SmartEvaluation {
  const source = goal.smart ?? {};
  const specific = source.specific ?? Boolean(goal.title && goal.description && goal.expectedOutcome);
  const measurable = source.measurable ?? (goal.targetValue !== undefined && goal.actualValue !== undefined && Boolean(goal.unit));
  const achievable = source.achievable ?? (goal.targetValue !== undefined && goal.baselineValue !== undefined && Boolean(goal.supportingInformation));
  const relevant = source.relevant ?? Boolean(goal.category && goal.departmentObjective && goal.organizationObjective);
  const timeBound = source.timeBound ?? Boolean(goal.startDate && goal.dueDate);
  const entries = { specific, measurable, achievable, relevant, timeBound };
  const complete = SMART_KEYS.filter((key) => entries[key]).length;
  const missing = SMART_KEYS.filter((key) => !entries[key]).map(smartLabel);
  const percentageValue = Math.round((complete / SMART_KEYS.length) * 100);
  return {
    ...entries,
    percentage: percentageValue,
    status: percentageValue === 100 ? "Complete" : percentageValue === 0 ? "Incomplete" : "Partial",
    missing,
  };
}

export function summarizeEmployees(goals: EmployeeGoal[]) {
  const grouped = new Map<string, EmployeeGoal[]>();
  for (const goal of goals) grouped.set(goal.employeeId, [...(grouped.get(goal.employeeId) ?? []), goal]);
  return Array.from(grouped.values()).map(summarizeEmployee);
}

export function summarizeEmployee(goals: EmployeeGoal[]): EmployeeGoalSummary {
  const first = goals[0];
  const completedGoals = goals.filter((goal) => goal.status === "Completed").length;
  const atRiskGoals = goals.filter((goal) => goal.status === "At Risk").length;
  const overdueGoals = goals.filter((goal) => goal.status === "Overdue").length;
  const inProgressGoals = goals.filter((goal) => ["In Progress", "On Track"].includes(goal.status)).length;
  const smartCompliance = average(goals.map((goal) => evaluateSmart(goal).percentage));
  return {
    employeeId: first.employeeId,
    employeeName: first.employeeName,
    employeePhotoUrl: first.employeePhotoUrl,
    position: first.position,
    directorate: normalizeDirectorate(first.directorate),
    division: first.division,
    department: first.department,
    managerName: first.managerName,
    workLocation: first.workLocation,
    goalCycle: first.goalCycle,
    totalGoals: goals.length,
    totalWeight: goals.reduce((sum, goal) => sum + goal.weight, 0),
    averageAchievement: average(goals.map((goal) => goal.achievement)),
    completedGoals,
    inProgressGoals,
    atRiskGoals,
    overdueGoals,
    completionRate: percentage(completedGoals, goals.length),
    smartCompliance,
    overallStatus: overallStatus(goals),
    lastSync: maxDate(goals.map((goal) => goal.lastSyncedAt)),
    latestGoalUpdate: maxDate(goals.map((goal) => goal.sourceUpdatedAt)),
    entomoUrl: `https://entomo.example.com/employees/${first.employeeId}/goals`,
  };
}

export function goalsToCsv(goals: EmployeeGoal[]) {
  const headers = ["Employee ID", "Employee Name", "Position", "Directorate", "Division", "Department", "Manager", "Goal Cycle", "Goal Title", "Goal Weight", "Target", "Actual", "Achievement", "Status", "SMART Compliance", "Start Date", "Due Date", "Last Updated"];
  const rows = goals.map((goal) => [
    goal.employeeId,
    goal.employeeName,
    goal.position,
    goal.directorate,
    goal.division,
    goal.department,
    goal.managerName,
    goal.goalCycle,
    goal.title,
    `${goal.weight}%`,
    `${goal.targetValue}${goal.unit}`,
    `${goal.actualValue}${goal.unit}`,
    `${goal.achievement}%`,
    goal.status,
    `${evaluateSmart(goal).percentage}%`,
    isoDate(goal.startDate),
    isoDate(goal.dueDate),
    isoDate(goal.sourceUpdatedAt),
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function patToCsv(rows: Awaited<ReturnType<typeof getPatGoalSettingDashboard>>["rows"]) {
  const headers = ["Employee ID", "Employee Name", "Position", "Directorate", "Division", "Department", "Manager", "Year", "PAT Name", "Final Score", "Status", "Strength", "Weakness", "Comment", "Last Sync"];
  const data = rows.map((row) => [
    row.employeeId,
    row.employeeName,
    row.position,
    row.directorate,
    row.division,
    row.department,
    row.managerName,
    String(row.year),
    row.patName,
    String(row.finalScore),
    row.status,
    row.strengths.join(" | "),
    row.weaknesses.join(" | "),
    row.comments.map((comment) => `${comment.reviewerGroup}: ${comment.comment}`).join(" | "),
    isoDate(row.lastSync),
  ]);
  return [headers, ...data].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function statusColor(status: string) {
  if (status === "Completed") return "#15803d";
  if (status === "On Track") return "#22c55e";
  if (status === "In Progress") return "#2563eb";
  if (status === "At Risk") return "#f59e0b";
  if (status === "Overdue") return "#ef4444";
  return "#64748b";
}

function filterGoals(goals: EmployeeGoal[], filters: GoalSettingFilters) {
  const q = clean(filters.q).toLocaleLowerCase("id-ID");
  return goals.filter((goal) => {
    if (filters.employeeName && !goal.employeeName.toLocaleLowerCase("id-ID").includes(filters.employeeName.toLocaleLowerCase("id-ID"))) return false;
    if (filters.employeeId && !goal.employeeId.toLocaleLowerCase("id-ID").includes(filters.employeeId.toLocaleLowerCase("id-ID"))) return false;
    if (filters.directorate && normalizeDirectorate(goal.directorate) !== filters.directorate) return false;
    if (filters.division && goal.division !== filters.division) return false;
    if (filters.department && goal.department !== filters.department) return false;
    if (filters.position && goal.position !== filters.position) return false;
    if (filters.manager && goal.managerName !== filters.manager) return false;
    if (filters.cycle && goal.goalCycle !== filters.cycle) return false;
    if (filters.status && goal.status !== filters.status) return false;
    if (filters.smartStatus && evaluateSmart(goal).status !== filters.smartStatus) return false;
    if (filters.achievementRange && !matchesAchievement(goal.achievement, filters.achievementRange)) return false;
    if (filters.deadlineFrom && goal.dueDate < new Date(filters.deadlineFrom)) return false;
    if (filters.deadlineTo && goal.dueDate > new Date(filters.deadlineTo)) return false;
    if (filters.lastSyncFrom && goal.lastSyncedAt < new Date(filters.lastSyncFrom)) return false;
    if (filters.lastSyncTo && goal.lastSyncedAt > new Date(filters.lastSyncTo)) return false;
    if (!q) return true;
    return [goal.employeeName, goal.employeeId, goal.position, goal.directorate, goal.division, goal.department, goal.managerName, goal.title, goal.category]
      .some((item) => item.toLocaleLowerCase("id-ID").includes(q));
  });
}

function filterPatRows(rows: Array<{ pat: SilPatAssessment; employee: EmployeeGoalSummary | null }>, filters: GoalSettingFilters) {
  const q = clean(filters.q).toLocaleLowerCase("id-ID");
  return rows.filter(({ pat, employee }) => {
    if (filters.year && String(pat.year) !== filters.year) return false;
    if (filters.status && pat.status !== filters.status) return false;
    if (filters.directorate && normalizeDirectorate(employee?.directorate) !== filters.directorate) return false;
    if (filters.division && employee?.division !== filters.division) return false;
    if (filters.department && employee?.department !== filters.department) return false;
    if (filters.position && employee?.position !== filters.position) return false;
    if (filters.manager && employee?.managerName !== filters.manager) return false;
    if (!q) return true;
    return [
      pat.employeeId,
      pat.employeeName,
      pat.patName,
      pat.performanceRating,
      employee?.position ?? "",
      employee?.directorate ?? "",
      employee?.division ?? "",
      employee?.department ?? "",
      employee?.managerName ?? "",
      ...pat.feedback360.strengths,
      ...pat.feedback360.weaknesses,
      ...pat.feedback360.comments.map((comment) => comment.comment),
    ].some((item) => item.toLocaleLowerCase("id-ID").includes(q));
  });
}

function filterScorecardKpiSettings(rows: ScorecardKpiSetting[], filters: GoalSettingFilters) {
  const q = clean(filters.q).toLocaleLowerCase("id-ID");
  return rows.filter((row) => {
    if (filters.strategyPillar && row.strategyPillarName !== filters.strategyPillar) return false;
    if (filters.reviewPeriod && row.reviewPeriod !== filters.reviewPeriod) return false;
    if (!q) return true;
    return [
      row.strategyPillarName,
      row.goalName,
      row.goalDescription,
      row.reviewPeriod,
      row.uom,
      row.levels.l1,
      row.levels.l2,
      row.levels.l3,
      row.levels.l4,
      row.levels.l5,
    ].some((item) => item.toLocaleLowerCase("id-ID").includes(q));
  });
}

function completionBy(goals: EmployeeGoal[], key: "directorate" | "division") {
  return groupBy(goals, key).map(([name, rows]) => ({ name, rate: percentage(rows.filter((goal) => goal.status === "Completed").length, rows.length) }));
}

function achievementBy(goals: EmployeeGoal[], key: "department") {
  return groupBy(goals, key).map(([name, rows]) => ({ name, achievement: average(rows.map((goal) => goal.achievement)) }));
}

function monthlyProgress(goals: EmployeeGoal[]) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(2026, index + 2, 1);
    const multiplier = 0.55 + index * 0.09;
    return {
      month: date.toLocaleDateString("id-ID", { month: "short" }),
      achievement: Math.min(100, Math.round(average(goals.map((goal) => goal.achievement)) * multiplier)),
    };
  });
}

function monthlyPatMonitoring(pats: SilPatAssessment[]) {
  const base = average(pats.map((pat) => pat.finalScore));
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2026, index, 1);
    const progressRatio = Math.min(1, (index + 1) / 12);
    return {
      month: date.toLocaleDateString("id-ID", { month: "short" }),
      patScore: Math.round(base * (0.72 + progressRatio * 0.28)),
      feedbackComments: pats.reduce((sum, pat) => sum + Math.ceil((pat.feedback360.comments.length * (index + 1)) / 12), 0),
      reviewedEmployees: Math.round(pats.length * progressRatio),
    };
  });
}

function directorateReviewStatus(rows: Array<{ pat: SilPatAssessment; employee: EmployeeGoalSummary | null }>) {
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = normalizeDirectorate(row.employee?.directorate);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return Array.from(grouped.entries()).map(([directorate, items]) => ({
    directorate,
    statuses: [
      { name: "Reviewed", value: items.filter((item) => item.pat.status === "Reviewed").length, fill: "#0ea5e9" },
      { name: "In Progress", value: items.filter((item) => item.pat.status === "In Progress").length, fill: "#f59e0b" },
      { name: "Complete", value: items.filter((item) => item.pat.status === "Complete").length, fill: "#15803d" },
    ],
  }));
}

function achievementDistribution(goals: EmployeeGoal[]) {
  const ranges = ["Below 50%", "50%-74%", "75%-99%", "100%", "Above 100%"];
  return ranges.map((name) => ({ name, value: goals.filter((goal) => matchesAchievement(goal.achievement, name)).length }));
}

function sortEmployees(rows: EmployeeGoalSummary[], filters: GoalSettingFilters) {
  const dir = filters.sortOrder === "desc" ? -1 : 1;
  const key = filters.sortBy ?? "employeeName";
  return [...rows].sort((a, b) => compare(a[key as keyof EmployeeGoalSummary], b[key as keyof EmployeeGoalSummary]) * dir);
}

function sortGoals(rows: EmployeeGoal[], filters: GoalSettingFilters) {
  const dir = filters.sortOrder === "desc" ? -1 : 1;
  const key = filters.sortBy ?? "employeeName";
  return [...rows].sort((a, b) => compare(a[key as keyof EmployeeGoal], b[key as keyof EmployeeGoal]) * dir);
}

function overallStatus(goals: EmployeeGoal[]): GoalStatus {
  if (goals.some((goal) => goal.status === "Overdue")) return "Overdue";
  if (goals.some((goal) => goal.status === "At Risk")) return "At Risk";
  if (goals.every((goal) => goal.status === "Completed")) return "Completed";
  if (goals.some((goal) => goal.status === "On Track")) return "On Track";
  if (goals.some((goal) => goal.status === "In Progress")) return "In Progress";
  return "Not Started";
}

function countStatus(goals: EmployeeGoal[], status: GoalStatus) {
  return goals.filter((goal) => goal.status === status).length;
}

function groupBy(goals: EmployeeGoal[], key: "directorate" | "division" | "department") {
  const map = new Map<string, EmployeeGoal[]>();
  for (const goal of goals) {
    const groupKey = key === "directorate" ? normalizeDirectorate(goal[key]) : goal[key];
    map.set(groupKey, [...(map.get(groupKey) ?? []), goal]);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function normalizeDirectorate(value: string | null | undefined) {
  const normalized = clean(value).toLocaleLowerCase("id-ID");
  if (/marketing|commercial|sales/.test(normalized)) return "MARKETING DIRECTORATE";
  if (/legal|compliance/.test(normalized)) return "LEGAL DIRECTORATE";
  if (/hr|human|general|corporate|community/.test(normalized)) return "HRGS DIRECTORATE";
  if (/finance|audit|accounting|treasury|budget/.test(normalized)) return "FINANCE DIRECTORATE";
  return "OPERATION & HSE DIRECTORATE";
}

function matchesAchievement(value: number, range: string) {
  if (range === "Below 50%") return value < 50;
  if (range === "50%-74%") return value >= 50 && value < 75;
  if (range === "75%-99%") return value >= 75 && value < 100;
  if (range === "100%") return value === 100;
  if (range === "Above 100%") return value > 100;
  return true;
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function maxDate(values: Date[]) {
  return new Date(Math.max(...values.map((value) => value.getTime())));
}

function compare(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function smartLabel(key: string) {
  if (key === "timeBound") return "Time-bound";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function csvCell(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
