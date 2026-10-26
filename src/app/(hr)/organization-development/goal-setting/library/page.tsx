import Link from "next/link";
import { ArrowLeft, BookOpen, Search, Layers, Target } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getScorecardKpiSettingDashboard,
  getScorecardKpiSettingFilterOptions,
} from "@/lib/services/goal-setting/goal-setting.service";
import { requireGoalSettingAccess } from "@/lib/session";

export const metadata = { title: "Pustaka KPI Master - Harmoni" };

export default async function KpiLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireGoalSettingAccess();
  const filters = await searchParams;
  const [dashboard, options] = await Promise.all([
    getScorecardKpiSettingDashboard(filters),
    getScorecardKpiSettingFilterOptions(),
  ]);

  const summary = dashboard.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" className="bg-white">
          <Link href="/organization-development/goal-setting">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Goal Setting
          </Link>
        </Button>
      </div>

      <ModuleHero
        eyebrow="Organization Development"
        title="Pustaka Master KPI (Scorecard Library)"
        description="Katalog terstandarisasi seluruh Key Performance Indicators (KPI) PT Berau Coal, mencakup indikator Finance, Customers, Internal Business Process, dan Learning & Growth beserta ambang batas skala L1–L5."
        icon={BookOpen}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total KPI di Pustaka" value={summary.totalGoals.toLocaleString("id-ID")} icon={Target} />
        <SummaryCard label="Strategy Pillars" value={summary.strategyPillars} icon={Layers} />
        <SummaryCard label="Review Periods" value={summary.reviewPeriods} icon={Layers} />
        <SummaryCard label="Rata-rata Bobot Acuan" value={`${summary.averageWeight}%`} icon={Layers} />
      </section>

      <form className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Cari nama KPI atau deskripsi indikator..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <div>
            <select
              name="strategyPillar"
              defaultValue={filters.strategyPillar ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Semua Strategy Pillar</option>
              {options.strategyPillars.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              name="reviewPeriod"
              defaultValue={filters.reviewPeriod ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Semua Periode Review</option>
              {options.reviewPeriods.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/organization-development/goal-setting/library">Reset Filter</Link>
          </Button>
          <Button className="text-slate-950">Terapkan Filter</Button>
        </div>
      </form>

      <TableShell>
        <div className="border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menampilkan {dashboard.rows.length} dari {summary.totalGoals.toLocaleString("id-ID")} KPI Terstandarisasi
        </div>
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Strategy Pillar</th>
              <th className="p-3">Nama KPI</th>
              <th className="p-3">Deskripsi & Rumus</th>
              <th className="p-3">Periode</th>
              <th className="p-3">Satuan</th>
              <th className="p-3 text-right">Bobot</th>
              <th className="p-3 text-center">L1</th>
              <th className="p-3 text-center">L2</th>
              <th className="p-3 text-center">L3 (Target)</th>
              <th className="p-3 text-center">L4</th>
              <th className="p-3 text-center">L5</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dashboard.rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-slate-50/50">
                <td className="p-3">
                  <Badge variant="outline" className="font-semibold">
                    {row.strategyPillarName}
                  </Badge>
                </td>
                <td className="p-3 font-semibold">{row.goalName}</td>
                <td className="max-w-md p-3 text-xs leading-relaxed text-muted-foreground">
                  {row.goalDescription}
                </td>
                <td className="whitespace-nowrap p-3">{row.reviewPeriod}</td>
                <td className="p-3 font-mono text-xs">{row.uom}</td>
                <td className="p-3 text-right font-semibold">{row.weight}%</td>
                <KpiLevelCell value={row.levels.l1} />
                <KpiLevelCell value={row.levels.l2} />
                <KpiLevelCell value={row.levels.l3} highlight />
                <KpiLevelCell value={row.levels.l4} />
                <KpiLevelCell value={row.levels.l5} />
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function KpiLevelCell({ value, highlight }: { value: string; highlight?: boolean }) {
  return (
    <td
      className={`p-3 text-center font-mono text-xs ${
        highlight ? "bg-emerald-50/60 font-semibold text-emerald-800" : "text-slate-700"
      }`}
    >
      {value || "-"}
    </td>
  );
}
