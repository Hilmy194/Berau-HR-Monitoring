import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";

export const metadata = { title: "Admin Dashboard — Harmoni" };

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  if (isRoutePermitted("/dashboard-monitoring/onboarding", session.user.role, session.user.allowedRoutes)) {
    redirect("/dashboard-monitoring/onboarding");
  }
  redirect("/recruitment");
}
