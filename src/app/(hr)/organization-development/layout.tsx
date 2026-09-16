import { requireWorkspaceAccess } from "@/lib/session";
import { WORKSPACE } from "@/lib/workspaces";

export default async function OrganizationDevelopmentWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspaceAccess(WORKSPACE.ORGANIZATION_DEVELOPMENT);
  return children;
}
