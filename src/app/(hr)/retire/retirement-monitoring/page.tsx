import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { Hourglass, Pencil } from "lucide-react";
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
  const session = await requireAuth();
  if (!isRoutePermitted("/retire/retirement-monitoring", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const filters = await searchParams;
  const [rows, options] = await Promise.all([listRetirementMonitoring(filters), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Retire"
        title="Retirement Monitoring"
        description="Monitoring masa pensiun karyawan aktif dan perpanjangan kontrak kerja. Status warning dimulai 2 tahun menjelang pensiun. Usia pensiun default 55 tahun dan dapat disesuaikan mengikuti kontrak."
        icon={Hourglass}
      />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedPosition={filters.position}
        qPlaceholder="Search employee, position, atau NIK baru..."
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
              <th className="p-4">Birth Date</th>
              <th className="p-4">Current Age</th>
              <th className="p-4">Retirement Age</th>
              <th className="p-4">Retirement Date</th>
              <th className="p-4">Contract</th>
              <th className="p-4">New NIK</th>
              <th className="p-4">New Business Unit</th>
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
                    retirementNewNik={row.retirementNewNik}
                    retirementNewBusinessUnit={row.retirementNewBusinessUnit}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <span className={row.retirementNewNik ? "font-semibold text-slate-900" : "text-muted-foreground"}>
                      {row.retirementNewNik || "-"}
                    </span>
                    <RetirementContractDialog
                      profileId={row.profileId}
                      name={row.name}
                      retirementAge={row.retirementAge}
                      retirementExtendedUntil={row.retirementExtendedUntil}
                      retirementNotes={row.retirementNotes}
                      retirementNewNik={row.retirementNewNik}
                      retirementNewBusinessUnit={row.retirementNewBusinessUnit}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                          title="Edit NIK Baru"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      }
                    />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <span className={row.retirementNewBusinessUnit ? "font-medium text-slate-900" : "text-muted-foreground"}>
                      {row.retirementNewBusinessUnit || "-"}
                    </span>
                    <RetirementContractDialog
                      profileId={row.profileId}
                      name={row.name}
                      retirementAge={row.retirementAge}
                      retirementExtendedUntil={row.retirementExtendedUntil}
                      retirementNotes={row.retirementNotes}
                      retirementNewNik={row.retirementNewNik}
                      retirementNewBusinessUnit={row.retirementNewBusinessUnit}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                          title="Edit Business Unit Baru"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      }
                    />
                  </div>
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
