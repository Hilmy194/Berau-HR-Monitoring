import Link from "next/link";
import { Gauge, Search, Target } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalDashboardCharts } from "@/components/admin/goal-setting/goal-dashboard-charts";
import { GoalExportButton, GoalSyncButton } from "@/components/admin/goal-setting/goal-setting-actions";
import { getGoalFilterOptions, getPatGoalSettingDashboard, patToCsv } from "@/lib/services/goal-setting/goal-setting.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Goal Setting - Harmoni" };

export default async function GoalSettingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [dashboard, options] = await Promise.all([
    getPatGoalSettingDashboard(filters),
    getGoalFilterOptions(),
  ]);
  const summary = dashboard.summary;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Goal Setting Employee"
        description="Monitoring goal setting karyawan berdasarkan scorecard KPI, filter direktorat, status review, nilai PAT, dan detail setiap karyawan."
        icon={Target}
      />

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <SummaryLink label="PAT Year" value={String(summary.year)} href="/organization-development/goal-setting" />
        <SummaryLink label="Employees Reviewed" value={summary.employees} href="/organization-development/goal-setting" />
        <SummaryLink label="Reviewed" value={summary.reviewed} href="/organization-development/goal-setting?status=Reviewed" />
        <SummaryLink label="In Progress" value={summary.inProgress} href="/organization-development/goal-setting?status=In+Progress" />
        <SummaryLink label="Complete" value={summary.complete} href="/organization-development/goal-setting?status=Complete" />
        <SummaryLink label="Average PAT Score" value={summary.averagePatScore} href="/organization-development/goal-setting" />
        <SummaryLink label="360 Strength" value={summary.strengths} href="/organization-development/goal-setting" />
        <SummaryLink label="360 Weakness" value={summary.weaknesses} href="/organization-development/goal-setting" />
      </section>

      <GoalDashboardCharts {...dashboard.charts} />

      <form className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input name="q" defaultValue={filters.q ?? ""} placeholder="Search employee, ID, KPI, position, directorate, comment" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm" />
          </div>
          <Select name="year" value={filters.year} label="All years" items={options.years} />
          <Select name="directorate" value={filters.directorate} label="All directorates" items={options.directorates} />
          <Select name="division" value={filters.division} label="All divisions" items={options.divisions} />
          <Select name="department" value={filters.department} label="All departments" items={options.departments} />
          <Select name="position" value={filters.position} label="All positions" items={options.positions} />
          <Select name="manager" value={filters.manager} label="All managers" items={options.managers} />
          <Select name="status" value={filters.status} label="All PAT statuses" items={options.patStatuses} />
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline"><Link href="/organization-development/goal-setting">Reset Filter</Link></Button>
          <GoalExportButton csv={patToCsv(dashboard.rows)} filename={`goal-setting-${summary.year}.csv`} />
          <GoalSyncButton />
          <Button className="text-slate-950">Apply Filter</Button>
        </div>
      </form>

      <TableShell>
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Position</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Manager</th>
              <th className="p-4">Year</th>
              <th className="p-4">PAT Score</th>
              <th className="p-4">360 Strength</th>
              <th className="p-4">360 Weakness</th>
              <th className="p-4">Comment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Sync</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dashboard.rows.map((row) => (
              <tr key={row.employeeId} className="align-top">
                <td className="p-4"><p className="font-semibold">{row.employeeName}</p><p className="text-xs text-muted-foreground">{row.employeeId}</p></td>
                <td className="p-4">{row.position}</td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="p-4">{row.managerName}</td>
                <td className="p-4">{row.year}</td>
                <td className="p-4 font-semibold">{row.finalScore}</td>
                <td className="p-4"><TagList items={row.strengths} tone="success" /></td>
                <td className="p-4"><TagList items={row.weaknesses} tone="warning" /></td>
                <td className="max-w-sm p-4 text-sm leading-6 text-muted-foreground">{row.comments[0]?.comment ?? "-"}</td>
                <td className="p-4"><Badge variant={row.status === "Complete" ? "success" : row.status === "In Progress" ? "warning" : "secondary"}>{row.status}</Badge></td>
                <td className="whitespace-nowrap p-4">{formatDate(row.lastSync)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/organization-development/goal-setting/employees/${row.employeeId}`}>View Detail</Link></Button>
                    <Button asChild size="sm" variant="outline"><a href={row.entomoUrl}>Entomo</a></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

    </div>
  );
}

function SummaryLink({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-white p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Gauge className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-bold">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
    </Link>
  );
}

function TagList({ items, tone }: { items: string[]; tone: "success" | "warning" }) {
  const className = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => <span key={item} className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${className}`}>{item}</span>)}
    </div>
  );
}

function Select({ name, value, label, items }: { name: string; value?: string; label: string; items: readonly string[] }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {items.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}
