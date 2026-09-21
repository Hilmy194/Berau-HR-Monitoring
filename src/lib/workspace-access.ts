import { prisma } from "@/lib/prisma";
import { hasWorkspaceAccess, type WorkspaceAccessLevel, type WorkspaceKey } from "@/lib/workspaces";

export async function canAccessWorkspace(userId: string, role: string, workspace: WorkspaceKey, minimum?: WorkspaceAccessLevel) {
  const grants = await prisma.userWorkspaceAccess.findMany({
    where: { userId, isActive: true },
    select: { workspace: true, accessLevel: true, isActive: true },
  });

  return hasWorkspaceAccess(role, grants, workspace, minimum);
}
