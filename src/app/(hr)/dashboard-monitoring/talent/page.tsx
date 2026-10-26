import { UsersRound, ChartNoAxesCombined, GraduationCap, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getTalentDashboardMetrics } from "@/lib/services/dashboard-analytics.service";
import { TalentCharts } from "./talent-charts";

export const metadata = {
  title: "Dashboard Talent Management - Harmoni",
};

export default async function DashboardMonitoringTalentPage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring/talent", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const data = await getTalentDashboardMetrics();

  const readyNow = data.readinessDistribution.find((r) => r.name === "Ready Now")?.value || 0;
  const highPotential = data.nineBoxDistribution
    .filter((b) => b.category === "High")
    .reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Modul"
        title="Talent Management"
        description="Monitoring pemetaan talenta (9-box / 12-box), kesiapan suksesi promosi, program percepatan karir, serta kebutuhan penutupan gap kompetensi."
        icon={UsersRound}
        className="w-full"
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalCandidates}</p>
              <p className="text-xs text-muted-foreground">Kandidat Talent Pool</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ChartNoAxesCombined className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{readyNow}</p>
              <p className="text-xs text-muted-foreground">Ready Now Suksesi</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.developmentProgramCount}</p>
              <p className="text-xs text-muted-foreground">Development Program (DP/XDP)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{highPotential}</p>
              <p className="text-xs text-muted-foreground">Talenta High Potential / Star</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Talent Charts Component */}
      <TalentCharts
        nineBoxDistribution={data.nineBoxDistribution}
        readinessDistribution={data.readinessDistribution}
        topSkillGaps={data.topSkillGaps}
      />
    </div>
  );
}
