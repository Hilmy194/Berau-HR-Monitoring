"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import type {
  TalentPoolCandidate,
  TalentPoolSummary,
} from "@/lib/services/talent-pool.service";
import { TalentPool12BoxGrid } from "@/components/talent/talent-pool-12box-grid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

const ALL = "__all__";

interface TalentPoolDirectoryProps {
  initialCandidates: TalentPoolCandidate[];
  summary: TalentPoolSummary;
  targetYear: number;
}

export function TalentPoolDirectory({
  initialCandidates,
  summary,
  targetYear,
}: TalentPoolDirectoryProps) {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [directorateFilter, setDirectorateFilter] = useState(ALL);
  const [retentionFilter, setRetentionFilter] = useState<"all" | "outside" | "retention">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Extract unique directorates for filter dropdown
  const directorates = useMemo(() => {
    const set = new Set<string>();
    for (const c of initialCandidates) {
      if (c.directorate && c.directorate !== "-") {
        set.add(c.directorate);
      }
    }
    return Array.from(set).sort();
  }, [initialCandidates]);

  // Compute live box counts dynamically based on active directorate and retention filters
  const liveBoxCounts = useMemo(() => {
    const counts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
    };

    for (const c of initialCandidates) {
      if (directorateFilter !== ALL && c.directorate !== directorateFilter) continue;
      if (retentionFilter === "outside" && c.isTalentRetention) continue;
      if (retentionFilter === "retention" && !c.isTalentRetention) continue;

      if (c.boxNumber) {
        counts[c.boxNumber] = (counts[c.boxNumber] || 0) + 1;
      }
    }

    return counts;
  }, [directorateFilter, initialCandidates, retentionFilter]);

  // Filter candidates list
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return initialCandidates.filter((c) => {
      // 1. Box Filter
      if (selectedBox !== null && c.boxNumber !== selectedBox) {
        return false;
      }

      // 2. Retention Filter
      if (retentionFilter === "outside" && c.isTalentRetention) return false;
      if (retentionFilter === "retention" && !c.isTalentRetention) return false;

      // 3. Directorate Filter
      if (directorateFilter !== ALL && c.directorate !== directorateFilter) {
        return false;
      }

      // 4. Search query
      if (q) {
        const match =
          c.name.toLowerCase().includes(q) ||
          c.personnelNumber.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [directorateFilter, initialCandidates, retentionFilter, searchQuery, selectedBox]);

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, page]);

  const handleBoxSelect = (boxNum: number | null) => {
    setSelectedBox(boxNum);
    setPage(1);
  };

  const resetAllFilters = () => {
    setSelectedBox(null);
    setSearchQuery("");
    setDirectorateFilter(ALL);
    setRetentionFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Evaluated */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Evaluasi 2026</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <UsersRound className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {summary.totalCandidates.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kandidat profil BigQuery
          </p>
        </div>

        {/* Outside Retention (Potensi Talent Baru) */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Di Luar 184 Retention</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
            {summary.totalOutsideRetention.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Kandidat potensi di luar daftar retention
          </p>
        </div>

        {/* Top Talent (Box 1-4) */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Top Talent (Box 1-4)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Trophy className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-sky-950">
            {summary.totalTopTalent.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-sky-700">
            STAR, Future, Emerging & Growing
          </p>
        </div>

        {/* Global Talent (Box 1-2) */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Global Talent (Box 1-2)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Star className="h-4 w-4 text-blue-600" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-950">
            {summary.totalGlobalTalent.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            STAR Leaders & Future Leaders
          </p>
        </div>
      </div>

      {/* 2. Visual Interactive 12-Box Grid */}
      <TalentPool12BoxGrid
        boxCounts={liveBoxCounts}
        selectedBox={selectedBox}
        onSelectBox={handleBoxSelect}
      />

      {/* 3. Filter & Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama karyawan, NIK, atau jabatan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Retention Scope Toggle */}
            <Select
              value={retentionFilter}
              onValueChange={(val: "all" | "outside" | "retention") => {
                setRetentionFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                <SelectValue placeholder="Scope Karyawan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Karyawan ({initialCandidates.length})</SelectItem>
                <SelectItem value="outside">Di Luar Retention ({summary.totalOutsideRetention})</SelectItem>
                <SelectItem value="retention">Khusus Retention ({summary.totalInRetention})</SelectItem>
              </SelectContent>
            </Select>

            {/* Directorate Filter */}
            <Select
              value={directorateFilter}
              onValueChange={(val) => {
                setDirectorateFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[220px] rounded-xl bg-slate-50 border-slate-200 text-xs truncate">
                <SelectValue placeholder="Filter Direktorat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Direktorat</SelectItem>
                {directorates.map((dir) => (
                  <SelectItem key={dir} value={dir}>
                    {dir}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {(selectedBox !== null || searchQuery || directorateFilter !== ALL || retentionFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl"
              >
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Menampilkan:</span>
          <span>{filteredCandidates.length} dari {initialCandidates.length} kandidat</span>
          {selectedBox !== null && (
            <Badge variant="secondary" className="gap-1 bg-primary/15 text-primary border-primary/30 font-semibold">
              Box {selectedBox} ({filteredCandidates.find(c => c.boxNumber === selectedBox)?.box?.name ?? "Box"})
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBox(null)} />
            </Badge>
          )}
          {retentionFilter === "outside" && (
            <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800">
              Khusus Di Luar 184 Talent
              <X className="h-3 w-3 cursor-pointer" onClick={() => setRetentionFilter("all")} />
            </Badge>
          )}
          {retentionFilter === "retention" && (
            <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-800">
              Khusus Talent Retention
              <X className="h-3 w-3 cursor-pointer" onClick={() => setRetentionFilter("all")} />
            </Badge>
          )}
        </div>
      </div>

      {/* 4. Candidates Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-4 py-3.5">Posisi & Departemen</th>
                <th className="px-4 py-3.5">12-Box Placement</th>
                <th className="px-4 py-3.5 text-center">PAT (23 / 24 / 25)</th>
                <th className="px-4 py-3.5 text-center">Assessment</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.length > 0 ? (
                paginatedCandidates.map((candidate) => {
                  const box = candidate.box;

                  return (
                    <tr
                      key={candidate.personnelNumber}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* 1. Karyawan */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200 bg-slate-100">
                            <AvatarFallback className="text-xs font-bold text-primary">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 leading-snug">
                                {candidate.name}
                              </span>
                              {candidate.isTalentRetention && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-[9px] px-1.5 py-0">
                                  Retention
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              NIK: {candidate.personnelNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Posisi & Departemen */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {candidate.position}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 leading-tight">
                          {candidate.directorate !== "-" ? candidate.directorate : candidate.businessUnit}
                          {candidate.department && candidate.department !== "-" ? ` • ${candidate.department}` : ""}
                        </p>
                        {candidate.jobLevel && candidate.jobLevel !== "-" && (
                          <span className="inline-block mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {candidate.jobLevel}
                          </span>
                        )}
                      </td>

                      {/* 3. 12-Box Placement */}
                      <td className="px-4 py-3.5">
                        {box ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${box.badgeClass}`}
                            >
                              Box {box.boxNumber}: {box.name}
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Pot: {candidate.potentialCategory} • Perf: {candidate.performanceCategory}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {candidate.talentClass12Box || "Unclassified"}
                          </span>
                        )}
                      </td>

                      {/* 4. PAT (2023 / 2024 / 2025) */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700" title="PAT 2023">
                            {candidate.pat2023 || "-"}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700" title="PAT 2024">
                            {candidate.pat2024 || "-"}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-900 font-bold" title="PAT 2025">
                            {candidate.pat2025 || "-"}
                          </span>
                        </div>
                      </td>

                      {/* 5. Assessment */}
                      <td className="px-4 py-3.5 text-center">
                        {candidate.iqScore ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-900">
                              IQ {candidate.iqScore} ({candidate.iqCategory ?? "-"})
                            </span>
                            <p className="text-[10px] text-slate-500">
                              DISC: {candidate.disc ?? "-"} {candidate.matchupResult ? `• ${candidate.matchupResult}%` : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum asesmen</span>
                        )}
                      </td>

                      {/* 6. Aksi */}
                      <td className="px-4 py-3.5 text-right">
                        <Button asChild size="sm" variant="outline" className="gap-1 text-xs rounded-xl hover:bg-slate-100">
                          <Link href={`/admin/employee-management/${candidate.personnelNumber}`}>
                            Talent Card <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-base">Tidak ada kandidat yang sesuai filter</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Coba ganti filter atau klik tombol Reset Filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages}</span> ({filteredCandidates.length} total kandidat)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 text-xs rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 text-xs rounded-lg"
            >
              Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
