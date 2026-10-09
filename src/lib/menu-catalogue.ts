export interface SubMenuItem {
  id: string; // unique identifier e.g. "onboarding:tasks", "talent:promotion"
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

export interface WorkspaceMenuItem {
  id: string; // "onboarding", "od", "talent", "learning", "retire"
  label: string;
  href: string;
  description: string;
  icon: string;
  submenus: SubMenuItem[];
}

export const MENU_CATALOGUE: WorkspaceMenuItem[] = [
  {
    id: "onboarding",
    label: "Onboarding (Probation Monitoring)",
    href: "/recruitment",
    description: "Probation monitoring, karyawan baru, task, presentation, coaching, report",
    icon: "BriefcaseBusiness",
    submenus: [
      { id: "onboarding:overview", label: "Onboarding Overview", href: "/recruitment", icon: "BriefcaseBusiness" },
      { id: "onboarding:recruitment", label: "Rekrutmen", href: "/admin/recruitment", icon: "UserPlus" },
      { id: "onboarding:notifications", label: "Notifications", href: "/recruitment/notifications", icon: "BellRing" },
      { id: "onboarding:dashboard", label: "Dashboard Monitoring", href: "/recruitment/probation-monitoring", icon: "LayoutDashboard" },
      { id: "onboarding:employees", label: "Probation Employees", href: "/admin/employees", icon: "UserRoundCheck" },
      { id: "onboarding:tasks", label: "Task Management", href: "/admin/tasks", icon: "ListChecks" },
      { id: "onboarding:presentations", label: "Presentations", href: "/admin/presentations", icon: "Presentation" },
      { id: "onboarding:coaching", label: "Coaching", href: "/admin/coaching", icon: "MessagesSquare" },
      { id: "onboarding:reports", label: "Reports", href: "/admin/reports", icon: "FileBarChart" },
    ],
  },
  {
    id: "od",
    label: "Organization Development (OD)",
    href: "/organization-development",
    description: "Struktur organisasi, competencies, job description, goal setting",
    icon: "Network",
    submenus: [
      { id: "od:overview", label: "OD Overview", href: "/organization-development", icon: "Network" },
      { id: "od:structure", label: "Struktur Organisasi", href: "/organization-development/organization-structure", icon: "Building" },
      { id: "od:skills", label: "Competencies", href: "/organization-development/skills", icon: "BookOpenCheck" },
      { id: "od:job-descriptions", label: "Job Descriptions", href: "/organization-development/job-descriptions", icon: "FileText" },
      { id: "od:goal-setting", label: "Goal Setting", href: "/organization-development/goal-setting", icon: "Target" },
    ],
  },
  {
    id: "talent",
    label: "Talent Management",
    href: "/talent",
    description: "Promotion, development program, mobility, career path, current gap, dictionary",
    icon: "UsersRound",
    submenus: [
      { id: "talent:overview", label: "Talent Overview", href: "/talent", icon: "UsersRound" },
      { id: "talent:monitoring", label: "Talent Monitoring", href: "/talent/talent-monitoring", icon: "ShieldCheck" },
      { id: "talent:promotion", label: "Promotion", href: "/talent/promotion", icon: "ChartNoAxesCombined" },
      { id: "talent:development-program", label: "Development Program (DP)", href: "/talent/development-program", icon: "GraduationCap" },
      { id: "talent:rotation", label: "Mobility / Rotation", href: "/talent/rotation", icon: "RotateCcw" },
      { id: "talent:career-path", label: "Career Path", href: "/talent/career-path", icon: "Milestone" },
      { id: "talent:gap", label: "Current Gap / Skill Needs", href: "/talent/gap", icon: "GitCompareArrows" },
      { id: "talent:dictionary", label: "Talent Dictionary", href: "/admin/employee-management", icon: "UsersRound" },
    ],
  },
  {
    id: "learning",
    label: "Learning & Development",
    href: "/learning",
    description: "IDP progress, coaching governance, program pelatihan",
    icon: "GraduationCap",
    submenus: [
      { id: "learning:overview", label: "Learning Overview", href: "/learning", icon: "GraduationCap" },
      { id: "learning:idp", label: "IDP Progress Monitoring", href: "/learning/idp", icon: "BookOpenCheck" },
      { id: "learning:coaching-governance", label: "Coaching Governance", href: "/learning/coaching-governance", icon: "ClipboardList" },
    ],
  },
  {
    id: "retire",
    label: "Retire (Pensiun)",
    href: "/retire",
    description: "Monitoring pensiun, remaining time, workforce transition",
    icon: "Hourglass",
    submenus: [
      { id: "retire:overview", label: "Retire Overview", href: "/retire", icon: "Hourglass" },
      { id: "retire:notifications", label: "Notifications", href: "/retire/notifications", icon: "BellRing" },
      { id: "retire:monitoring", label: "Retirement Monitoring", href: "/retire/retirement-monitoring", icon: "ClipboardList" },
    ],
  },
];

/**
 * Returns all submenu items flat.
 */
export function getAllSubMenuItems(): SubMenuItem[] {
  return MENU_CATALOGUE.flatMap((w) => w.submenus);
}

/**
 * Checks if a specific route is permitted for a user given their role and allowedRoutes.
 * - SUPER_ADMIN always has full access.
 * - If allowedRoutes is null/undefined or empty, default role-based rules apply.
 * - If allowedRoutes is an array of strings, user is strictly permitted only to those hrefs or submenu ids.
 */
export function isRoutePermitted(
  pathname: string,
  role?: string | null,
  allowedRoutes?: string[] | null
): boolean {
  if (role === "SUPER_ADMIN") return true;

  // If no explicit allowedRoutes array is configured, fallback to standard role permissions
  if (!allowedRoutes || !Array.isArray(allowedRoutes) || allowedRoutes.length === 0) {
    if (role === "HR_ADMIN") {
      return !pathname.startsWith("/organization-development/goal-setting");
    }
    if (role === "HR_USER") {
      return pathname.startsWith("/recruitment") || pathname.startsWith("/admin");
    }
    if (role === "NEW_HIRE") {
      return ["/dashboard", "/tasks", "/presentation", "/coaching", "/notifications", "/profile"].some(
        (r) => pathname === r || pathname.startsWith(`${r}/`)
      );
    }
    return true;
  }

  // If allowedRoutes array exists, match exact path or prefix or submenu id
  return allowedRoutes.some((routeOrId) => {
    // Check if matching submenu id e.g. "talent:promotion"
    const sub = getAllSubMenuItems().find((s) => s.id === routeOrId || s.href === routeOrId);
    if (sub) {
      return pathname === sub.href || pathname.startsWith(`${sub.href}/`);
    }
    return pathname === routeOrId || pathname.startsWith(`${routeOrId}/`);
  });
}

/**
 * Checks if a whole workspace has at least 1 permitted submenu.
 */
export function isWorkspacePermitted(
  workspaceId: string,
  role?: string | null,
  allowedRoutes?: string[] | null
): boolean {
  if (role === "SUPER_ADMIN") return true;
  const workspace = MENU_CATALOGUE.find((w) => w.id === workspaceId || w.href === workspaceId);
  if (!workspace) return false;

  if (!allowedRoutes || !Array.isArray(allowedRoutes) || allowedRoutes.length === 0) {
    if (role === "HR_ADMIN") return true;
    if (role === "HR_USER") return workspace.id === "onboarding";
    return false;
  }

  return workspace.submenus.some((sub) => isRoutePermitted(sub.href, role, allowedRoutes));
}
