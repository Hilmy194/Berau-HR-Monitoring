import { GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { EmptyState, ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, hasActiveFilters, listSkillGapEmployees } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Current Gap / Skill Needs - Berau Coal HR" };

export default async function TalentGapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listSkillGapEmployees(filters), getEmployeeFilterOptions()]);
  const active = hasActiveFilters(filters);
  const totalGaps = rows.reduce((sum, row) => sum + row.skillGap.length, 0);
  const highGapEmployees = rows.filter((row) => row.skillGap.length >= 3).length;
  const topGap = getTopGap(rows.flatMap((row) => row.skillGap));
  const selected = rows.find((row) => row.profileId === filters.analyze);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent AI" title="Current Gap / Skill Needs" description="AI membantu membaca skill needs employee terhadap posisi saat ini, lalu langsung menerjemahkannya menjadi action plan pengembangan 70-20-10." icon={GitCompareArrows} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedEmployee={filters.employee}
        qPlaceholder="Search employee to analyze competency gap..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
      />

      {!active ? <EmptyState message="Search or filter employee to analyze skill needs." /> : rows.length === 0 ? <EmptyState message="Tidak ada employee yang cocok dengan filter." /> : <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Dianalisis</p>
          <p className="mt-2 text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Skill Gap</p>
          <p className="mt-2 text-2xl font-bold text-primary">{totalGaps}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Tinggi</p>
          <p className="mt-2 text-2xl font-bold">{highGapEmployees}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Teratas</p>
          <p className="mt-2 text-sm font-semibold">{topGap}</p>
        </div>
      </div>

      {selected && (
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI Skill Needs Analysis</p>
            <h2 className="mt-2 text-xl font-bold">{selected.employeeName}</h2>
            <p className="mt-1 text-sm text-slate-300">{selected.currentPosition} · {selected.department}</p>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <InfoBlock label="Employee Summary" value={selected.employeeSummary} />
              <InfoBlock label="Current Position" value={selected.currentPosition} />
              <InfoBlock label="Strength" items={selected.strength} />
              <InfoBlock label="Weakness" items={selected.weakness} />
            </div>
            <div className="space-y-4">
              <InfoBlock label="Job Description dari OD" items={selected.jobDescription} />
              <InfoBlock label="Required Skill" items={selected.requiredSkills} badge />
              <InfoBlock label="Current Gap" items={selected.skillGap.length ? selected.skillGap : ["Tidak ada gap kritikal"]} badge />
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Mock AI Insight</p>
                <p className="mt-2 text-sm leading-6 text-slate-800">{selected.aiGapAnalysis}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Priority Improvement" value={selected.priorityImprovement} />
                <InfoBlock label="Recommended Learning / Action" value={selected.recommendedAction} />
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                <InfoBlock label="70% On the Job" value={selected.actionPlan70} />
                <InfoBlock label="20% Coaching / Mentoring" value={selected.actionPlan20} />
                <InfoBlock label="10% Training / Certification" value={selected.actionPlan10} />
              </div>
            </div>
          </div>
        </section>
      )}

      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Required Skills</th><th className="p-4">Current Skills</th><th className="p-4">Skill Needs</th><th className="p-4">70-20-10 Action Plan</th><th className="p-4">Action</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.employeeName} className="align-top">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.currentSkills.slice(0, 5).map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.skillGap.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></td>
                <td className="p-4 min-w-80 text-muted-foreground">
                  <div className="space-y-2">
                    <p><span className="font-semibold text-slate-800">70%</span> {row.actionPlan70}</p>
                    <p><span className="font-semibold text-slate-800">20%</span> {row.actionPlan20}</p>
                    <p><span className="font-semibold text-slate-800">10%</span> {row.actionPlan10}</p>
                  </div>
                </td>
                <td className="p-4">
                  <Link href={buildAnalyzeHref(filters, row.profileId)} className="inline-flex rounded-md bg-primary px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-primary/90">
                    Analyze
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
      </>}
    </div>
  );
}

function buildAnalyzeHref(filters: Record<string, string | undefined>, profileId: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "analyze") params.set(key, value);
  }
  params.set("analyze", profileId);
  return `/talent/gap?${params.toString()}`;
}

function InfoBlock({ label, value, items, badge = false }: { label: string; value?: string; items?: string[]; badge?: boolean }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {items ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => badge ? <Badge key={item}>{item}</Badge> : <span key={item} className="text-sm leading-6 text-slate-800">{item}</span>)}
        </div>
      ) : <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>}
    </div>
  );
}

function getTopGap(gaps: string[]) {
  if (!gaps.length) return "Tidak ada gap kritikal";

  const counts = gaps.reduce<Record<string, number>>((acc, gap) => {
    acc[gap] = (acc[gap] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tidak ada gap kritikal";
}
