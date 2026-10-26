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
    id: "dashboard",
    label: "Dashboard Monitoring",
    href: "/dashboard-monitoring",
    description: "Executive monitoring seluruh karyawan: demografi, onboarding, OD, talent, learning, dan pensiun.",
    icon: "LayoutDashboard",
    submenus: [
      { id: "dashboard:demographics", label: "Demografi & Karyawan", href: "/dashboard-monitoring", icon: "Users" },
      { id: "dashboard:onboarding", label: "Onboarding", href: "/dashboard-monitoring/onboarding", icon: "BriefcaseBusiness" },
      { id: "dashboard:od", label: "Organization Development", href: "/dashboard-monitoring/organization-development", icon: "Network" },
      { id: "dashboard:talent", label: "Talent Management", href: "/dashboard-monitoring/talent", icon: "UsersRound" },
      { id: "dashboard:learning", label: "Learning & Development", href: "/dashboard-monitoring/learning", icon: "GraduationCap" },
      { id: "dashboard:retire", label: "Retirement", href: "/dashboard-monitoring/retire", icon: "Hourglass" },
    ],
  },
  {
    id: "onboarding",
    label: "Onboarding (Probation Monitoring)",
    href: "/recruitment",
    description: "Probation monitoring, karyawan baru, task, presentation, coaching, report",
    icon: "BriefcaseBusiness",
    submenus: [
      { id: "onboarding:overview", label: "Onboarding Overview", href: "/recruitment", icon: "BriefcaseBusiness" },
      { id: "onboarding:recruitment", label: "Rekrutmen", href: "/admin/recruitment", icon: "UserPlus" },
      { id: "onboarding:employees", label: "Probation Employees", href: "/admin/employees", icon: "UserRoundCheck" },
      { id: "onboarding:presentations", label: "Presentation", href: "/admin/presentations", icon: "Presentation" },
      { id: "onboarding:tasks", label: "Task Management", href: "/admin/tasks", icon: "ListChecks" },
      { id: "onboarding:coaching", label: "Coaching", href: "/admin/coaching", icon: "MessagesSquare" },
      { id: "onboarding:notifications", label: "Notification", href: "/recruitment/notifications", icon: "BellRing" },
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
 * Returns default permitted routes for a given role when allowedRoutes is null (unrestricted default).
 */
export function getDefaultRoutesForRole(role?: string | null): string[] {
  if (role === "SUPER_ADMIN") {
    return MENU_CATALOGUE.flatMap((w) => w.submenus.map((s) => s.href));
  }
  if (role === "HR_ADMIN") {
    return MENU_CATALOGUE.flatMap((w) =>
      w.submenus
        .filter(
          (s) =>
            s.href !== "/organization-development/goal-setting" &&
            s.href !== "/talent/talent-monitoring"
        )
        .map((s) => s.href)
    );
  }
  if (role === "HR_USER") {
    const onboarding = MENU_CATALOGUE.find((w) => w.id === "onboarding");
    return onboarding ? onboarding.submenus.map((s) => s.href) : [];
  }
  return [];
}

/**
 * Checks if a specific route is permitted for a user given their role and allowedRoutes.
 * - SUPER_ADMIN always has full access.
 * - If allowedRoutes is null or undefined, default role-based rules apply.
 * - If allowedRoutes is an array of strings, user is strictly permitted only to those hrefs or submenu ids.
 *   Submenu hierarchy resolution ensures that base overview routes (e.g. /talent) do NOT
 *   accidentally grant access to sibling submenus (e.g. /talent/promotion) that were not granted.
 */
export function isRoutePermitted(
  pathname: string,
  role?: string | null,
  allowedRoutes?: string[] | null
): boolean {
  if (role === "SUPER_ADMIN") return true;

  // If no explicit allowedRoutes array is configured, fallback to standard role permissions
  if (allowedRoutes === null || allowedRoutes === undefined) {
    if (role === "HR_ADMIN") {
      return (
        !pathname.startsWith("/organization-development/goal-setting") &&
        !pathname.startsWith("/talent/talent-monitoring")
      );
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

  // Normalize path (strip query params and trailing slash)
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  // Global portal routes accessible to backoffice users
  if (cleanPath === "/admin" || cleanPath === "/workspaces" || cleanPath === "/account") {
    return true;
  }

  const allSubMenus = getAllSubMenuItems();

  // Find all registered submenus that match cleanPath (either exact or prefix for child pages)
  // Sort descending by length so the most specific registered submenu comes first.
  // Example: cleanPath "/talent/promotion" matches "/talent" (length 7) and "/talent/promotion" (length 17).
  // The most specific match is "/talent/promotion", so permission is governed strictly by that submenu,
  // preventing a general "/talent" overview permission from leaking into blocked submenus.
  const matchingSubs = allSubMenus
    .filter((s) => cleanPath === s.href || cleanPath.startsWith(`${s.href}/`))
    .sort((a, b) => b.href.length - a.href.length);

  if (matchingSubs.length > 0) {
    const mostSpecificSub = matchingSubs[0];
    return (
      allowedRoutes.includes(mostSpecificSub.href) ||
      allowedRoutes.includes(mostSpecificSub.id)
    );
  }

  // If the path does not match any registered submenu in the catalogue,
  // check if it directly matches any path or prefix explicitly defined in allowedRoutes
  return allowedRoutes.some((routeOrId) => {
    return cleanPath === routeOrId || cleanPath.startsWith(`${routeOrId}/`);
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
  const target = workspaceId.toLowerCase();
  const workspace = MENU_CATALOGUE.find(
    (w) => w.id.toLowerCase() === target || w.href.toLowerCase() === target
  );
  if (!workspace) return false;

  if (allowedRoutes === null || allowedRoutes === undefined) {
    if (role === "HR_ADMIN") return true;
    if (role === "HR_USER") return workspace.id === "onboarding" || workspace.id === "dashboard";
    return false;
  }

  return workspace.submenus.some((sub) => isRoutePermitted(sub.href, role, allowedRoutes));
}
