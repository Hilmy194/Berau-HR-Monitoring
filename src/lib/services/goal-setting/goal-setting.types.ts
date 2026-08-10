export const GOAL_STATUSES = ["Not Started", "In Progress", "On Track", "At Risk", "Overdue", "Completed", "Cancelled"] as const;
export type GoalStatus = typeof GOAL_STATUSES[number];

export const SMART_KEYS = ["specific", "measurable", "achievable", "relevant", "timeBound"] as const;
export type SmartKey = typeof SMART_KEYS[number];

export type SmartEvaluation = Record<SmartKey, boolean> & {
  percentage: number;
  status: "Complete" | "Partial" | "Incomplete";
  missing: string[];
};

export type GoalCycle = {
  id: string;
  externalId: string;
  cycleName: string;
  startDate: Date;
  endDate: Date;
  status: "Upcoming" | "Active" | "Closed" | "Archived";
  source: "Entomo";
  lastSync: Date;
};

export type GoalProgressHistory = {
  id: string;
  goalId: string;
  progressDate: Date;
  previousActualValue: number;
  updatedActualValue: number;
  previousAchievement: number;
  updatedAchievement: number;
  progressDescription: string;
  updatedBy: string;
  source: "Entomo";
  syncDate: Date;
};

export type EmployeeGoal = {
  id: string;
  externalId: string;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  position: string;
  directorate: string;
  division: string;
  department: string;
  managerId: string;
  managerName: string;
  workLocation: string;
  cycleId: string;
  goalCycle: string;
  title: string;
  description: string;
  expectedOutcome?: string;
  category: string;
  organizationObjective?: string;
  departmentObjective?: string;
  baselineValue?: number;
  supportingInformation?: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  achievement: number;
  weight: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: GoalStatus;
  startDate: Date;
  dueDate: Date;
  completionDate?: Date;
  smart?: Partial<Record<SmartKey, boolean>>;
  source: "Entomo";
  sourceUpdatedAt: Date;
  lastSyncedAt: Date;
  entomoUrl: string;
  history: GoalProgressHistory[];
};

export type EmployeeGoalSummary = {
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  position: string;
  directorate: string;
  division: string;
  department: string;
  managerName: string;
  workLocation: string;
  goalCycle: string;
  totalGoals: number;
  totalWeight: number;
  averageAchievement: number;
  completedGoals: number;
  inProgressGoals: number;
  atRiskGoals: number;
  overdueGoals: number;
  completionRate: number;
  smartCompliance: number;
  overallStatus: GoalStatus;
  lastSync: Date;
  latestGoalUpdate: Date;
  entomoUrl: string;
};

export type PatFieldValue = {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  score?: number;
  weight?: number;
  remark?: string;
  strategyPillarName?: string;
  reviewPeriod?: string;
  levels?: {
    l1: string;
    l2: string;
    l3: string;
    l4: string;
    l5: string;
  };
};

export type PatSection = {
  id: string;
  title: string;
  description?: string;
  fields: PatFieldValue[];
};

export type ScorecardKpiSetting = {
  id: string;
  strategyPillarName: string;
  goalName: string;
  goalDescription: string;
  reviewPeriod: "Monthly" | "Quarterly" | "Half Yearly" | "Once";
  uom: string;
  weight: number;
  levels: {
    l1: string;
    l2: string;
    l3: string;
    l4: string;
    l5: string;
  };
};

export type Feedback360Comment = {
  reviewerGroup: "Manager" | "Peer" | "Subordinate" | "Self" | "HR";
  comment: string;
  submittedAt: Date;
};

export type Feedback360 = {
  strengths: string[];
  weaknesses: string[];
  comments: Feedback360Comment[];
};

export type SilPatAssessment = {
  id: string;
  externalId: string;
  employeeId: string;
  employeeName: string;
  year: number;
  patName: string;
  cycleName: string;
  status: "Reviewed" | "In Progress" | "Complete";
  finalScore: number;
  performanceRating: string;
  dynamicSections: PatSection[];
  feedback360: Feedback360;
  sourceSystem: "SIL/PAT";
  sourceUpdatedAt: Date;
  lastSyncedAt: Date;
};

export type GoalSettingFilters = {
  q?: string;
  employeeName?: string;
  employeeId?: string;
  directorate?: string;
  division?: string;
  department?: string;
  position?: string;
  manager?: string;
  cycle?: string;
  year?: string;
  status?: string;
  strategyPillar?: string;
  reviewPeriod?: string;
  smartStatus?: string;
  achievementRange?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  lastSyncFrom?: string;
  lastSyncTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
};

export type GoalSyncLog = {
  id: string;
  sourceSystem: "Entomo";
  syncType: "Manual" | "Scheduled" | "Retry";
  syncStartedAt: Date;
  syncFinishedAt: Date;
  status: "Pending" | "Running" | "Success" | "Partial Success" | "Failed";
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
  durationMs: number;
};
