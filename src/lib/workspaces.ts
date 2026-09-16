import { NAV_ITEMS } from "@/lib/constants";

/**
 * The single catalogue for product workspaces. Route protection, navigation
 * and future access-management screens must use this definition instead of
 * maintaining separate hard-coded lists.
 */
export const WORKSPACE = {
  ONBOARDING: "ONBOARDING",
  ORGANIZATION_DEVELOPMENT: "ORGANIZATION_DEVELOPMENT",
  TALENT: "TALENT",
  LEARNING: "LEARNING",
  RETIRE: "RETIRE",
  PROBATION: "PROBATION",
} as const;

export type WorkspaceKey = (typeof WORKSPACE)[keyof typeof WORKSPACE];
export type WorkspaceAccessLevel = "VIEWER" | "EDITOR" | "ADMIN";

type WorkspaceDefinition = {
  key: WorkspaceKey;
  label: string;
  description: string;
  routes: readonly string[];
  navigation: readonly { label: string; href: string; icon: string }[];
};

export const HR_WORKSPACES: readonly WorkspaceDefinition[] = [
  {
    key: WORKSPACE.ONBOARDING,
    label: "Onboarding",
    description: "Probation monitoring & onboarding transition",
    routes: ["/recruitment", "/admin/dashboard", "/admin/employees", "/admin/tasks", "/admin/presentations", "/admin/coaching", "/admin/reports"],
    navigation: NAV_ITEMS.recruitment,
  },
  {
    key: WORKSPACE.ORGANIZATION_DEVELOPMENT,
    label: "Organization Development",
    description: "Structure, competencies & job architecture",
    routes: ["/organization-development"],
    navigation: NAV_ITEMS.organizationDevelopment,
  },
  {
    key: WORKSPACE.TALENT,
    label: "Talent",
    description: "Promotion, mobility, gap & talent cards",
    routes: ["/talent", "/admin/employee-management", "/admin/talent-development"],
    navigation: NAV_ITEMS.talentModule,
  },
  {
    key: WORKSPACE.LEARNING,
    label: "Learning",
    description: "IDP, training & development recommendation",
    routes: ["/learning"],
    navigation: NAV_ITEMS.learning,
  },
  {
    key: WORKSPACE.RETIRE,
    label: "Retire",
    description: "Retirement monitoring & workforce transition",
    routes: ["/retire"],
    navigation: NAV_ITEMS.retire,
  },
] as const;

export const PROBATION_WORKSPACE: WorkspaceDefinition = {
  key: WORKSPACE.PROBATION,
  label: "My Probation",
  description: "100-day onboarding, task, coaching & presentation",
  routes: ["/dashboard", "/tasks", "/presentation", "/coaching", "/notifications", "/profile"],
  navigation: NAV_ITEMS.employee,
};

export function getWorkspaceForPath(pathname: string) {
  return HR_WORKSPACES.find((workspace) =>
    workspace.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

export function hasWorkspaceAccess(
  role: string,
  grants: Array<{ workspace: string; accessLevel: string; isActive: boolean }>,
  workspace: WorkspaceKey,
  minimum: WorkspaceAccessLevel = "VIEWER"
) {
  if (role === "HR_ADMIN") return true;
  if (role === "NEW_HIRE") return workspace === WORKSPACE.PROBATION;

  // Workspace-specific grants are reserved for a future HR user role. The
  // active product roles are deliberately limited to HR_ADMIN and NEW_HIRE.
  const levels: WorkspaceAccessLevel[] = ["VIEWER", "EDITOR", "ADMIN"];
  const grant = grants.find((item) => item.workspace === workspace && item.isActive);
  return !!grant && levels.indexOf(grant.accessLevel as WorkspaceAccessLevel) >= levels.indexOf(minimum);
}
