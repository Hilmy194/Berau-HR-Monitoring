import { requireWorkspaceAccess } from "@/lib/session";
import { WORKSPACE } from "@/lib/workspaces";

export default async function RetireWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspaceAccess(WORKSPACE.RETIRE);
  return children;
}
