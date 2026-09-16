import { requireWorkspaceAccess } from "@/lib/session";
import { WORKSPACE } from "@/lib/workspaces";

export default async function LearningWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspaceAccess(WORKSPACE.LEARNING);
  return children;
}
