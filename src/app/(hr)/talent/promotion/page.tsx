import { ChartNoAxesCombined, CheckCircle2, Clock, Database, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getPromotionFilterOptions, listPromotionEmployees } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PromotionImport } from "@/components/admin/promotion-import";
import { PromotionCharts, type PromotionChartData } from "@/components/admin/promotion-charts";
import { requireWorkspaceAccess } from "@/lib/session";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
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
  const [rows, allRows, options, canEdit] = await Promise.all([
    listPromotionEmployees(filters),
    filters.status ? listPromotionEmployees({ ...filters, status: undefined }) : null,
    getPromotionFilterOptions(),
    canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.TALENT, "EDITOR"),
  ]);
  const baseRows = allRows ?? rows;
  const isLive = baseRows.some((row) => "source" in row && row.source === "BIGQUERY_LIVE");

  const STAGE_COLORS: Record<string, string> = {
    "Eligible (Not Submitted)": "#f59e0b",
    "Submitted": "#0284c7",
    "Approved Div. Head": "#6366f1",
    "Verified by HRBP": "#8b5cf6",
    "Verified by HROD": "#0d9488",
    "Approved Dir./Bus. Head": "#10b981",
    "Rejected": "#ef4444",
  };

  const stageDistribution = PROMOTION_STATUS_STEPS.map((status) => ({
    name: status,
    count: baseRows.filter((r) => r.promotionStatus === status).length,
    fill: STAGE_COLORS[status] ?? "#64748b",
  }));

  const extraStatuses = Array.from(
    new Set(
      baseRows
        .map((r) => r.promotionStatus)
        .filter((status) => Boolean(status) && !PROMOTION_STATUS_STEPS.includes(status))
    )
  );
  for (const st of extraStatuses) {
    stageDistribution.push({
      name: st,
      count: baseRows.filter((r) => r.promotionStatus === st).length,
      fill: "#64748b",
    });
  }

  const statusProportions = stageDistribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.name,
      value: s.count,
      fill: s.fill,
    }));

  const pilarSummary = {
    submissionCompleted: baseRows.filter((r) => Boolean(r.isSubmissionCompleted)).length,
    submissionPending: baseRows.filter((r) => !r.isSubmissionCompleted).length,
    threeSixtyCompleted: baseRows.filter((r) => Boolean(r.is360Completed)).length,
    threeSixtyPending: baseRows.filter((r) => !r.is360Completed).length,
    presentationCompleted: baseRows.filter((r) => Boolean(r.isPresentationCompleted)).length,
    presentationScheduled: baseRows.filter((r) => !r.isPresentationCompleted && (r.promotionStatus === "Verified by HRBP" || r.promotionStatus === "Approved Div. Head")).length,
    presentationPending: baseRows.filter((r) => !r.isPresentationCompleted && r.promotionStatus !== "Verified by HRBP" && r.promotionStatus !== "Approved Div. Head").length,
  };

  const chartData: PromotionChartData = {
    stageDistribution,
    statusProportions,
    pilarSummary,
    totalCount: baseRows.length,
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Promotion"
        description="Daftar usulan promosi, pemantauan kelengkapan pengajuan, evaluasi 360°, presentasi panel, serta pemantauan kandidat eligible yang belum diajukan atasan."
        icon={ChartNoAxesCombined}
      />
      {isLive ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-linear-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Sinkronisasi Otomatis BigQuery & SAP Aktif</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  LIVE MIRROR
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Data usulan promosi, alur persetujuan, target posisi, dan nama inisiator tersinkronisasi otomatis dari SAP (p_promotion_approval_status).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-xl bg-white/80 border border-emerald-200 px-3 py-1.5 text-center">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Pengajuan</span>
              <span className="text-sm font-bold text-emerald-800">{rows.length} Usulan</span>
            </div>
          </div>
        </div>
      ) : (
        <PromotionImport canEdit={canEdit} />
      )}
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
      {/* Chart Monitoring Pipeline Promosi */}
      <PromotionCharts data={chartData} />
      <TableShell>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5">Karyawan</th>
              <th className="px-3 py-2.5">Posisi Saat Ini</th>
              <th className="px-3 py-2.5">Usulan Target Posisi</th>
              <th className="px-3 py-2.5">Organisasi (Divisi & Dept)</th>
              <th className="px-3 py-2.5">Promosi Terakhir</th>
              {/* 3 PILAR MONITORING PROMOSI */}
              <th className="px-2 py-2.5 text-center">Pengajuan</th>
              <th className="px-2 py-2.5 text-center">360°</th>
              <th className="px-2 py-2.5 text-center">Presentasi</th>
              <th className="px-3 py-2.5">Next / PIC</th>
              <th className="px-3 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-muted-foreground">
                  Belum ada data usulan promosi aktif.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const isSubCompleted = Boolean(row.isSubmissionCompleted);
              const is360 = Boolean(row.is360Completed);
              const isPres = Boolean(row.isPresentationCompleted);

              return (
                <tr key={"promotionRequestId" in row ? row.promotionRequestId : row.profileId} className="hover:bg-emerald-50/50 transition-colors">
                  {/* 1. Karyawan */}
                  <td className="px-3 py-2.5 font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {row.profileId ? (
                        <Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline font-semibold text-slate-900">
                          {row.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-900">{row.name}</span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                      {"employeeId" in row ? row.employeeId : ""}
                    </div>
                  </td>

                  {/* 2. Current Position */}
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {row.currentPosition}
                  </td>

                  {/* 3. Target Position */}
                  <td className="px-3 py-2.5">
                    {"targetPosition" in row && Boolean(row.targetPosition) ? (
                      <div>
                        <div className="font-semibold text-emerald-950 flex items-center gap-1 flex-wrap">
                          <span>{String(row.targetPosition)}</span>
                          {"targetLevel" in row && Boolean(row.targetLevel) && (
                            <span className="inline-flex items-center rounded-md bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              L{String(row.targetLevel)}
                            </span>
                          )}
                        </div>
                        {"promotionPlanDesc" in row && Boolean(row.promotionPlanDesc) && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{String(row.promotionPlanDesc)}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </td>

                  {/* 4. Organisasi (Divisi & Dept) */}
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800 text-[11.5px] leading-snug">{row.division}</div>
                    <div className="text-[10.5px] text-slate-500">{row.department !== "-" ? row.department : row.directorate}</div>
                  </td>

                  {/* 5. Promosi Terakhir & Masa Jabatan */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{formatDate(row.lastPromotionDate)}</div>
                    <div className="text-[10.5px] text-slate-500">{row.timeInCurrentPosition} di posisi</div>
                  </td>

                  {/* 6. Pilar 1: Pengajuan */}
                  <td className="px-2 py-2.5 text-center">
                    {isSubCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                        <Clock className="h-2.5 w-2.5 text-amber-600" /> Belum
                      </span>
                    )}
                  </td>

                  {/* 7. Pilar 2: 360° Review */}
                  <td className="px-2 py-2.5 text-center">
                    {is360 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
                        Belum
                      </span>
                    )}
                  </td>

                  {/* 8. Pilar 3: Presentasi */}
                  <td className="px-2 py-2.5 text-center">
                    {isPres ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10.5px] font-bold text-blue-800">
                        <CheckCircle2 className="h-2.5 w-2.5 text-blue-600" /> Selesai
                      </span>
                    ) : row.promotionStatus === "Verified by HRBP" || row.promotionStatus === "Approved Div. Head" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10.5px] font-bold text-sky-800">
                        Terjadwal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
                        Belum
                      </span>
                    )}
                  </td>

                  {/* 9. Next / PIC */}
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-800 text-[11.5px]">
                      {"nextPromotionStatus" in row && Boolean(row.nextPromotionStatus)
                        ? String(row.nextPromotionStatus)
                        : row.nextPromotionPic.split("/")[0]?.trim() || "-"}
                    </div>
                    {"initiatorName" in row && Boolean(row.initiatorName) ? (
                      <div className="text-[10.5px] text-slate-500 mt-0.5">Pengusul: {String(row.initiatorName)}</div>
                    ) : (
                      row.nextPromotionPic.includes("/") && (
                        <div className="text-[10.5px] text-slate-500 mt-0.5">{row.nextPromotionPic.split("/")[1]?.trim()}</div>
                      )
                    )}
                  </td>

                  {/* 10. Current Status */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <Badge variant={statusVariant(row.promotionStatus)} className="text-[10.5px] px-2 py-0.5">
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
