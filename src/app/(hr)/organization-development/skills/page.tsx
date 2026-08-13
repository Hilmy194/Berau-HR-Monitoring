import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OdOrgFilterForm } from "@/components/admin/od-org-filter-form";
import { CompetencyFileUpload } from "@/components/admin/competency-file-upload";
import {
  getCompetencyShareFiles,
  getOrganizationDevelopmentFilterOptions,
  getPositionCompetencyMatrix,
  type PositionCompetencyMatrixRow,
} from "@/lib/services/organization-development.service";

export const metadata = { title: "Position Competency Priority - Harmoni" };

const PRIORITY_COLUMNS = [
  { level: 5, label: "Scale 5", description: "Critical" },
  { level: 4, label: "Scale 4", description: "High" },
  { level: 3, label: "Scale 3", description: "Important" },
  { level: 2, label: "Scale 2", description: "Supporting" },
  { level: 1, label: "Scale 1", description: "Awareness" },
] as const;

export default async function SkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [{ rows, pagination }, options, competencyFiles] = await Promise.all([
    getPositionCompetencyMatrix(filters),
    getOrganizationDevelopmentFilterOptions(),
    getCompetencyShareFiles(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Position Competency Priority"
        description="Monitoring competency per position. Scale 5 berada paling kiri sebagai competency paling kritikal, lalu Scale 4 sampai Scale 1."
        icon={BookOpenCheck}
      />

      <OdOrgFilterForm
        search={filters.search ?? filters.q}
        selectedDirectorateId={filters.directorateId}
        selectedDivisionId={filters.divisionId}
        selectedDepartmentId={filters.departmentId}
        selectedCompetencyCategory={filters.competencyCategory}
        selectedLevel={filters.level}
        selectedLimit={filters.limit ?? "20"}
        directorates={options.directorates}
        divisions={options.divisions}
        departments={options.departments}
        competencyCategories={options.competencyCategories}
        levels={options.positionLevelOptions}
        showCompetencyCategory
        searchPlaceholder="Search position or competency"
        resetHref="/organization-development/skills"
        limitOptions={["10", "20", "40"]}
      />

      <section className="rounded-xl border bg-white p-4">
        <CompetencyFileUpload files={competencyFiles} />
      </section>

      <TableShell>
        <table className="w-full min-w-[1180px] table-fixed text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-64 p-3">Position</th>
              <th className="w-52 p-3">Organization</th>
              {PRIORITY_COLUMNS.map((column) => (
                <th key={column.level} className="w-44 p-3">
                  <span className="block font-bold text-slate-900">{column.label}</span>
                  <span className="block normal-case tracking-normal">{column.description}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No competency priority mapping found.</td></tr>
            ) : rows.map((position) => (
              <tr key={position.positionId} className="align-top">
                <td className="p-3">
                  <Link href={`/organization-development/positions/${position.positionId}`} className="font-semibold leading-5 hover:text-primary">{position.positionName}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{position.positionLevel}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{position.positionGroup}</p>
                </td>
                <td className="p-3 text-xs leading-5 text-muted-foreground">{position.directorate}<br />{position.division}<br />{position.department}</td>
                {PRIORITY_COLUMNS.map((column) => (
                  <td key={column.level} className="p-3">
                    <CompetencyList rows={position.byPriority[column.level] ?? []} level={column.level} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString("id-ID")} positions</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Link href={pageHref(filters, pagination.page - 1)}><ArrowLeft className="h-4 w-4" /> Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}>
            <Link href={pageHref(filters, pagination.page + 1)}>Next <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompetencyList({
  rows,
  level,
}: {
  rows: PositionCompetencyMatrixRow["byPriority"][number];
  level: number;
}) {
  if (rows.length === 0) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map((row) => (
        <span key={row.id} title={row.competencyName} className="inline-flex max-w-full items-start gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium leading-4 text-slate-700">
          <span className="min-w-0 break-words">{row.competencyName}</span>
          <Badge variant={level >= 5 ? "success" : "outline"} className="shrink-0 px-1.5 py-0 text-[10px]">S{level}</Badge>
        </span>
      ))}
    </div>
  );
}

function pageHref(filters: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  params.set("page", String(Math.max(1, page)));
  return `/organization-development/skills?${params.toString()}`;
}
