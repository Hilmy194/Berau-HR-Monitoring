import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { getEmployeeFilterOptions, listCoachingGovernance } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Coaching Governance - Berau Coal HR" };

export default async function CoachingGovernancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listCoachingGovernance(filters), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Learning" title="Coaching Governance" description="Track coaching sessions, active goals, discussion points, and follow-up actions in one governance view." icon={ClipboardList} />
      <CascadingFilterBar q={filters.q} selectedDirectorate={filters.directorate} selectedDivision={filters.division} selectedDepartment={filters.department} selectedEmployee={filters.employee} qPlaceholder="Search employee, goal, atau follow-up..." orgOptions={options.orgOptions} employees={options.employees} showEmployee />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Position</th><th className="p-4">Organization</th><th className="p-4">Coach/Mentor</th><th className="p-4">Cadence</th><th className="p-4">Active Goal</th><th className="p-4">Last Discussion</th><th className="p-4">Follow Up</th><th className="p-4">Next Session</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="align-top hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="p-4">{row.coach}</td>
                <td className="p-4"><Badge variant="outline">{row.sessionCadence}</Badge></td>
                <td className="p-4 min-w-60">{row.activeGoal}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.lastDiscussion}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.followUp}</td>
                <td className="p-4">{row.nextSession}</td>
                <td className="p-4"><Badge variant={row.status === "Needs Attention" ? "destructive" : "secondary"}>{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
