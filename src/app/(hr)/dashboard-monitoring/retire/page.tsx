import { Hourglass, AlertTriangle, Clock4, CheckCircle2, UserCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getRetirementDashboardMetrics } from "@/lib/services/dashboard-analytics.service";
import { RetireCharts } from "./retire-charts";

export const metadata = {
  title: "Dashboard Retirement - Harmoni",
};

export default async function DashboardMonitoringRetirePage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring/retire", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const data = await getRetirementDashboardMetrics();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Modul"
        title="Retirement &amp; Workforce Transition"
        description="Monitoring proyeksi transisi usia pensiun karyawan: horizon kritis (< 2 tahun), peringatan (2 - 5 tahun), perpanjangan kontrak (PKWT), dan pemetaan NIK / Business Unit baru."
        icon={Hourglass}
        className="w-full"
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalPipeline}</p>
              <p className="text-xs text-muted-foreground">Total Pipeline Pensiun</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.criticalCount}</p>
              <p className="text-xs text-muted-foreground">Kritis (&lt; 2 Tahun)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock4 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.warningCount}</p>
              <p className="text-xs text-muted-foreground">Warning (2 - 5 Tahun)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.extendedContractsCount}</p>
              <p className="text-xs text-muted-foreground">Perpanjangan Kontrak (PKWT)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.newNikAssignedCount}</p>
              <p className="text-xs text-muted-foreground">NIK &amp; Unit Baru Terisi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retire Charts Component */}
      <RetireCharts
        statusDistribution={data.statusDistribution}
        byYearProjection={data.byYearProjection}
      />
    </div>
  );
}
