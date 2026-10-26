import { GraduationCap, BookOpenCheck, ClipboardList, CheckCircle2, MessagesSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLearningDashboardMetrics } from "@/lib/services/dashboard-analytics.service";
import { LearningCharts } from "./learning-charts";

export const metadata = {
  title: "Dashboard Learning & Development - Harmoni",
};

export default async function DashboardMonitoringLearningPage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring/learning", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const data = await getLearningDashboardMetrics();

  const completedIdp = data.statusDistribution.find((s) => s.name === "Completed")?.value || 0;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Modul"
        title="Learning &amp; Development"
        description="Monitoring implementasi Individual Development Plan (IDP), kerangka pembelajaran 70:20:10, serta siklus tata kelola Coaching Governance."
        icon={GraduationCap}
        className="w-full"
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalMonitored}</p>
              <p className="text-xs text-muted-foreground">Total Aktivitas IDP</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedIdp}</p>
              <p className="text-xs text-muted-foreground">IDP Selesai (Completed)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <MessagesSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalCoachingSessions}</p>
              <p className="text-xs text-muted-foreground">Total Sesi Coaching Governance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.coachingGovernanceCycles}</p>
              <p className="text-xs text-muted-foreground">Siklus Program Coaching</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Charts Component */}
      <LearningCharts
        statusDistribution={data.statusDistribution}
        activityTypeDistribution={data.activityTypeDistribution}
      />

      {/* 70:20:10 Development Model Highlights */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Pilar Kerangka Pembelajaran 70 : 20 : 10</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Standar pengembangan kompetensi human capital PT Berau Coal berbasis proporsi aktivitas.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {data.activityTypeDistribution.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {item.percentage}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{item.description}</p>
              <div className="mt-3">
                <Progress value={item.percentage} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
