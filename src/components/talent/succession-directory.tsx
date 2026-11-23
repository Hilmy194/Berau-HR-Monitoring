"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  SuccessionSummary,
  SuccessionTarget,
  SuccessorDirectoryRow,
} from "@/lib/services/succession.service";
import { SuccessionCreateModal } from "./succession-create-modal";
import { cn } from "@/lib/utils";

interface SuccessionDirectoryProps {
  targets: SuccessionTarget[];
  summary: SuccessionSummary;
  successors: SuccessorDirectoryRow[];
}

export function SuccessionDirectory({ targets, summary, successors }: SuccessionDirectoryProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"by-target" | "by-talent">("by-target");
  const [searchQuery, setSearchQuery] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<string>("ALL");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filtered targets & matching successors for Primary Table ("by-target")
  const filteredTargets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return targets
      .filter((target) => selectedTargetId === "ALL" || target.id === selectedTargetId)
      .map((target) => {
        const matchingSuccessors = target.successors.filter((succ) => {
          const matchReadiness =
            readinessFilter === "ALL" || succ.readiness === readinessFilter;
          const matchQuery =
            !q ||
            target.incumbentName.toLowerCase().includes(q) ||
            target.positionTitle.toLowerCase().includes(q) ||
            target.division.toLowerCase().includes(q) ||
            succ.name.toLowerCase().includes(q) ||
            (succ.currentPosition && succ.currentPosition.toLowerCase().includes(q)) ||
            (succ.department && succ.department.toLowerCase().includes(q));
          return matchReadiness && matchQuery;
        });

        return {
          ...target,
          successors: matchingSuccessors,
        };
      })
      .filter((target) => target.successors.length > 0);
  }, [targets, selectedTargetId, searchQuery, readinessFilter]);

  // Total candidates displayed in current target view
  const totalDisplayedCandidates = useMemo(() => {
    return filteredTargets.reduce((acc, t) => acc + t.successors.length, 0);
  }, [filteredTargets]);

  // Filter successors for Candidate View ("by-talent")
  const filteredSuccessors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return successors.filter((row) => {
      const matchQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        (row.currentPosition && row.currentPosition.toLowerCase().includes(q)) ||
        (row.department && row.department.toLowerCase().includes(q)) ||
        row.assignments.some(
          (a) =>
            a.targetIncumbentName.toLowerCase().includes(q) ||
            a.targetPositionTitle.toLowerCase().includes(q)
        );

      const matchReadiness =
        readinessFilter === "ALL" ||
        row.assignments.some((a) => a.readiness === readinessFilter);

      return matchQuery && matchReadiness;
    });
  }, [successors, searchQuery, readinessFilter]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SUMMARY METRIC CARDS (Tetap di bagian atas)                            */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-xs bg-linear-to-br from-indigo-50/50 to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Posisi Kunci / Incumbent
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalTargetPositions} Posisi
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Struktural Operations &amp; HSE</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-linear-to-br from-purple-50/50 to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Suksesor Terpetakan
              </p>
              <h3 className="text-2xl font-bold text-purple-900 mt-1">
                {summary.totalUniqueSuccessors} Karyawan
              </h3>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Tagged as Succession</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <UsersRound className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-linear-to-br from-emerald-50/50 to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Ready Now
              </p>
              <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                {summary.readyNowCount} Nominasi
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Siap Promosi / Mutasi</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-linear-to-br from-amber-50/50 to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ready Later / Development
              </p>
              <h3 className="text-2xl font-bold text-amber-900 mt-1">
                {summary.readyLaterCount + summary.generalCount} Nominasi
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">Jalur IDP &amp; Pelatihan</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER BAR & INPUT SUKSESOR                                            */}
      {/* ========================================================================= */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* View Switcher: Pejabat & Kandidat (Default) vs Per Kandidat */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("by-target")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all",
                  viewMode === "by-target"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                <span>Peta Pejabat &amp; Kandidat</span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-slate-200 text-slate-700">
                  {targets.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by-talent")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all",
                  viewMode === "by-talent"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                <span>Daftar per Kandidat</span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-slate-200 text-slate-700">
                  {successors.length}
                </Badge>
              </button>
            </div>

            {/* Controls: Search, Select Filter & Tombol Input Suksesor */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-60 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    viewMode === "by-target"
                      ? "Cari pejabat, suksesor, posisi..."
                      : "Cari nama kandidat suksesor..."
                  }
                  className="h-9 pl-8 text-xs bg-slate-50/70 border-slate-200 focus-visible:bg-white"
                />
              </div>

              {/* Filter Pejabat (Active in by-target view) */}
              {viewMode === "by-target" && (
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Semua Pejabat Kunci</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.incumbentName} ({t.positionTitle})
                    </option>
                  ))}
                </select>
              )}

              {/* Filter Kesiapan */}
              <select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">Semua Kesiapan</option>
                <option value="READY_NOW">Hanya Ready Now</option>
                <option value="READY_LATER">Hanya Ready Later</option>
              </select>

              {/* Tombol Input Suksesor Manual */}
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-9 px-3.5 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs shrink-0 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                <span>Input Suksesor</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3. TABEL DETAIL SUKSESOR                                                  */}
      {/* ========================================================================= */}
      {viewMode === "by-target" ? (
        /* ======================================================================= */
        /* TABEL 1: PETA PEJABAT & KANDIDAT (Adit -> Meira, Haris, dst)            */
        /* ======================================================================= */
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                Peta Suksesi Kepemimpinan (Pejabat &amp; Kandidat Suksesor)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan <strong>{filteredTargets.length}</strong> pejabat/posisi kunci dengan <strong>{totalDisplayedCandidates}</strong> nominasi calon suksesor.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready Now
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Ready Later
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1120px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="p-3.5 pl-5 min-w-[250px]">Pejabat / Posisi Kunci</th>
                  <th className="p-3.5 min-w-[220px]">Kandidat Suksesor</th>
                  <th className="p-3.5 min-w-[200px]">Jabatan Saat Ini</th>
                  <th className="p-3.5 min-w-[190px]">Divisi / Departemen</th>
                  <th className="p-3.5 text-center min-w-[70px]">Gol.</th>
                  <th className="p-3.5 min-w-[125px]">Kesiapan</th>
                  <th className="p-3.5 min-w-[120px]">Jalur Sumber</th>
                  <th className="p-3.5 min-w-[160px]">Catatan Prioritas</th>
                  <th className="p-3.5 pr-5 text-right min-w-[130px]">Detail IDP</th>
                </tr>
              </thead>

              {filteredTargets.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UsersRound className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Data suksesi tidak ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter yang digunakan.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                filteredTargets.map((target) => (
                  <tbody
                    key={target.id}
                    className="divide-y divide-slate-100 border-b-2 border-slate-200/90"
                  >
                    {target.successors.map((candidate, idx) => (
                      <tr
                        key={`${target.id}-${candidate.name}-${idx}`}
                        className="hover:bg-purple-50/20 transition-colors"
                      >
                        {/* Kolom 1: Pejabat Target dengan rowSpan (contoh: Adit -> Meira, Haris) */}
                        {idx === 0 && (
                          <td
                            rowSpan={target.successors.length}
                            className="align-top border-r border-slate-200 bg-slate-50/50 p-4 pl-5 min-w-[250px]"
                          >
                            <div className="space-y-1.5 sticky top-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-slate-900 leading-snug">
                                  {target.incumbentName}
                                </span>
                                {target.golongan && (
                                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0">
                                    Gol. {target.golongan}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-indigo-950 leading-snug">
                                {target.positionTitle}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {target.division}
                              </p>
                              <div className="pt-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5">
                                  <UsersRound className="h-3 w-3 text-purple-600 shrink-0" />
                                  {target.successors.length} Calon Suksesor
                                </span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Kolom 2: Candidate (Kandidat Suksesor) */}
                        <td className="p-3.5 align-middle min-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 w-4 shrink-0">
                              #{candidate.priorityOrder ?? idx + 1}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-200">
                              {candidate.name
                                .split(" ")
                                .slice(0, 2)
                                .map((p) => p[0])
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate" title={candidate.name}>
                                {candidate.name}
                              </p>
                              {candidate.nik && (
                                <p className="text-[10px] font-mono text-slate-400">NIK: {candidate.nik}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kolom 3: Jabatan Saat Ini */}
                        <td className="p-3.5 align-middle text-xs font-medium text-slate-800 min-w-[200px]">
                          <span className="line-clamp-2" title={candidate.currentPosition}>
                            {candidate.currentPosition || "-"}
                          </span>
                        </td>

                        {/* Kolom 4: Divisi / Departemen */}
                        <td className="p-3.5 align-middle text-xs text-slate-600 min-w-[190px]">
                          <span className="line-clamp-2" title={candidate.department}>
                            {candidate.department || "-"}
                          </span>
                        </td>

                        {/* Kolom 5: Golongan */}
                        <td className="p-3.5 align-middle text-center min-w-[70px]">
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                            {candidate.golongan || "-"}
                          </span>
                        </td>

                        {/* Kolom 6: Kesiapan */}
                        <td className="p-3.5 align-middle min-w-[125px]">
                          {candidate.readiness === "READY_NOW" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold gap-1 px-2 py-0.5 hover:bg-emerald-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                              Ready Now
                            </Badge>
                          ) : candidate.readiness === "READY_LATER" ? (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold gap-1 px-2 py-0.5 hover:bg-amber-100">
                              <Clock className="h-3 w-3 text-amber-700 shrink-0" />
                              Ready Later
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50 border-slate-200">
                              Kandidat
                            </Badge>
                          )}
                        </td>

                        {/* Kolom 7: Jalur Sumber */}
                        <td className="p-3.5 align-middle min-w-[120px]">
                          {candidate.source === "INTERNAL_SUBDIV" ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Internal Subdiv
                            </span>
                          ) : candidate.source === "OUTSIDE_ORGANIZATION" ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                              Lintas Divisi
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">-</span>
                          )}
                        </td>

                        {/* Kolom 8: Catatan Prioritas */}
                        <td className="p-3.5 align-middle text-[11px] text-slate-500 min-w-[160px]">
                          <span className="line-clamp-2" title={candidate.notes || ""}>
                            {candidate.notes || "-"}
                          </span>
                        </td>

                        {/* Kolom 9: Aksi IDP / Detail Development */}
                        <td className="p-3.5 pr-5 align-middle text-right min-w-[130px]">
                          <Link
                            href={`/learning/idp?detail=${encodeURIComponent(candidate.name)}`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 hover:text-purple-900 transition-colors shadow-2xs rounded-lg"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              <span>Lihat IDP</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))
              )}
            </table>
          </div>
        </Card>
      ) : (
        /* ======================================================================= */
        /* TABEL 2: DAFTAR PER KANDIDAT (Dia Suksesor Siapa?)                      */
        /* ======================================================================= */
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                Daftar Suksesor Terpetakan (By Talent)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan <strong>{filteredSuccessors.length}</strong> karyawan yang dinominasikan dalam jalur suksesi kepemimpinan.
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1080px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="p-3.5 pl-5 min-w-[220px]">Karyawan Suksesor</th>
                  <th className="p-3.5 min-w-[200px]">Jabatan Saat Ini</th>
                  <th className="p-3.5 min-w-[190px]">Divisi / Departemen</th>
                  <th className="p-3.5 text-center min-w-[70px]">Gol.</th>
                  <th className="p-3.5 min-w-[260px]">Disiapkan Sebagai Suksesor Untuk</th>
                  <th className="p-3.5 text-center min-w-[90px]">Total Target</th>
                  <th className="p-3.5 pr-5 text-right min-w-[130px]">Detail IDP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuccessors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UsersRound className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Karyawan tidak ditemukan</p>
                        <p className="text-xs text-slate-400">Coba gunakan kata kunci pencarian yang lain.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuccessors.map((employee) => (
                    <tr key={employee.name} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kolom 1: Karyawan */}
                      <td className="p-3.5 pl-5 align-middle min-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-200">
                            {employee.name
                              .split(" ")
                              .slice(0, 2)
                              .map((p) => p[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{employee.name}</p>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] px-1.5 py-0 mt-0.5">
                              🎯 Candidate Successor
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Jabatan */}
                      <td className="p-3.5 align-middle text-xs font-medium text-slate-800 min-w-[200px]">
                        <span className="line-clamp-2">{employee.currentPosition || "-"}</span>
                      </td>

                      {/* Kolom 3: Departemen */}
                      <td className="p-3.5 align-middle text-xs text-slate-600 min-w-[190px]">
                        <span className="line-clamp-2">{employee.department || "-"}</span>
                      </td>

                      {/* Kolom 4: Golongan */}
                      <td className="p-3.5 align-middle text-center min-w-[70px]">
                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                          {employee.golongan || "-"}
                        </span>
                      </td>

                      {/* Kolom 5: Target Suksesi */}
                      <td className="p-3.5 align-middle min-w-[260px]">
                        <div className="space-y-1.5">
                          {employee.assignments.map((assignment, idx) => (
                            <div
                              key={`${assignment.targetIncumbentName}-${idx}`}
                              className="flex items-center justify-between gap-2 bg-slate-50/80 rounded-md p-1.5 border border-slate-200/80 text-[11px]"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <Compass className="h-3 w-3 text-purple-600 shrink-0" />
                                  <span className="font-bold text-slate-900 truncate">
                                    {assignment.targetIncumbentName}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate pl-4">
                                  {assignment.targetPositionTitle}
                                </p>
                              </div>
                              <div className="shrink-0">
                                {assignment.readiness === "READY_NOW" ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold px-1.5 py-0">
                                    Ready Now
                                  </Badge>
                                ) : assignment.readiness === "READY_LATER" ? (
                                  <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[9px] font-bold px-1.5 py-0">
                                    Ready Later
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] text-slate-600 bg-white">
                                    Kandidat
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Kolom 6: Total Target */}
                      <td className="p-3.5 align-middle text-center min-w-[90px]">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                          {employee.assignments.length}
                        </span>
                      </td>

                      {/* Kolom 7: Detail IDP */}
                      <td className="p-3.5 pr-5 align-middle text-right min-w-[130px]">
                        <Link
                          href={`/learning/idp?detail=${encodeURIComponent(employee.name)}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 hover:text-purple-900 transition-colors shadow-2xs rounded-lg"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                            <span>Lihat IDP</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL INPUT SUKSESOR MANUAL                                            */}
      {/* ========================================================================= */}
      <SuccessionCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        knownTargets={targets}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
