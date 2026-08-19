export const ROLE = {
  NEW_HIRE: "NEW_HIRE",
  HR_ADMIN: "HR_ADMIN",
} as const;

export type RoleType = (typeof ROLE)[keyof typeof ROLE];

export const GENDER = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export const PROBATION_STATUS = {
  ACTIVE: "ACTIVE",
  PASSED: "PASSED",
  FAILED: "FAILED",
  EXTENDED: "EXTENDED",
} as const;

export const TASK_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export const RESULT_STATUS = {
  SCHEDULED: "SCHEDULED",
  PASSED: "PASSED",
  FAILED: "FAILED",
  EXTENDED: "EXTENDED",
} as const;

export const RECOMMENDATION = {
  PASSED: "PASSED",
  FAILED: "FAILED",
  EXTENDED: "EXTENDED",
} as const;

export const PROBATION_DURATION_DAYS = 100;

/**
 * Number of days added to the probation end date when an employee receives an
 * "EXTENDED" recommendation. Centralised here so the business rule has a
 * single source of truth (used by the employee service when applying a final
 * result, and surfaced in the HR score dialog label).
 */
export const PROBATION_EXTENSION_DAYS = 30;

export const DIRECTORATES = [
  "MARKETING DIRECTORATE",
  "OPERATION & HSE DIRECTORATE",
  "LEGAL DIRECTORATE",
  "HRGS DIRECTORATE",
  "FINANCE DIRECTORATE",
] as const;

export type Directorate = (typeof DIRECTORATES)[number];

/**
 * Canonical list of departments used by every dropdown/filter in the app.
 * Keeping it in one place avoids the same hardcoded array drifting out of
 * sync across components.
 */
export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Human Resources",
  "Operations",
] as const;

/** Selectable probation-status values (matches PROBATION_STATUS). */
export const PROBATION_STATUS_OPTIONS = Object.values(PROBATION_STATUS);

/** Selectable task-status values (matches TASK_STATUS). */
export const TASK_STATUS_OPTIONS = Object.values(TASK_STATUS);

/** Selectable presentation result-status values (matches RESULT_STATUS). */
export const RESULT_STATUS_OPTIONS = Object.values(RESULT_STATUS);

/**
 * Human-readable labels for status enums, used in dropdowns and badges. The
 * shared values (PASSED / FAILED / EXTENDED) deliberately appear once because
 * they share the same label across probation and presentation contexts.
 */
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PASSED: "Passed",
  FAILED: "Failed",
  EXTENDED: "Extended",
  SCHEDULED: "Scheduled",
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const NAV_ITEMS = {
  employee: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Notifications", href: "/notifications", icon: "BellRing" },
    { label: "Probation Tasks", href: "/tasks", icon: "ListChecks" },
    { label: "Presentation", href: "/presentation", icon: "Presentation" },
    { label: "Coaching", href: "/coaching", icon: "UserCog" },
    { label: "My Profile", href: "/profile/edit", icon: "UserCircle" },
  ],
  admin: [
    { label: "Onboarding", href: "/recruitment", icon: "BriefcaseBusiness" },
    { label: "Organization Development", href: "/organization-development", icon: "Network" },
    { label: "Talent", href: "/talent", icon: "UsersRound" },
    { label: "Learning", href: "/learning", icon: "GraduationCap" },
    { label: "Retire", href: "/retire", icon: "Hourglass" },
  ],
  recruitment: [
    { label: "Onboarding Overview", href: "/recruitment", icon: "BriefcaseBusiness" },
    { label: "Notifications", href: "/recruitment/notifications", icon: "BellRing" },
    { label: "Dashboard", href: "/recruitment/probation-monitoring", icon: "LayoutDashboard" },
    { label: "Probation Employees", href: "/admin/employees", icon: "UserRoundCheck" },
    { label: "Task Management", href: "/admin/tasks", icon: "ListChecks" },
    { label: "Presentations", href: "/admin/presentations", icon: "Presentation" },
    { label: "Coaching", href: "/admin/coaching", icon: "MessagesSquare" },
    { label: "Reports", href: "/admin/reports", icon: "FileBarChart" },
  ],
  organizationDevelopment: [
    { label: "OD Overview", href: "/organization-development", icon: "Network" },
    { label: "Struktur Organisasi", href: "/organization-development/organization-structure", icon: "Building" },
    { label: "Competencies", href: "/organization-development/skills", icon: "BookOpenCheck" },
    { label: "Job Descriptions", href: "/organization-development/job-descriptions", icon: "FileText" },
    { label: "Goal Setting", href: "/organization-development/goal-setting", icon: "Target" },
  ],
  talentModule: [
    { label: "Talent Overview", href: "/talent", icon: "UsersRound" },
    { label: "Promotion", href: "/talent/promotion", icon: "ChartNoAxesCombined" },
    { label: "Development Program", href: "/talent/development-program", icon: "GraduationCap" },
    { label: "Mobility", href: "/talent/rotation", icon: "RotateCcw" },
    { label: "Current Gap / Skill Needs", href: "/talent/gap", icon: "GitCompareArrows" },
    { label: "Talent Dictionary", href: "/admin/employee-management", icon: "UsersRound" },
  ],
  learning: [
    { label: "Learning Overview", href: "/learning", icon: "GraduationCap" },
    { label: "IDP Progress Monitoring", href: "/learning/idp", icon: "BookOpenCheck" },
    { label: "Coaching Governance", href: "/learning/coaching-governance", icon: "ClipboardList" },
  ],
  retire: [
    { label: "Retire Overview", href: "/retire", icon: "Hourglass" },
    { label: "Notifications", href: "/retire/notifications", icon: "BellRing" },
    { label: "Retirement Monitoring", href: "/retire/retirement-monitoring", icon: "ClipboardList" },
  ],
} as const;

/** Harmoni color palette (hex + HSL tokens) */
export const BERAU_PALETTE = {
  primary: "#6DD13B",
  primaryHsl: "100 62% 53%",
  secondary: "#2F8F22",
  secondaryHsl: "113 62% 35%",
  dark: "#0b0b0b",
  light: "#ffffff",
} as const;

export const TALENT_AI = {
  promptVersion: "talent-ai-v1",
  dataVersion: "profile-talentData-v1",
  maxCandidates: Number(process.env.AI_MAX_CANDIDATES ?? 5),
  maxInputSize: Number(process.env.AI_MAX_INPUT_SIZE ?? 24_000),
  requestTimeout: Number(process.env.AI_REQUEST_TIMEOUT ?? 45_000),
  rankingWeights: {
    skillMatch: 0.45,
    mandatoryCoverage: 0.2,
    relevantExperience: 0.15,
    performance: 0.1,
    potentialReadiness: 0.1,
  },
} as const;

export const TALENT_AI_REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED_AS_REFERENCE: "APPROVED_AS_REFERENCE",
  REJECTED: "REJECTED",
  NEEDS_REVISION: "NEEDS_REVISION",
} as const;
