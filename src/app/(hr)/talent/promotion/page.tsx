import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listPromotionEmployees } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Talent Promotion - Berau Coal HR" };

export default async function PromotionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listPromotionEmployees(filters), getEmployeeFilterOptions()]);
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Promotion" description="Daftar employee, posisi saat ini, kapan terakhir promosi, dan lama di posisi." icon={ChartNoAxesCombined} />
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
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Current Level</th><th className="p-4">Last Promotion</th><th className="p-4">Time in Position</th><th className="p-4">Successor</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.name}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4">{row.currentLevel}</td>
                <td className="p-4">{formatDate(row.lastPromotionDate)}</td>
                <td className="p-4">{row.timeInCurrentPosition}</td>
                <td className="p-4">{row.successor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
