import { ChartNoAxesCombined, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getPromotionFilterOptions, listPromotionEmployees } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PromotionImport } from "@/components/admin/promotion-import";
import { requireWorkspaceAccess } from "@/lib/session";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import { isTalentRetentionName } from "@/lib/data/talent-retention-list";
import { isSuperAdmin } from "@/lib/roles";

export const metadata = { title: "Talent Promotion - Harmoni" };

const PROMOTION_STATUS_STEPS = [
  "Eligible (Not Submitted)",
  "Submitted",
  "Approved Div. Head",
  "Verified by HRBP",
  "Verified by HROD",
  "Approved Dir./Bus. Head",
  "Rejected",
];

export default async function PromotionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [filters, session] = await Promise.all([searchParams, requireWorkspaceAccess(WORKSPACE.TALENT)]);
  const isSuper = isSuperAdmin(session.user.role);
  const [rows, options, canEdit] = await Promise.all([
    listPromotionEmployees(filters),
    getPromotionFilterOptions(),
    canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.TALENT, "EDITOR"),
  ]);
  const statusCounts = Object.fromEntries(PROMOTION_STATUS_STEPS.map((status) => [status, rows.filter((row) => row.promotionStatus === status).length]));

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Promotion"
        description="Daftar usulan promosi, pemantauan kelengkapan pengajuan, evaluasi 360°, presentasi panel, serta pemantauan kandidat eligible yang belum diajukan atasan."
        icon={ChartNoAxesCombined}
      />
      <PromotionImport canEdit={canEdit} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedStatus={filters.status}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
        statuses={options.statuses}
        showStatus
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Promotion Request" value={rows.length} highlight />
        <SummaryCard
          label="Eligible (Not Submitted)"
          value={statusCounts["Eligible (Not Submitted)"] ?? 0}
          sub="Belum Diajukan Atasan"
          warning
        />
        {PROMOTION_STATUS_STEPS.filter((s) => s !== "Eligible (Not Submitted)").map((status) => (
          <SummaryCard key={status} label={status} value={statusCounts[status] ?? 0} />
        ))}
      </section>
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-slate-200">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Current Position</th>
              <th className="p-4">Directorate</th>
              <th className="p-4">Division</th>
              <th className="p-4">Department</th>
              <th className="p-4">Last Promotion</th>
              <th className="p-4">Time in Position</th>
              {/* 3 PILAR MONITORING PROMOSI */}
              <th className="p-4 text-center">Pengajuan</th>
              <th className="p-4 text-center">360° Review</th>
              <th className="p-4 text-center">Presentasi</th>
              <th className="p-4">Next / PIC</th>
              <th className="p-4 text-center">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-muted-foreground">
                  Belum ada data promosi. Download template, isi data, lalu upload CSV.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const isTalent = isTalentRetentionName(row.name);
              const isSubCompleted = Boolean(row.isSubmissionCompleted);
              const is360 = Boolean(row.is360Completed);
              const isPres = Boolean(row.isPresentationCompleted);

              return (
                <tr key={"promotionRequestId" in row ? row.promotionRequestId : row.profileId} className="hover:bg-emerald-50/60 transition-colors">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {row.profileId ? (
                        <Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">
                          {row.name}
                        </Link>
                      ) : (
                        <span>{row.name}</span>
                      )}
                      {isSuper && isTalent && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold px-1.5 py-0">
                          👑 Talent
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{row.currentPosition}</td>
                  <td className="p-4">{row.directorate}</td>
                  <td className="p-4">{row.division}</td>
                  <td className="p-4">{row.department}</td>
                  <td className="p-4">{formatDate(row.lastPromotionDate)}</td>
                  <td className="p-4">{row.timeInCurrentPosition}</td>
                  {/* Pilar 1: Pengajuan */}
                  <td className="p-4 text-center">
                    {isSubCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Sudah Diajukan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <Clock className="h-3 w-3 text-amber-600" /> Belum Diajukan
                      </span>
                    )}
                  </td>
                  {/* Pilar 2: 360° Review */}
                  <td className="p-4 text-center">
                    {is360 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                        Belum Lengkap
                      </span>
                    )}
                  </td>
                  {/* Pilar 3: Presentasi */}
                  <td className="p-4 text-center">
                    {isPres ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" /> Selesai
                      </span>
                    ) : row.promotionStatus === "Verified by HRBP" || row.promotionStatus === "Approved Div. Head" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                        Terjadwal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700">{row.nextPromotionPic}</td>
                  <td className="p-4 text-center">
                    <Badge variant={statusVariant(row.promotionStatus)}>
                      {row.promotionStatus}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
  warning,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all ${
        highlight
          ? "border-emerald-200 bg-emerald-50/50"
          : warning
          ? "border-amber-200 bg-amber-50/50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {sub && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            {sub}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function statusVariant(status: string): "secondary" | "warning" | "success" | "destructive" | "outline" {
  if (status === "Rejected") return "destructive";
  if (status === "Approved Dir./Bus. Head") return "success";
  if (status === "Eligible (Not Submitted)") return "warning";
  if (status === "Submitted") return "secondary";
  if (PROMOTION_STATUS_STEPS.includes(status)) return "secondary";
  return "outline";
}
