import { requireWorkspaceAccess } from "@/lib/session";
import { WORKSPACE } from "@/lib/workspaces";

export default async function TalentWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspaceAccess(WORKSPACE.TALENT);
  return children;
}
