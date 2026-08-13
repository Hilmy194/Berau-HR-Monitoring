import Link from "next/link";
import { Milestone } from "lucide-react";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { getEmployeeFilterOptions, listCareerEvolution } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Career Evolution - Harmoni" };

export default async function CareerEvolutionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listCareerEvolution(filters), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Learning" title="Career Evolution" description="Visual timeline showing join date, promotion milestones, and future growth paths." icon={Milestone} />
      <CascadingFilterBar q={filters.q} selectedDirectorate={filters.directorate} selectedDivision={filters.division} selectedDepartment={filters.department} selectedEmployee={filters.employee} qPlaceholder="Search employee atau career path..." orgOptions={options.orgOptions} employees={options.employees} showEmployee />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Organization</th><th className="p-4">Career Timeline</th><th className="p-4">Current Position</th><th className="p-4">Target Position</th><th className="p-4">Next Milestone</th><th className="p-4">Future Growth Path</th><th className="p-4">Readiness</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="align-top hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="p-4 min-w-64">
                  <div className="space-y-3 border-l-2 border-emerald-100 pl-4">
                    <TimelinePoint label="Join Date" value={formatDate(row.joinDate)} />
                    <TimelinePoint label="Last Promotion" value={formatDate(row.lastPromotionDate)} />
                    <TimelinePoint label="Next Milestone" value={row.nextMilestone} />
                  </div>
                </td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.targetPosition}</td>
                <td className="p-4 min-w-56 text-muted-foreground">{row.nextMilestone}</td>
                <td className="p-4 min-w-64 font-medium">{row.futureGrowthPath}</td>
                <td className="p-4"><Badge variant="secondary">{row.readiness}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function TimelinePoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary ring-2 ring-emerald-100" />
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-600">{value}</p>
    </div>
  );
}
