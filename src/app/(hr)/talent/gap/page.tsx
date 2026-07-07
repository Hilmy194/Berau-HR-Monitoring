import { GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { EmptyState, ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, hasActiveFilters, listSkillGapEmployees } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Talent GAP - Berau Coal HR" };

export default async function TalentGapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listSkillGapEmployees(filters), getEmployeeFilterOptions()]);
  const active = hasActiveFilters(filters);
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="GAP" description="Gap skill employee terhadap posisi saat ini berdasarkan required skills dan job description dari OD." icon={GitCompareArrows} />
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
      {!active ? <EmptyState message="Search employee to analyze competency gap." /> : <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Required Skills</th><th className="p-4">Current Skills</th><th className="p-4">Skill Gap</th><th className="p-4">Summary</th></tr>
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
                <td className="p-4 text-muted-foreground">{row.gapSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>}
    </div>
  );
}
