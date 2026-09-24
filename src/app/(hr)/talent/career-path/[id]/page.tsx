import Link from "next/link";
import { ArrowLeft, Milestone } from "lucide-react";
import { notFound } from "next/navigation";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { OdPositionFilterBar } from "@/components/admin/od-position-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listEmployeeDirectory } from "@/lib/services/employee-directory.service";
import {
  getOdTalentFilterOptions,
  type OdCareerPathRow,
} from "@/lib/services/od-talent-matching.service";
import { listCareerPathRecommendationsForEmployee } from "@/lib/services/career-path.service";
import { CareerPathAiPanel } from "@/components/admin/career-path-ai-panel";
import { getLatestTalentAiAnalysisForEmployee } from "@/lib/services/talent-ai.service";

export const metadata = { title: "Employee Career Path - Harmoni" };

export default async function EmployeeCareerPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, filters] = await Promise.all([params, searchParams]);
  const [options, employees] = await Promise.all([
    getOdTalentFilterOptions(),
    listEmployeeDirectory(),
  ]);
  const selectedEmployee = employees.find((employee) => employee.id === id)!;
  if (!selectedEmployee) notFound();

  const [{ rows }, latestAiAnalysis] = await Promise.all([listCareerPathRecommendationsForEmployee(selectedEmployee.id, {
    q: filters.q,
    target: filters.target,
    directorateId: filters.directorateId,
    divisionId: filters.divisionId,
    departmentId: filters.departmentId,
    level: filters.level,
    competencyCategory: filters.competencyCategory,
    limit: filters.limit,
  }), getLatestTalentAiAnalysisForEmployee({ analysisType: "CAREER_PATH", employeeId: selectedEmployee.id })]);
  const nextRoles = rows.filter((row) => row.pathStage === "Next role").length;
  const readyRows = rows.filter((row) => row.matchScore >= 85).length;
  const topGap = getTopGap(rows.flatMap((row) => row.priorityGaps.map((gap) => gap.replace(/\sS\d\/S\d$/, ""))));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="gap-2 bg-white">
          <Link href={backHref(filters)}>
            <ArrowLeft className="h-4 w-4" />
            Kembali ke List Employee
          </Link>
        </Button>
      </div>

      <ModuleHero
        eyebrow="Career Path"
        title={selectedEmployee.name}
        description={`${selectedEmployee.position} / ${selectedEmployee.directorate} / ${selectedEmployee.division} / ${selectedEmployee.department}`}
        icon={Milestone}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected Employee</p>
          <h2 className="mt-2 text-xl font-bold">{selectedEmployee.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{selectedEmployee.position}</p>
          <p className="mt-1 text-xs text-muted-foreground">{selectedEmployee.nik ?? "No NIK"} / {selectedEmployee.email}</p>
        </div>
        <SummaryCard label="Career Options" value={rows.length} />
        <SummaryCard label="Next Role" value={nextRoles} />
        <SummaryCard label="Ready >= 85%" value={readyRows} />
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Teratas</p>
          <p className="mt-2 text-sm font-semibold">{topGap}</p>
        </div>
      </section>

      <CareerPathAiPanel employeeId={selectedEmployee.id} initialAnalysis={latestAiAnalysis} />

      {!rows.length && (
        <section className="rounded-xl border border-dashed bg-white px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
          Belum ada posisi yang memenuhi aturan jalur karier dan filter yang dipilih.
        </section>
      )}

      {!!rows.length && (
        <>
          <OdPositionFilterBar
            q={filters.q}
            selectedDirectorateId={filters.directorateId}
            selectedDivisionId={filters.divisionId}
            selectedDepartmentId={filters.departmentId}
            selectedPositionId={filters.target}
            selectedLevel={filters.level}
            selectedCompetencyCategory={filters.competencyCategory}
            selectedLimit={filters.limit}
            directorates={options.directorates}
            divisions={options.divisions}
            departments={options.departments}
            positions={options.targetPositions}
            competencyCategories={options.competencyCategories}
            hiddenFields={preservedListFilters(filters)}
            showLevel
            showCompetencyCategory
            showLimit
            searchPlaceholder="Cari posisi tujuan, competency, atau organisasi"
            submitLabel="Filter Career Path"
            resetHref={`/talent/career-path/${id}${listFilterQuery(filters)}`}
          />

          {!!rows.length && (
            <>
              <section className="grid gap-4 lg:grid-cols-3">
                {rows.slice(0, 3).map((row) => <PathCard key={`${row.candidateId}-${row.targetPositionId}`} row={row} />)}
              </section>

              <TableShell>
                <table className="w-full min-w-[1280px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="p-4">Target Position</th><th className="p-4">Path Type</th><th className="p-4">Organization</th><th className="p-4">Match</th><th className="p-4">Readiness</th><th className="p-4">Strength</th><th className="p-4">Priority Gap</th><th className="p-4">Development Direction</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row) => (
                      <tr key={`${row.candidateId}-${row.targetPositionId ?? row.targetPosition}`} className="align-top">
                        <td className="p-4 font-medium">{row.targetPosition}<p className="text-xs text-muted-foreground">{row.targetPositionGroup ?? "No level"}</p></td>
                        <td className="p-4"><Badge variant="secondary">{row.pathStage}</Badge><p className="mt-2 text-xs text-muted-foreground">{row.transitionType}</p></td>
                        <td className="p-4">{row.targetDirectorate}<p className="text-xs text-muted-foreground">{row.targetDivision} / {row.targetDepartment}</p></td>
                        <td className="min-w-32 p-4"><p className="mb-2 font-semibold">{row.matchScore}%</p><Progress value={row.matchScore} /></td>
                        <td className="p-4"><Badge variant={readinessVariant(row.matchScore)}>{row.estimatedReadiness}</Badge></td>
                        <td className="p-4"><BadgeList items={row.matchedCompetencies.slice(0, 5)} /></td>
                        <td className="p-4"><BadgeList items={row.priorityGaps} variant="outline" /></td>
                        <td className="min-w-80 p-4 text-muted-foreground">
                          <p>{row.pathRationale}</p>
                          <p className="mt-2 text-xs">{row.developmentNeed}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </>
          )}
        </>
      )}
    </div>
  );
}

function PathCard({ row }: { row: OdCareerPathRow }) {
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="secondary">{row.pathStage}</Badge>
          <h3 className="mt-3 text-base font-bold">{row.targetPosition}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{row.targetDivision} / {row.targetDepartment}</p>
        </div>
        <Badge variant={readinessVariant(row.matchScore)}>{row.matchScore}%</Badge>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span>Match score</span>
          <span className="font-semibold">{row.estimatedReadiness}</span>
        </div>
        <Progress value={row.matchScore} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{row.pathRationale}</p>
      {row.targetPositionId && (
        <div className="mt-4 flex justify-end">
          <Link href={`/organization-development/positions/${row.targetPositionId}`} className="text-xs font-semibold text-emerald-700 hover:underline">
            Lihat position detail
          </Link>
        </div>
      )}
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function BadgeList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div>;
}

function readinessVariant(score: number): "secondary" | "warning" | "success" | "outline" {
  if (score >= 85) return "success";
  if (score >= 70) return "secondary";
  if (score >= 55) return "warning";
  return "outline";
}

function getTopGap(gaps: string[]) {
  if (!gaps.length) return "Tidak ada gap kritikal";
  const counts = gaps.reduce<Record<string, number>>((acc, gap) => {
    acc[gap] = (acc[gap] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tidak ada gap kritikal";
}

function preservedListFilters(filters: Record<string, string | undefined>) {
  const fields: Record<string, string> = {};
  for (const key of ["peopleQ", "directorate", "division", "department", "position", "peopleLimit"]) {
    const value = filters[key];
    if (value) fields[key] = value;
  }
  return fields;
}

function backHref(filters: Record<string, string | undefined>) {
  return `/talent/career-path${listFilterQuery(filters)}`;
}

function listFilterQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["peopleQ", "directorate", "division", "department", "position", "peopleLimit"]) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
