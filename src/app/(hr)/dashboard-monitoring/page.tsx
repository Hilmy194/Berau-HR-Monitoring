import { Users, UserCheck, Calendar, Layers, TrendingUp, HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getDemographicsDashboard } from "@/lib/services/dashboard-analytics.service";
import { DemographicsCharts } from "@/components/admin/demographics-charts";
import { DemographicsTableClient } from "@/components/admin/demographics-table-client";

export const metadata = {
  title: "Dashboard Monitoring Demografi & Karyawan - Harmoni",
};

export default async function DashboardMonitoringDemographicsPage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const data = await getDemographicsDashboard();

  const maleItem = data.genderDistribution.find((g) => g.name === "Laki-laki");
  const femaleItem = data.genderDistribution.find((g) => g.name === "Perempuan");
  const permanentItem = data.employmentStatusDistribution.find((s) => s.name === "Permanent");

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Executive &amp; People Analytics"
        title="Monitoring Demografi &amp; Karyawan"
        description="Pusat pemantauan seluruh karyawan PT Berau Coal secara terpadu: komposisi gender, distribusi umur &amp; generasi, status kepegawaian, jabatan, dan struktur persebaran direktorat."
        icon={Users}
        className="w-full"
      />

      {/* Primary KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Karyawan Aktif"
          value={data.totalEmployees}
          subtext="Populasi Terdata"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Rasio Gender (L / P)"
          value={`${maleItem?.percentage ?? 0}% / ${femaleItem?.percentage ?? 0}%`}
          subtext={`${maleItem?.value ?? 0} L · ${femaleItem?.value ?? 0} P`}
          icon={UserCheck}
          tone="info"
        />
        <StatCard
          label="Rata-rata Usia"
          value={`${data.averageAge} Thn`}
          subtext="Rata-rata Usia Karyawan"
          icon={Calendar}
          tone="indigo"
        />
        <StatCard
          label="Karyawan Tetap (PWTT)"
          value={`${permanentItem?.percentage ?? 0}%`}
          subtext={`${permanentItem?.value ?? 0} Karyawan Tetap`}
          icon={Layers}
          tone="success"
        />
        <StatCard
          label="Rata-rata Masa Kerja"
          value={`${data.averageTenure} Thn`}
          subtext="Tenure di Berau Coal"
          icon={TrendingUp}
          tone="purple"
        />
        <StatCard
          label="Karyawan Senior (50+)"
          value={data.seniorCount}
          subtext="Mendekati Pensiun"
          icon={HeartHandshake}
          tone="amber"
        />
      </div>

      {/* Recharts Analytics Visualization */}
      <DemographicsCharts
        genderDistribution={data.genderDistribution}
        ageDistribution={data.ageDistribution}
        generationDistribution={data.generationDistribution}
        employmentStatusDistribution={data.employmentStatusDistribution}
        directorateDistribution={data.directorateDistribution}
        levelDistribution={data.levelDistribution}
      />

      {/* Interactive Employee Search & Filtering Table */}
      <DemographicsTableClient rows={data.rows} />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: typeof Users;
  tone?: "primary" | "info" | "indigo" | "success" | "purple" | "amber";
}) {
  const toneClasses = {
    primary: "bg-emerald-50 text-emerald-700 border-emerald-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  }[tone];

  const iconClasses = {
    primary: "bg-emerald-100/80 text-emerald-700",
    info: "bg-blue-100/80 text-blue-700",
    indigo: "bg-indigo-100/80 text-indigo-700",
    success: "bg-emerald-100/80 text-emerald-700",
    purple: "bg-purple-100/80 text-purple-700",
    amber: "bg-amber-100/80 text-amber-700",
  }[tone];

  return (
    <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 line-clamp-1">{label}</p>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}
