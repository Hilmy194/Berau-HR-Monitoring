import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeTaskProgress, getAdminDashboardData } from "@/lib/services/probation.service";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ReportActions } from "@/components/admin/report-actions";
import { AdminCharts } from "@/components/admin/admin-charts";

export const metadata = { title: "Probation Reports - Harmoni" };

export default async function AdminReportsPage() {
  await requireAdmin();
  const [profiles, dashboardData] = await Promise.all([
    prisma.profile.findMany({
      where: { workforceStage: "PROBATION" },
      include: {
        user: true,
        tasks: { select: { status: true } },
        presentations: { select: { score: true, resultStatus: true } },
        coachings: { select: { id: true } },
      },
      orderBy: [{ department: "asc" }, { user: { name: "asc" } }],
    }),
    getAdminDashboardData(),
  ]);

  const totals = {
    employees: profiles.length,
    active: profiles.filter((p) => p.probationStatus === "ACTIVE").length,
    passed: profiles.filter((p) => p.probationStatus === "PASSED").length,
    attention: profiles.filter((p) => ["FAILED", "EXTENDED"].includes(p.probationStatus)).length,
  };
  const generatedAt = formatDate(new Date());
  const reportRows = profiles.map((profile) => {
    const progress = computeTaskProgress(profile.tasks);
    return {
      name: profile.user.name,
      position: profile.position ?? "-",
      department: profile.department ?? "-",
      joinDate: formatDate(profile.joinDate),
      taskProgress: `${progress.completedTasks}/${progress.totalTasks} (${progress.progressPercentage}%)`,
      score: String(profile.presentations[0]?.score ?? "-"),
      coachingCount: profile.coachings.length,
      status: profile.probationStatus,
    };
  });

  return (
    <div className="report-page space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Harmoni</p>
          <h2 className="text-2xl font-bold">Probation Report</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generated {generatedAt}</p>
        </div>
        <ReportActions
          generatedAt={generatedAt}
          metrics={[
            { label: "Total Employees", value: totals.employees },
            { label: "Active", value: totals.active },
            { label: "Passed", value: totals.passed },
            { label: "Needs Attention", value: totals.attention },
          ]}
          statusDistribution={dashboardData.statusDistribution}
          monthlyTrend={dashboardData.monthlyTrend}
          rows={reportRows}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total Employees" value={totals.employees} />
        <Metric label="Active" value={totals.active} />
        <Metric label="Passed" value={totals.passed} />
        <Metric label="Needs Attention" value={totals.attention} />
      </div>

      <AdminCharts
        statusDistribution={dashboardData.statusDistribution}
        monthlyTrend={dashboardData.monthlyTrend}
      />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Join Date</th>
                <th className="px-4 py-3">Task Progress</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Coaching</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profiles.map((profile) => {
                const progress = computeTaskProgress(profile.tasks);
                const presentation = profile.presentations[0];
                return (
                  <tr key={profile.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{profile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{profile.position ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3">{profile.department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(profile.joinDate)}</td>
                    <td className="px-4 py-3">{progress.completedTasks}/{progress.totalTasks} ({progress.progressPercentage}%)</td>
                    <td className="px-4 py-3">{presentation?.score ?? "-"}</td>
                    <td className="px-4 py-3">{profile.coachings.length}</td>
                    <td className="px-4 py-3"><StatusBadge status={profile.probationStatus} /></td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No report data available.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="hidden text-xs text-muted-foreground print:block">
        Harmoni - Probation monitoring report
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
