import { prisma } from "@/lib/prisma";
import { hasWorkspaceAccess, type WorkspaceAccessLevel, type WorkspaceKey } from "@/lib/workspaces";

export async function canAccessWorkspace(userId: string, role: string, workspace: WorkspaceKey, minimum?: WorkspaceAccessLevel) {
  // Current authorization model has only two active roles.  Do this before
  // querying workspace grants so a Super Admin can use the application even
  // while the optional per-workspace table has not been deployed yet.
  if (role === "HR_ADMIN") return true;
  if (role === "NEW_HIRE") return workspace === "PROBATION";

  const grants = await prisma.userWorkspaceAccess.findMany({
    where: { userId, isActive: true },
    select: { workspace: true, accessLevel: true, isActive: true },
  });

  return hasWorkspaceAccess(role, grants, workspace, minimum);
}
