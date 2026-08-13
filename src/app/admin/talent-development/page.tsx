import { requireAdmin } from "@/lib/session";
import { listTalentDevelopmentCandidates } from "@/lib/services/talent-development.service";
import { TalentDevelopmentWorkspace } from "@/components/admin/talent-development-workspace";

export const metadata = { title: "Talent Development & IDP - Harmoni" };

export default async function TalentDevelopmentPage() {
  await requireAdmin();
  const candidates = await listTalentDevelopmentCandidates();

  return <TalentDevelopmentWorkspace candidates={candidates} />;
}
