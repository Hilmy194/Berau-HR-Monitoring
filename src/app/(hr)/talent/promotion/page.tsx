import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listPromotionEmployees } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Talent Promotion - Harmoni" };

const PROMOTION_STATUS_STEPS = [
  "Submitted",
  "Approved Div. Head",
  "Verified by HRBP",
  "Verified by HROD",
  "Approved Dir./Bus. Head",
  "Rejected",
];

export default async function PromotionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listPromotionEmployees(filters), getEmployeeFilterOptions()]);
  const statusCounts = Object.fromEntries(PROMOTION_STATUS_STEPS.map((status) => [status, rows.filter((row) => row.promotionStatus === status).length]));
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Promotion" description="Daftar employee, status promosi, serta Next / PIC dari sample employee dan DP." icon={ChartNoAxesCombined} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Promotion Request" value={rows.length} />
        {PROMOTION_STATUS_STEPS.map((status) => <SummaryCard key={status} label={status} value={statusCounts[status] ?? 0} />)}
      </section>
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Last Promotion</th><th className="p-4">Time in Position</th><th className="p-4">Next / PIC (AY)</th><th className="p-4">Current Status (AX)</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.name}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4">{formatDate(row.lastPromotionDate)}</td>
                <td className="p-4">{row.timeInCurrentPosition}</td>
                <td className="p-4">{row.nextPromotionPic}</td>
                <td className="p-4"><Badge variant={statusVariant(row.promotionStatus)}>{row.promotionStatus}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
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

function statusVariant(status: string): "secondary" | "warning" | "success" | "destructive" | "outline" {
  if (status === "Rejected") return "destructive";
  if (status === "Approved Dir./Bus. Head") return "success";
  if (status === "Submitted") return "warning";
  if (PROMOTION_STATUS_STEPS.includes(status)) return "secondary";
  return "outline";
}
