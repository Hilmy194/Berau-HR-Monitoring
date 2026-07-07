import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { getEmployeeFilterOptions, listLearningAlignment } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Learning Alignment - Berau Coal HR" };

export default async function LearningAlignmentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listLearningAlignment(filters), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Learning" title="Learning Alignment" description="Link training programs directly to competency gaps and measurable improvement metrics." icon={GraduationCap} />
      <CascadingFilterBar q={filters.q} selectedDirectorate={filters.directorate} selectedDivision={filters.division} selectedDepartment={filters.department} selectedEmployee={filters.employee} qPlaceholder="Search employee, competency gap, atau program..." orgOptions={options.orgOptions} employees={options.employees} showEmployee />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Position</th><th className="p-4">Organization</th><th className="p-4">Competency Gap</th><th className="p-4">Training Program</th><th className="p-4">Provider</th><th className="p-4">Linked IDP</th><th className="p-4">Improvement Metric</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={`${row.profileId}-${row.trainingProgram}`} className="align-top hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.competencyGap}</td>
                <td className="p-4 min-w-64 font-medium">{row.trainingProgram}</td>
                <td className="p-4">{row.learningProvider}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.linkedIdp}</td>
                <td className="p-4 min-w-72 text-muted-foreground">{row.improvementMetric}</td>
                <td className="p-4"><Badge variant="secondary">{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
