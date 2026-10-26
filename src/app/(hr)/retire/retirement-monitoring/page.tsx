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
  const filtersWithoutBu = { ...filters };
  delete filtersWithoutBu.businessUnit;
  delete filtersWithoutBu.bu;

  const [rows, allRowsForCounts, options] = await Promise.all([
    listRetirementMonitoring(filters),
    listRetirementMonitoring(filtersWithoutBu),
    getEmployeeFilterOptions(),
  ]);

  const isAllWindow = filters.window === "all";
  const activeBu = (filters.businessUnit ?? filters.bu ?? "ALL").toUpperCase();
  const totalCount = allRowsForCounts.length;
  const bcCount = allRowsForCounts.filter((r) => (r.businessUnit || "").toUpperCase().includes("BERAU COAL")).length;
  const mtlCount = allRowsForCounts.filter(
    (r) => (r.businessUnit || "").toUpperCase().includes("MUTIARA TANJUNG LESTARI") || (r.businessUnit || "").toUpperCase().includes("MTL")
  ).length;
  const otherCount = totalCount - bcCount - mtlCount;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Retire"
        title="Retirement Monitoring"
        description="Monitoring masa pensiun karyawan aktif dan perpanjangan kontrak kerja. Status warning dimulai 2 tahun menjelang pensiun. Usia pensiun default 55 tahun dan dapat disesuaikan mengikuti kontrak."
        icon={Hourglass}
      />

      {/* Quick Filter Bar: Business Unit & Window */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unit:
          </span>
          <Link
            href={buildFilterHref(filters, { businessUnit: "ALL" })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
              activeBu === "ALL"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Semua Unit
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeBu === "ALL" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {totalCount}
            </span>
          </Link>
          <Link
            href={buildFilterHref(filters, { businessUnit: "BERAU COAL" })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
              activeBu === "BERAU COAL" || activeBu === "BC"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Berau Coal (BC)
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeBu === "BERAU COAL" || activeBu === "BC" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {bcCount}
            </span>
          </Link>
          <Link
            href={buildFilterHref(filters, { businessUnit: "MUTIARA TANJUNG LESTARI" })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
              activeBu === "MUTIARA TANJUNG LESTARI" || activeBu === "MTL"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Mutiara Tanjung Lestari (MTL)
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeBu === "MUTIARA TANJUNG LESTARI" || activeBu === "MTL" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {mtlCount}
            </span>
          </Link>
          {otherCount > 0 && (
            <Link
              href={buildFilterHref(filters, { businessUnit: "OTHER" })}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                activeBu === "OTHER" || activeBu === "GMO"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              Lainnya (GMO/Poltek)
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeBu === "OTHER" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                {otherCount}
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
          <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rentang:
          </span>
          <Link
            href={buildFilterHref(filters, { window: undefined })}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              !isAllWindow
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            5 Tahun Menjelang Pensiun
          </Link>
          <Link
            href={buildFilterHref(filters, { window: "all" })}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              isAllWindow
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Karyawan
          </Link>
        </div>
      </div>

      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedPosition={filters.position}
        qPlaceholder="Search employee, position, unit, atau NIK baru..."
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
              <th className="p-4">Current Business Unit</th>
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
                <td className="p-4 font-medium uppercase text-slate-800 whitespace-nowrap">
                  {row.businessUnit?.toUpperCase() || "-"}
                </td>
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

function buildFilterHref(
  currentFilters: Record<string, string | undefined>,
  overrides: { businessUnit?: string; window?: string }
) {
  const params = new URLSearchParams();
  Object.entries(currentFilters).forEach(([k, v]) => {
    if (v && k !== "businessUnit" && k !== "bu" && k !== "window") {
      params.set(k, v);
    }
  });

  const targetBu = overrides.businessUnit ?? currentFilters.businessUnit ?? currentFilters.bu;
  if (targetBu && targetBu !== "ALL") {
    params.set("businessUnit", targetBu);
  }

  const targetWindow = overrides.window !== undefined ? overrides.window : currentFilters.window;
  if (targetWindow && targetWindow !== "5y") {
    params.set("window", targetWindow);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "/retire/retirement-monitoring";
}

function RetirementStatusBadge({ status }: { status: string }) {
  const variant = status === "Overdue" || status === "Critical" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
