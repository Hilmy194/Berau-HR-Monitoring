import { Network, Building, BookOpenCheck, FileText, FileCheck2 } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getOdDashboardMetrics } from "@/lib/services/dashboard-analytics.service";
import { OdCharts } from "./od-charts";

export const metadata = {
  title: "Dashboard Organization Development - Harmoni",
};

export default async function DashboardMonitoringOdPage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring/organization-development", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const data = await getOdDashboardMetrics();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Modul"
        title="Organization Development (OD)"
        description="Monitoring struktur organisasi, standardisasi posisi jabatan, job descriptions, kamus kompetensi, dan pemetaan unit kerja."
        icon={Network}
        className="w-full"
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalPositions}</p>
              <p className="text-xs text-muted-foreground">Posisi Jabatan Terdefinisi</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalCompetencies}</p>
              <p className="text-xs text-muted-foreground">Required Skills di Framework</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.totalJobDescriptions}</p>
              <p className="text-xs text-muted-foreground">Job Descriptions Lengkap</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.jobDescriptionCoverage.percentage}%</p>
              <p className="text-xs text-muted-foreground">Cakupan Job Description</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OD Recharts Component */}
      <OdCharts
        competencyLevels={data.competencyLevels}
        directoratePositions={data.directoratePositions}
        jobDescriptionCoverage={data.jobDescriptionCoverage}
      />
    </div>
  );
}
