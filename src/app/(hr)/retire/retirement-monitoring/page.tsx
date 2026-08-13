import { Hourglass } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { RetirementContractDialog } from "@/components/admin/retirement-contract-dialog";
import { getEmployeeFilterOptions, listRetirementMonitoring } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Retirement Monitoring - Harmoni" };

export default async function RetirementMonitoringPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listRetirementMonitoring(filters), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Retire"
        title="Retirement Monitoring"
        description="View awal menampilkan employee yang masuk 5 tahun mendekati retirement date. Status warning dimulai 2 tahun menjelang pensiun. Usia pensiun default 55 tahun dan bisa diubah mengikuti kontrak."
        icon={Hourglass}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold">Monitoring window</p>
          <p className="text-xs text-muted-foreground">Default list: 5 tahun menjelang retirement date, termasuk yang overdue atau diperpanjang kontraknya.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant={filters.window === "all" ? "outline" : "default"}>
            <Link href="/retire/retirement-monitoring">5 tahun</Link>
          </Button>
          <Button asChild size="sm" variant={filters.window === "all" ? "default" : "outline"}>
            <Link href="/retire/retirement-monitoring?window=all">Semua</Link>
          </Button>
        </div>
      </div>
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedPosition={filters.position}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
        positions={options.positions}
        showPosition
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Current Position</th>
              <th className="p-4">Directorate</th>
              <th className="p-4">Division</th>
              <th className="p-4">Department</th>
              <th className="p-4">Birth Date</th>
              <th className="p-4">Current Age</th>
              <th className="p-4">Retirement Age</th>
              <th className="p-4">Retirement Date</th>
              <th className="p-4">Contract</th>
              <th className="p-4">Remaining Time</th>
              <th className="p-4">Retirement Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="hover:bg-emerald-50/60">
                <td className="p-4 font-medium">
                  <Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4">{formatDate(row.birthDate)}</td>
                <td className="p-4">{row.currentAge} tahun</td>
                <td className="p-4">{row.retirementAge} tahun</td>
                <td className="p-4">{formatDate(row.retirementDate)}</td>
                <td className="p-4">
                  <Badge variant={row.extensionStatus === "Extended" ? "warning" : "outline"}>{row.extensionStatus}</Badge>
                  {row.retirementNotes && <p className="mt-1 text-xs text-muted-foreground">{row.retirementNotes}</p>}
                  <RetirementContractDialog
                    profileId={row.profileId}
                    name={row.name}
                    retirementAge={row.retirementAge}
                    retirementExtendedUntil={row.retirementExtendedUntil}
                    retirementNotes={row.retirementNotes}
                  />
                </td>
                <td className="p-4">
                  <p>{row.remainingTime}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.yearsToRetirement} tahun</p>
                </td>
                <td className="p-4"><RetirementStatusBadge status={row.retirementStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function RetirementStatusBadge({ status }: { status: string }) {
  const variant = status === "Overdue" || status === "Critical" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
