import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listDevelopmentProgramEmployees } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Development Program - Berau Coal HR" };

export default async function DevelopmentProgramPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listDevelopmentProgramEmployees(filters), getEmployeeFilterOptions()]);
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Development Program" description="Employee yang mengikuti DP, jenis program, tahun join, dan status." icon={GraduationCap} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Program Type</th><th className="p-4">Program Name</th><th className="p-4">Join Year</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={`${row.employeeName}-${row.programName}`}>
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4">{row.developmentProgramType}</td>
                <td className="p-4">{row.programName}</td>
                <td className="p-4">{row.joinYear}</td>
                <td className="p-4"><Badge variant={row.status === "Completed" ? "default" : "secondary"}>{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
