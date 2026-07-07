import { requireAdmin } from "@/lib/session";
import { AdminRouteFrame } from "@/components/shell/admin-route-frame";

export default async function HrModulesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <AdminRouteFrame user={session.user}>{children}</AdminRouteFrame>;
}
