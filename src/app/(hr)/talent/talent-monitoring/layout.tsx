import { requireTalentMonitoringAccess } from "@/lib/session";

export default async function TalentMonitoringLayout({ children }: { children: React.ReactNode }) {
  await requireTalentMonitoringAccess();
  return children;
}
