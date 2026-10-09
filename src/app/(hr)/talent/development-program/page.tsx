import { Award, Calendar, CheckCircle2, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ModuleHero, TableShell, EmptyState } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getDevelopmentProgramPageData } from "@/lib/services/hr-modules.service";
import { formatDate } from "@/lib/utils";
import { isTalentRetentionName } from "@/lib/data/talent-retention-list";

export const metadata = { title: "Development Program - Harmoni" };

function getRatingBadge(rating?: string | null) {
  if (!rating) return <span className="text-slate-400">-</span>;
  const normalized = rating.toUpperCase();
  if (normalized.includes("HIGH") || normalized.includes("EXCELLENT") || normalized.includes("PASS") || normalized.includes("LULUS")) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium whitespace-nowrap">
        {rating}
      </Badge>
    );
  }
  if (normalized.includes("SATISFACTORY") || normalized.includes("GOOD") || normalized.includes("BAIK")) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium whitespace-nowrap">
        {rating}
      </Badge>
    );
  }
  if (normalized.includes("REVISE") || normalized.includes("EXTEND") || normalized.includes("DEVELOP")) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium whitespace-nowrap">
        {rating}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-medium whitespace-nowrap">
      {rating}
    </Badge>
  );
}

export default async function DevelopmentProgramPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = await searchParams;
  const { rows, options } = await getDevelopmentProgramPageData(filters);

  // Compute quick summary stats
  const uniqueEmployees = new Set(rows.map((r) => r.profileId)).size;
  const uniquePrograms = new Set(rows.map((r) => r.programName)).size;
  const scores = rows.map((r) => r.finalScore).filter((s): s is number => typeof s === "number" && !isNaN(s));
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";

  return (
    <div className="space-y-5">
      <ModuleHero
        eyebrow="Talent Management"
        title="Development Program"
        description="Rekam jejak program pengembangan karyawan (BigQuery p_dp_history), mencakup batch, tahun pelaksanaan, hasil evaluasi, masa kerja, dan tahun bergabung."
        icon={GraduationCap}
      />

      {/* Summary KPI Mini Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Total Catatan DP</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900">{rows.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Karyawan Terdaftar</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900">{uniqueEmployees} orang</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Program Unik</span>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900">{uniquePrograms} program</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Rata-rata Skor</span>
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900">{avgScore}</div>
        </div>
      </div>

      {/* Cascading Filter Bar with Join Year, DP Year & Talent */}
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedJoinYear={filters.joinYear}
        selectedDpYear={filters.dpYear}
        selectedTalent={filters.talent}
        showJoinYear={true}
        showDpYear={true}
        showTalent={true}
        joinYears={(options as any).joinYears ?? []}
        dpYears={(options as any).dpYears ?? []}
        qPlaceholder="Cari nama karyawan, jabatan, atau program..."
        orgOptions={options.orgOptions}
        resetHref="/talent/development-program"
      />

      {/* Compact High-Density Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Menampilkan <strong>{rows.length}</strong> catatan program pengembangan</span>
          <span className="text-[11px] text-slate-400">Format tabel disesuaikan untuk tampilan tanpa scroll horizontal</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState message="Tidak ada data program pengembangan yang cocok dengan filter yang dipilih." />
        ) : (
          <TableShell>
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center text-slate-400">No</th>
                  <th className="px-3 py-2.5">Karyawan &amp; Posisi</th>
                  <th className="px-3 py-2.5">Departemen &amp; Divisi</th>
                  <th className="px-3 py-2.5">Program &amp; Batch</th>
                  <th className="px-3 py-2.5 text-center">Tahun DP</th>
                  <th className="px-3 py-2.5 text-center">Hasil &amp; Skor</th>
                  <th className="px-3 py-2.5 text-center">Tahun Join</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Promosi Terakhir</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Masa di Posisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, index) => (
                  <tr
                    key={`${row.profileId}-${row.programName}-${row.year ?? "no-year"}-${row.programBatch ?? "no-batch"}-${index}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* No */}
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Employee & Current Position (Combined for compactness) */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/admin/employee-management/${row.profileId}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                        >
                          {row.employeeName}
                        </Link>
                        {isTalentRetentionName(row.employeeName) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold px-1.5 py-0">
                            👑 Talent
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1" title={row.currentPosition}>
                        {row.currentPosition}
                      </div>
                    </td>

                    {/* Department & Division */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800 line-clamp-1" title={row.department}>
                        {row.department}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1" title={`${row.division} · ${row.directorate}`}>
                        {row.division}
                      </div>
                    </td>

                    {/* Program & Batch */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-900 line-clamp-1" title={row.programName}>
                        {row.programName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {row.programBatch ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                            Batch {row.programBatch}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Year of DP */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {row.year ? (
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                          {row.year}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Score & Rating */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        {row.finalScore !== null && row.finalScore !== undefined ? (
                          <span className="font-bold text-slate-900 text-xs">
                            {row.finalScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                        {getRatingBadge(row.finalRating)}
                      </div>
                    </td>

                    {/* Join Year */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap font-mono text-[11px] text-slate-700">
                      {row.joinYear ? (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 font-medium">
                          {row.joinYear}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Last Promotion Date */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-[11px] text-slate-600">
                      {formatDate(row.lastPromotionDate)}
                    </td>

                    {/* Time in Current Position */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-[11px] font-medium text-slate-700">
                      {row.timeInCurrentPosition ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </div>
    </div>
  );
}
