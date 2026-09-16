import { requireWorkspaceAccess } from "@/lib/session";
import { WORKSPACE } from "@/lib/workspaces";

export default async function OnboardingWorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspaceAccess(WORKSPACE.ONBOARDING);
  return children;
}
