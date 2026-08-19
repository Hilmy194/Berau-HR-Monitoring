import Link from "next/link";
import { FileText } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { OdOrgFilterForm } from "@/components/admin/od-org-filter-form";
import { getOrganizationDevelopmentFilterOptions, listJobDescriptionRows } from "@/lib/services/organization-development.service";

export const metadata = { title: "Job Descriptions - Harmoni" };

export default async function JobDescriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const effectiveFilters = {
    ...filters,
    jobDescriptionStatus: filters.jobDescriptionStatus ?? "mapped",
  };
  const [rows, options] = await Promise.all([listJobDescriptionRows(effectiveFilters), getOrganizationDevelopmentFilterOptions()]);
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Organization Development" title="Job Descriptions" description="Responsibilities position-based yang diambil dari mapping Excel. Tidak berisi nama employee atau nilai kompetensi aktual." icon={FileText} />
      <OdOrgFilterForm
        search={filters.search ?? filters.q}
        selectedDirectorateId={filters.directorateId}
        selectedDivisionId={filters.divisionId}
        selectedDepartmentId={filters.departmentId}
        selectedCompetencyCategory={filters.competencyCategory}
        selectedLevel={filters.level}
        selectedStatus={effectiveFilters.jobDescriptionStatus}
        selectedLimit={filters.limit ?? "100"}
        directorates={options.directorates}
        divisions={options.divisions}
        departments={options.departments}
        competencyCategories={options.competencyCategories}
        levels={options.positionLevelOptions}
        showCompetencyCategory
        showJobDescriptionStatus
        searchPlaceholder="Search position or job description"
        resetHref="/organization-development/job-descriptions"
        limitOptions={["50", "100", "200"]}
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Position</th><th className="p-4">Organization</th><th className="p-4">Job Description</th><th className="p-4">Competencies</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No job descriptions match the selected filters.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="p-4"><Link href={`/organization-development/positions/${row.id}`} className="font-medium hover:text-primary">{row.positionName}</Link><p className="text-xs text-muted-foreground">{row.positionLevel}</p><p className="text-xs text-muted-foreground">{row.positionGroup}</p></td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="max-w-2xl p-4 text-muted-foreground">{row.jobDescription ?? "Job description has not been mapped for this position."}</td>
                <td className="p-4"><Badge variant="outline">{row.competencyCount}</Badge></td>
                <td className="p-4"><Badge variant={row.jobDescription ? "success" : "warning"}>{row.jobDescription ? "Mapped" : "Missing"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
