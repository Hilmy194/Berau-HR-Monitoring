import { requireAuth } from "@/lib/session";
import { AdminRouteFrame } from "@/components/shell/admin-route-frame";

export default async function HrModulesLayout({ children }: { children: React.ReactNode }) {
  // Route-level workspace checks happen in AdminRouteFrame. This layout only
  // establishes authentication for all five HR workspaces.
  const session = await requireAuth();
  return <AdminRouteFrame user={session.user}>{children}</AdminRouteFrame>;
}
