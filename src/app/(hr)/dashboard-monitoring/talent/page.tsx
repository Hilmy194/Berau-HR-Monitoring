import Link from "next/link";
import { UsersRound, ChartNoAxesCombined, GraduationCap, Star, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getTalentDashboardMetrics } from "@/lib/services/dashboard-analytics.service";
import { listPromotionEmployees } from "@/lib/services/hr-modules.service";
import { PromotionCharts, type PromotionChartData } from "@/components/admin/promotion-charts";
import { TalentCharts } from "./talent-charts";

export const metadata = {
  title: "Dashboard Talent Management - Harmoni",
};

const PROMOTION_STATUS_STEPS = [
  "Eligible (Not Submitted)",
  "Submitted",
  "Approved Div. Head",
  "Verified by HRBP",
  "Verified by HROD",
  "Approved Dir./Bus. Head",
  "Rejected",
];

const STAGE_COLORS: Record<string, string> = {
  "Eligible (Not Submitted)": "#f59e0b",
  "Submitted": "#0284c7",
  "Approved Div. Head": "#6366f1",
  "Verified by HRBP": "#8b5cf6",
  "Verified by HROD": "#0d9488",
  "Approved Dir./Bus. Head": "#10b981",
  "Rejected": "#ef4444",
};

export default async function DashboardMonitoringTalentPage() {
  const session = await requireAuth();
  if (!isRoutePermitted("/dashboard-monitoring/talent", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const [data, promotionRows] = await Promise.all([
    getTalentDashboardMetrics(),
    listPromotionEmployees({}),
  ]);

  const stageDistribution = PROMOTION_STATUS_STEPS.map((status) => ({
    name: status,
    count: promotionRows.filter((r) => r.promotionStatus === status).length,
    fill: STAGE_COLORS[status] ?? "#64748b",
  }));

  const extraStatuses = Array.from(
    new Set(
      promotionRows
        .map((r) => r.promotionStatus)
        .filter((status) => Boolean(status) && !PROMOTION_STATUS_STEPS.includes(status))
    )
  );
  for (const st of extraStatuses) {
    stageDistribution.push({
      name: st,
      count: promotionRows.filter((r) => r.promotionStatus === st).length,
      fill: "#64748b",
    });
  }

  const promotionChartData: PromotionChartData = {
    stageDistribution,
    statusProportions: stageDistribution
      .filter((s) => s.count > 0)
      .map((s) => ({ name: s.name, value: s.count, fill: s.fill })),
    pilarSummary: {
      submissionCompleted: promotionRows.filter((r) => Boolean(r.isSubmissionCompleted)).length,
      submissionPending: promotionRows.filter((r) => !r.isSubmissionCompleted).length,
      threeSixtyCompleted: promotionRows.filter((r) => Boolean(r.is360Completed)).length,
      threeSixtyPending: promotionRows.filter((r) => !r.is360Completed).length,
      presentationCompleted: promotionRows.filter((r) => Boolean(r.isPresentationCompleted)).length,
      presentationScheduled: promotionRows.filter(
        (r) => !r.isPresentationCompleted && (r.promotionStatus === "Verified by HRBP" || r.promotionStatus === "Approved Div. Head")
      ).length,
      presentationPending: promotionRows.filter(
        (r) => !r.isPresentationCompleted && r.promotionStatus !== "Verified by HRBP" && r.promotionStatus !== "Approved Div. Head"
      ).length,
    },
    totalCount: promotionRows.length,
  };

  const readyNow = data.readinessDistribution.find((r) => r.name === "Ready Now")?.value || 0;
  const globalTalent = data.twelveBoxSummary?.totalGlobalTalent || 0;
  const topTalent = data.twelveBoxSummary?.totalTopTalent || 0;
  const globalAndTopTalent = globalTalent + topTalent;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Dashboard Modul"
        title="Talent Management"
        description="Monitoring pemetaan talenta 12-Box (Metodologi People Review Harmoni), kesiapan suksesi promosi, program percepatan karir, serta penutupan gap kompetensi."
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
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{globalAndTopTalent}</span>
                <span className="text-[11px] font-semibold text-blue-700">({globalTalent} Global)</span>
              </div>
              <p className="text-xs text-muted-foreground">Global &amp; Top Talent (Box 1-4)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Talent Charts Component */}
      <TalentCharts
        twelveBoxDistribution={data.twelveBoxDistribution}
        twelveBoxSummary={data.twelveBoxSummary}
        streamDistribution={data.streamDistribution}
        nineBoxDistribution={data.nineBoxDistribution}
        readinessDistribution={data.readinessDistribution}
        topSkillGaps={data.topSkillGaps}
      />

      {/* Promotion Pipeline Charts (Consolidated from Talent -> Promotion) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pipeline &amp; Status Promosi</h2>
            <p className="text-xs text-muted-foreground">
              Distribusi tahapan approval usulan promosi dan pemenuhan 3 pilar kesiapan promosi.
            </p>
          </div>
          <Link
            href="/talent/promotion"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          >
            <span>Buka Tabel Promotion</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <PromotionCharts data={promotionChartData} targetPath="/talent/promotion" />
      </section>
    </div>
  );
}
