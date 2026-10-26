import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";

export default async function ProbationMonitoringPageRedirect() {
  const session = await requireAuth();
  if (isRoutePermitted("/dashboard-monitoring/onboarding", session.user.role, session.user.allowedRoutes)) {
    redirect("/dashboard-monitoring/onboarding");
  }
  redirect("/recruitment");
}
