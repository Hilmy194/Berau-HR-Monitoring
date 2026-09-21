export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  HR_USER: "HR_USER",
  NEW_HIRE: "NEW_HIRE",
} as const;

export type RoleType = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABELS: Record<RoleType, string> = {
  [ROLE.SUPER_ADMIN]: "Super Admin",
  [ROLE.HR_ADMIN]: "Admin",
  [ROLE.MANAGER]: "Atasan",
  [ROLE.HR_USER]: "User HR",
  [ROLE.NEW_HIRE]: "New Hire",
};

export function isSuperAdmin(role?: string | null) {
  return role === ROLE.SUPER_ADMIN;
}

export function isAdmin(role?: string | null) {
  return role === ROLE.SUPER_ADMIN || role === ROLE.HR_ADMIN;
}

export function canAccessBackoffice(role?: string | null) {
  return role === ROLE.SUPER_ADMIN || role === ROLE.HR_ADMIN || role === ROLE.HR_USER;
}

export function getDefaultDestination(role?: string | null) {
  if (role === ROLE.SUPER_ADMIN || role === ROLE.HR_ADMIN) return "/admin";
  if (role === ROLE.HR_USER) return "/recruitment";
  if (role === ROLE.NEW_HIRE) return "/dashboard";
  return "/workspaces";
}

export function canAccessAdminPath(path: string, role?: string | null) {
  if (role === ROLE.SUPER_ADMIN) return true;
  if (role === ROLE.HR_ADMIN) {
    return !path.startsWith("/organization-development/goal-setting");
  }
  if (role === ROLE.HR_USER) {
    return [
      "/recruitment",
      "/admin/dashboard",
      "/admin/employees",
      "/admin/tasks",
      "/admin/presentations",
      "/admin/coaching",
      "/admin/reports",
    ].some((route) => path === route || path.startsWith(`${route}/`));
  }
  return false;
}
