import Link from "next/link";
import { Award, FileText, Search, ShieldCheck, CheckCircle2, AlertTriangle, Filter, BookOpen } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Matriks Sertifikasi & Izin Bekerja - Harmoni",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    pageDoc?: string;
  }>;
}

export default async function CertificationsMatrixPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = params.category || "all";
  const search = params.search?.trim() || "";
  const pageDoc = params.pageDoc || "all";

  const where: any = {};
  if (selectedCategory !== "all") {
    where.categoryNumber = parseInt(selectedCategory, 10);
  }
  if (pageDoc !== "all") {
    where.pageNumber = parseInt(pageDoc, 10);
  }
  if (search) {
    where.OR = [
      { workPermitPosition: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { internalCertificates: { contains: search, mode: "insensitive" } },
      { externalCertificates: { contains: search, mode: "insensitive" } },
      { license: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, totalCount, categoryStats] = await Promise.all([
    prisma.positionCertificationRequirement.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    }),
    prisma.positionCertificationRequirement.count(),
    prisma.positionCertificationRequirement.groupBy({
      by: ["categoryNumber", "category"],
      _count: { id: true },
      orderBy: { categoryNumber: "asc" },
    }),
  ]);

  const categories = [
    { num: "all", label: "Semua Kategori", count: totalCount },
    ...categoryStats.map((c) => ({
      num: String(c.categoryNumber),
      label: c.category.replace(" (Jabatan Fungsional - Foreman Up)", ""),
      count: c._count.id,
    })),
  ];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development & HSE"
        title="Matriks Sertifikasi & Izin Bekerja (Working Permit)"
        description="Standar Izin Bekerja di Daerah Operasi (No. Dokumen: S-HCT-04.01) — Persyaratan Wajib Lisensi, Sertifikasi Internal, dan Eksternal per Posisi (Halaman 2 - 10)."
        icon={Award}
      />

      {/* Top Statistic Highlights */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Total Posisi Terdaftar</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalCount}</div>
          <div className="mt-0.5 text-[11px] text-emerald-600 font-medium">Halaman 2 - 10 Dokumen</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Pengawas Internal</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {categoryStats.find((c) => c.categoryNumber === 2)?._count.id || 0}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Foreman Up (KPO)</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Pengawas Eksternal</div>
          <div className="mt-1 text-2xl font-bold text-cyan-600">
            {categoryStats.find((c) => c.categoryNumber === 3)?._count.id || 0}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">POP, POM & POU</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Pengawas Teknis</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {categoryStats.find((c) => c.categoryNumber === 4)?._count.id || 0}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">KEMNAKER Specialist</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Tenaga Teknis</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {categoryStats.find((c) => c.categoryNumber === 5)?._count.id || 0}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Operator, Mekanik, K3</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">SIB Management</div>
          <div className="mt-1 text-2xl font-bold text-purple-600">
            {categoryStats.find((c) => c.categoryNumber === 6)?._count.id || 0}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Izin Khusus Berisiko</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Cari nama posisi, lisensi, sertifikat internal / eksternal..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            name="category"
            defaultValue={selectedCategory}
            className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori ({totalCount})</option>
            {categoryStats.map((c) => (
              <option key={c.categoryNumber} value={String(c.categoryNumber)}>
                {c.categoryNumber}. {c.category} ({c._count.id})
              </option>
            ))}
          </select>

          <select
            name="pageDoc"
            defaultValue={pageDoc}
            className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Halaman (Hal 2 - 10)</option>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
              <option key={p} value={String(p)}>
                Halaman {p}
              </option>
            ))}
          </select>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Filter className="h-4 w-4 mr-1.5" /> Filter
          </Button>

          {(search || selectedCategory !== "all" || pageDoc !== "all") && (
            <Button asChild variant="outline">
              <Link href="/organization-development/certifications">Reset</Link>
            </Button>
          )}
        </form>

        {/* Quick Category Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t text-xs">
          {categories.map((c) => {
            const isActive = selectedCategory === c.num;
            return (
              <Link
                key={c.num}
                href={`/organization-development/certifications?category=${c.num}${search ? `&search=${encodeURIComponent(search)}` : ""}${pageDoc !== "all" ? `&pageDoc=${pageDoc}` : ""}`}
                className={`px-3 py-1.5 rounded-lg border transition font-medium ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                {c.label} ({c.count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">
              Menampilkan {rows.length} dari {totalCount} Posisi & Persyaratan Sertifikasi
            </h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono bg-background">
            Dokumen: S-HCT-04.01 Rev. 3
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold border-b">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5 w-64">Kategori & Work Permit (Posisi)</th>
                <th className="p-3.5 w-48">Lisensi & Identitas</th>
                <th className="p-3.5 min-w-[200px]">Sertifikat Internal</th>
                <th className="p-3.5 min-w-[240px]">Sertifikat Eksternal</th>
                <th className="p-3.5 w-44">Kesehatan & Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Tidak ditemukan persyaratan sertifikasi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    {/* No */}
                    <td className="p-3.5 text-center font-mono font-medium text-muted-foreground">
                      {row.orderIndex}
                    </td>

                    {/* Kategori & Work Permit */}
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground text-xs leading-snug">
                        {row.workPermitPosition}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {row.category}
                      </div>
                    </td>

                    {/* Lisensi & Identitas */}
                    <td className="p-3.5 space-y-1">
                      {row.license && (
                        <div>
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] font-mono">
                            {row.license}
                          </Badge>
                        </div>
                      )}
                      {row.employeeIdentity && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>🪪</span> {row.employeeIdentity}
                        </div>
                      )}
                      {!row.license && !row.employeeIdentity && (
                        <span className="text-muted-foreground/50 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Sertifikat Internal */}
                    <td className="p-3.5">
                      {row.internalCertificates ? (
                        <div className="flex flex-wrap gap-1">
                          {row.internalCertificates.split(",").map((c, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium"
                            >
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Sertifikat Eksternal */}
                    <td className="p-3.5">
                      {row.externalCertificates ? (
                        <div className="flex flex-wrap gap-1">
                          {row.externalCertificates.split(/\||;/).map((c, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-medium"
                            >
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Riwayat Kesehatan & Lokasi */}
                    <td className="p-3.5 space-y-1">
                      {row.healthRequirement && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-emerald-600" />
                          <span>{row.healthRequirement}</span>
                        </div>
                      )}
                      {row.location && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>📍</span> {row.location}
                        </div>
                      )}
                      {!row.healthRequirement && !row.location && (
                        <span className="text-muted-foreground/50 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
