import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canAccessWorkspace } from "@/lib/workspace-access";
import type { WorkspaceAccessLevel, WorkspaceKey } from "@/lib/workspaces";

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
  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

/** Use this at workspace boundaries; do not rely on a global role alone. */
export async function requireWorkspaceAccess(workspace: WorkspaceKey, minimum?: WorkspaceAccessLevel) {
  const session = await requireAuth();
  const allowed = await canAccessWorkspace(session.user.id, session.user.role, workspace, minimum);
  if (!allowed) redirect(session.user.role === "NEW_HIRE" ? "/dashboard" : session.user.role === "HR_ADMIN" ? "/admin" : "/workspaces");
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
