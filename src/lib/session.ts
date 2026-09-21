import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canAccessWorkspace } from "@/lib/workspace-access";
import type { WorkspaceAccessLevel, WorkspaceKey } from "@/lib/workspaces";
import { ROLE, canAccessBackoffice, getDefaultDestination, isAdmin } from "@/lib/roles";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  // next/navigation is intentionally typed as `never`; keep the non-null
  // contract explicit for server callers and for isolated type checks.
  return session as NonNullable<typeof session>;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdmin(session.user.role)) {
    redirect(getDefaultDestination(session.user.role));
  }
  return session;
}

export async function requireBackoffice() {
  const session = await requireAuth();
  if (!canAccessBackoffice(session.user.role)) {
    redirect(getDefaultDestination(session.user.role));
  }
  return session;
}

/** Use this at workspace boundaries; do not rely on a global role alone. */
export async function requireWorkspaceAccess(workspace: WorkspaceKey, minimum?: WorkspaceAccessLevel) {
  const session = await requireAuth();
  const allowed = await canAccessWorkspace(session.user.id, session.user.role, workspace, minimum);
  if (!allowed) redirect(getDefaultDestination(session.user.role));
  return session;
}

export async function requireGoalSettingAccess() {
  const session = await requireWorkspaceAccess("ORGANIZATION_DEVELOPMENT");
  if (session.user.role !== ROLE.SUPER_ADMIN) {
    redirect("/organization-development");
  }
  return session;
}

export async function getCurrentProfile() {
  const session = await requireAuth();
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    redirect("/profile/setup");
  }
  return { session, profile };
}
