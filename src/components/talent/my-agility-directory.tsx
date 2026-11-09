"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  User,
  UserCheck,
  UserX,
  UsersRound,
  X,
} from "lucide-react";
import type {
  MyAgilityMonitoringData,
  MyAgilitySubordinate,
  MyAgilitySupervisorSummary,
} from "@/lib/services/my-agility.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface MyAgilityDirectoryProps {
  data: MyAgilityMonitoringData;
}

export function MyAgilityDirectory({ data }: MyAgilityDirectoryProps) {
  const [activeTab, setActiveTab] = useState<"subordinates" | "supervisors">("subordinates");

  // Subordinates tab filters
  const [subSearch, setSubSearch] = useState("");
  const [subAspFilter, setSubAspFilter] = useState<"all" | "filled" | "pending">("all");
  const [subReviewFilter, setSubReviewFilter] = useState<"all" | "reviewed" | "pending">("all");
  const [subDirectorateFilter, setSubDirectorateFilter] = useState(ALL);
  const [subPage, setSubPage] = useState(1);

  // Supervisors tab filters
  const [supSearch, setSupSearch] = useState("");
  const [supStatusFilter, setSupStatusFilter] = useState<"all" | "completed" | "in_progress" | "not_started">("all");
  const [supDirectorateFilter, setSupDirectorateFilter] = useState(ALL);
  const [supPage, setSupPage] = useState(1);

  // Modals state
  const [selectedAspiration, setSelectedAspiration] = useState<MyAgilitySubordinate | null>(null);
  const [selectedSupervisorTeam, setSelectedSupervisorTeam] = useState<MyAgilitySupervisorSummary | null>(null);

  const pageSize = 15;

  // Extract unique directorates
  const directorates = useMemo(() => {
    const set = new Set<string>();
    for (const s of data.subordinates) {
      if (s.directorate && s.directorate !== "-") set.add(s.directorate);
    }
    return Array.from(set).sort();
  }, [data.subordinates]);

  // Filter Subordinates
  const filteredSubordinates = useMemo(() => {
    return data.subordinates.filter((s) => {
      if (subAspFilter === "filled" && !s.isAspirationFilled) return false;
      if (subAspFilter === "pending" && s.isAspirationFilled) return false;

      if (subReviewFilter === "reviewed" && !s.isSupervisorReviewFilled) return false;
      if (subReviewFilter === "pending" && s.isSupervisorReviewFilled) return false;

      if (subDirectorateFilter !== ALL && s.directorate !== subDirectorateFilter) return false;

      if (subSearch.trim()) {
        const q = subSearch.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.personnelNumber.toLowerCase().includes(q) ||
          s.position.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.supervisorName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [data.subordinates, subAspFilter, subDirectorateFilter, subReviewFilter, subSearch]);

  // Subordinates pagination
  const totalSubPages = Math.ceil(filteredSubordinates.length / pageSize) || 1;
  const paginatedSubordinates = useMemo(() => {
    const start = (subPage - 1) * pageSize;
    return filteredSubordinates.slice(start, start + pageSize);
  }, [filteredSubordinates, subPage]);

  // Filter Supervisors
  const filteredSupervisors = useMemo(() => {
    return data.supervisors.filter((s) => {
      if (supStatusFilter === "completed" && s.status !== "Completed") return false;
      if (supStatusFilter === "in_progress" && s.status !== "In Progress") return false;
      if (supStatusFilter === "not_started" && s.status !== "Not Started") return false;

      if (supDirectorateFilter !== ALL && s.directorate !== supDirectorateFilter) return false;

      if (supSearch.trim()) {
        const q = supSearch.toLowerCase();
        const match =
          s.supervisorName.toLowerCase().includes(q) ||
          s.supervisorNik.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.division.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [data.supervisors, supDirectorateFilter, supSearch, supStatusFilter]);

  // Supervisors pagination
  const totalSupPages = Math.ceil(filteredSupervisors.length / pageSize) || 1;
  const paginatedSupervisors = useMemo(() => {
    const start = (supPage - 1) * pageSize;
    return filteredSupervisors.slice(start, start + pageSize);
  }, [filteredSupervisors, supPage]);

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Anak Buah Sudah Isi */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Karyawan Sudah Isi</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-emerald-950">
              {data.kpi.employeeFilledCount.toLocaleString("id-ID")}
            </p>
            <span className="text-xs font-semibold text-emerald-700">
              ({data.kpi.employeeFilledRate}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            Dari {data.kpi.totalEmployees.toLocaleString("id-ID")} total karyawan My Agility
          </p>
        </div>

        {/* Card 2: Anak Buah Belum Isi */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Karyawan Belum Isi</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-amber-950">
              {data.kpi.employeePendingCount.toLocaleString("id-ID")}
            </p>
            <span className="text-xs font-semibold text-amber-700">
              ({100 - data.kpi.employeeFilledRate}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Perlu pengingat pengisian aspirasi karir
          </p>
        </div>

        {/* Card 3: Review Atasan Tuntas (100%) */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Atasan Review Tuntas</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-blue-950">
              {data.kpi.supervisorCompletedCount.toLocaleString("id-ID")}
            </p>
            <span className="text-xs font-semibold text-blue-700">
              ({data.kpi.supervisorCompletedRate}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-700">
            Dari {data.kpi.totalSupervisors} total atasan/supervisor
          </p>
        </div>

        {/* Card 4: Atasan Belum / Sebagian Review */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Atasan Dalam Proses / Belum</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <UsersRound className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {(data.kpi.supervisorInProgressCount + data.kpi.supervisorNotStartedCount).toLocaleString("id-ID")}
            </p>
            <span className="text-xs text-slate-500">
              Atasan
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data.kpi.supervisorInProgressCount} sedang berjalan • {data.kpi.supervisorNotStartedCount} belum mulai
          </p>
        </div>
      </div>

      {/* 2. Dual Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("subordinates")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "subordinates"
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Monitoring Karyawan
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "subordinates" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {data.subordinates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("supervisors")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "supervisors"
              ? "bg-slate-950 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Monitoring Atasan (Supervisor)
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "supervisors" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {data.supervisors.length}
          </span>
        </button>
      </div>

      {/* 3. TAB 1: Monitoring Karyawan (Anak Buah) */}
      {activeTab === "subordinates" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama karyawan, NRP, jabatan, atasan..."
                  value={subSearch}
                  onChange={(e) => {
                    setSubSearch(e.target.value);
                    setSubPage(1);
                  }}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Aspirasi */}
                <Select
                  value={subAspFilter}
                  onValueChange={(val: "all" | "filled" | "pending") => {
                    setSubAspFilter(val);
                    setSubPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Status Aspirasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status Aspirasi</SelectItem>
                    <SelectItem value="filled">Sudah Mengisi ({data.kpi.employeeFilledCount})</SelectItem>
                    <SelectItem value="pending">Belum Mengisi ({data.kpi.employeePendingCount})</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Review Atasan */}
                <Select
                  value={subReviewFilter}
                  onValueChange={(val: "all" | "reviewed" | "pending") => {
                    setSubReviewFilter(val);
                    setSubPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Review Atasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Review Atasan</SelectItem>
                    <SelectItem value="reviewed">Sudah Direview</SelectItem>
                    <SelectItem value="pending">Belum Direview</SelectItem>
                  </SelectContent>
                </Select>

                {/* Directorate Filter */}
                <Select
                  value={subDirectorateFilter}
                  onValueChange={(val) => {
                    setSubDirectorateFilter(val);
                    setSubPage(1);
                  }}
                >
                  <SelectTrigger className="w-[190px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Direktorat" />
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

                {(subSearch || subAspFilter !== "all" || subReviewFilter !== "all" || subDirectorateFilter !== ALL) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSubSearch("");
                      setSubAspFilter("all");
                      setSubReviewFilter("all");
                      setSubDirectorateFilter(ALL);
                      setSubPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Results Counter */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Menampilkan <strong>{filteredSubordinates.length}</strong> karyawan dari total {data.subordinates.length}
              </span>
              <span>
                Halaman {subPage} dari {totalSubPages}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Karyawan</th>
                    <th className="px-4 py-3.5">Posisi &amp; Departemen</th>
                    <th className="px-4 py-3.5">Atasan Langsung</th>
                    <th className="px-4 py-3.5 text-center">Status My Agility</th>
                    <th className="px-4 py-3.5 text-center">Tgl Pengisian</th>
                    <th className="px-4 py-3.5 text-center">Review Atasan</th>
                    <th className="px-4 py-3.5 text-center w-28">Aspirasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSubordinates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Tidak ada data karyawan yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedSubordinates.map((sub, idx) => {
                      const rowNum = (subPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={sub.personnelNumber} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-mono">
                            {rowNum}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 rounded-xl border border-slate-200 bg-slate-100">
                                <AvatarFallback className="text-xs font-bold text-slate-700">
                                  {getInitials(sub.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{sub.name}</p>
                                <p className="font-mono text-[11px] text-slate-500">NRP: {sub.personnelNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <p className="font-medium text-slate-800 truncate" title={sub.position}>
                              {sub.position}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={sub.department}>
                              {sub.department}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 max-w-[180px]">
                            <p className="font-medium text-slate-800 truncate" title={sub.supervisorName}>
                              {sub.supervisorName}
                            </p>
                            {sub.supervisorNik !== "-" && (
                              <p className="font-mono text-[10.5px] text-slate-500">
                                NIK: {sub.supervisorNik}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {sub.isAspirationFilled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Sudah Mengisi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                <Clock className="h-3 w-3 text-amber-600" /> Belum Mengisi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center text-[11px] font-medium text-slate-600">
                            {sub.aspirationDate ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {sub.aspirationDate}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {sub.isSupervisorReviewFilled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                                <UserCheck className="h-3 w-3 text-blue-600" /> Sudah Direview
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                Belum Direview
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {sub.isAspirationFilled ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAspiration(sub)}
                                className="h-7 text-[11px] font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                              >
                                <MessageSquare className="mr-1 h-3 w-3" /> Lihat
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Belum isi</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalSubPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subPage === 1}
                  onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 rounded-xl text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </Button>
                <span className="text-slate-600">
                  Halaman <strong>{subPage}</strong> dari <strong>{totalSubPages}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subPage === totalSubPages}
                  onClick={() => setSubPage((p) => Math.min(totalSubPages, p + 1))}
                  className="h-8 gap-1 rounded-xl text-xs"
                >
                  Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: Monitoring Atasan (Supervisor) */}
      {activeTab === "supervisors" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama atasan, NIK, departemen, divisi..."
                  value={supSearch}
                  onChange={(e) => {
                    setSupSearch(e.target.value);
                    setSupPage(1);
                  }}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Review */}
                <Select
                  value={supStatusFilter}
                  onValueChange={(val: "all" | "completed" | "in_progress" | "not_started") => {
                    setSupStatusFilter(val);
                    setSupPage(1);
                  }}
                >
                  <SelectTrigger className="w-[190px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Status Review Atasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status Review</SelectItem>
                    <SelectItem value="completed">Selesai 100% ({data.kpi.supervisorCompletedCount})</SelectItem>
                    <SelectItem value="in_progress">Sedang Berjalan ({data.kpi.supervisorInProgressCount})</SelectItem>
                    <SelectItem value="not_started">Belum Mulai ({data.kpi.supervisorNotStartedCount})</SelectItem>
                  </SelectContent>
                </Select>

                {/* Directorate Filter */}
                <Select
                  value={supDirectorateFilter}
                  onValueChange={(val) => {
                    setSupDirectorateFilter(val);
                    setSupPage(1);
                  }}
                >
                  <SelectTrigger className="w-[190px] rounded-xl bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Direktorat" />
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

                {(supSearch || supStatusFilter !== "all" || supDirectorateFilter !== ALL) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSupSearch("");
                      setSupStatusFilter("all");
                      setSupDirectorateFilter(ALL);
                      setSupPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Results Counter */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Menampilkan <strong>{filteredSupervisors.length}</strong> atasan dari total {data.supervisors.length}
              </span>
              <span>
                Halaman {supPage} dari {totalSupPages}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Nama Atasan / Supervisor</th>
                    <th className="px-4 py-3.5">Departemen &amp; Divisi</th>
                    <th className="px-4 py-3.5 text-center">Total Bawahan</th>
                    <th className="px-4 py-3.5 text-center">Bawahan Isi Aspirasi</th>
                    <th className="px-4 py-3.5 text-center">Review Selesai</th>
                    <th className="px-4 py-3.5 w-44">Progress Review</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center w-28">Detail Tim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSupervisors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                        Tidak ada data atasan yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedSupervisors.map((sup, idx) => {
                      const rowNum = (supPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={`${sup.supervisorNik}-${sup.supervisorName}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-mono">
                            {rowNum}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 rounded-xl border border-slate-200 bg-blue-50 text-blue-800">
                                <AvatarFallback className="text-xs font-bold">
                                  {getInitials(sup.supervisorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{sup.supervisorName}</p>
                                {sup.supervisorNik !== "-" && (
                                  <p className="font-mono text-[11px] text-slate-500">NIK: {sup.supervisorNik}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <p className="font-medium text-slate-800 truncate" title={sup.department}>
                              {sup.department}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={sup.division}>
                              {sup.division}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                            {sup.totalSubordinates} Orang
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              {sup.subordinatesAspirationFilledCount} / {sup.totalSubordinates}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              {sup.subordinatesReviewedCount} / {sup.totalSubordinates}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-600">{sup.reviewCompletionRate}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    sup.reviewCompletionRate === 100
                                      ? "bg-emerald-500"
                                      : sup.reviewCompletionRate > 0
                                      ? "bg-blue-500"
                                      : "bg-slate-300"
                                  }`}
                                  style={{ width: `${sup.reviewCompletionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {sup.status === "Completed" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Selesai
                              </span>
                            )}
                            {sup.status === "In Progress" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10.5px] font-bold text-blue-800">
                                <Clock className="h-3 w-3 text-blue-600" /> Berjalan
                              </span>
                            )}
                            {sup.status === "Not Started" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                                Belum Mulai
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSupervisorTeam(sup)}
                              className="h-7 text-[11px] font-semibold text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                            >
                              <UsersRound className="mr-1 h-3 w-3" /> Tim ({sup.totalSubordinates})
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalSupPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={supPage === 1}
                  onClick={() => setSupPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 rounded-xl text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </Button>
                <span className="text-slate-600">
                  Halaman <strong>{supPage}</strong> dari <strong>{totalSupPages}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={supPage === totalSupPages}
                  onClick={() => setSupPage((p) => Math.min(totalSupPages, p + 1))}
                  className="h-8 gap-1 rounded-xl text-xs"
                >
                  Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL 1: Lihat Aspirasi Karir My Agility Karyawan */}
      <Dialog
        open={selectedAspiration !== null}
        onOpenChange={(open) => !open && setSelectedAspiration(null)}
      >
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Compass className="h-4 w-4" /> Career Aspiration (MyAgility)
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {selectedAspiration?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              NRP: {selectedAspiration?.personnelNumber} • {selectedAspiration?.position} • {selectedAspiration?.department}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Meta tags */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-500">Atasan Langsung:</span>
                <p className="font-semibold text-slate-800">{selectedAspiration?.supervisorName}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Pengisian:</span>
                <p className="font-semibold text-slate-800">
                  {selectedAspiration?.aspirationDate || "Tersimpan"}
                </p>
              </div>
            </div>

            {/* Aspiration Text */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-600" /> Isi Aspirasi Pengembangan &amp; Karir:
              </p>
              <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-4 text-xs leading-relaxed text-slate-800 italic">
                &ldquo;{selectedAspiration?.aspiration}&rdquo;
              </div>
            </div>

            {/* Supervisor Review Preview if available */}
            {selectedAspiration?.supervisorReviewPreview && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Catatan Evaluasi Leader / 360° Review:
                </p>
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 text-xs leading-relaxed text-slate-800">
                  {selectedAspiration.supervisorReviewPreview}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL 2: Detail Anggota Tim Supervisor */}
      <Dialog
        open={selectedSupervisorTeam !== null}
        onOpenChange={(open) => !open && setSelectedSupervisorTeam(null)}
      >
        <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Building2 className="h-4 w-4" /> Tim di bawah Atasan
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {selectedSupervisorTeam?.supervisorName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedSupervisorTeam?.department} • {selectedSupervisorTeam?.division} • Total: {selectedSupervisorTeam?.totalSubordinates} Anggota Tim
            </DialogDescription>
          </DialogHeader>

          {/* Subordinates List in Modal */}
          <div className="mt-2 space-y-2.5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10.5px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">No</th>
                    <th className="px-3.5 py-2.5">Nama Karyawan</th>
                    <th className="px-3.5 py-2.5">Jabatan</th>
                    <th className="px-3.5 py-2.5 text-center">Status Aspirasi</th>
                    <th className="px-3.5 py-2.5 text-center">Review Atasan</th>
                    <th className="px-3.5 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSupervisorTeam?.subordinates.map((sub, i) => (
                    <tr key={sub.personnelNumber} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                      <td className="px-3.5 py-2.5">
                        <p className="font-bold text-slate-900">{sub.name}</p>
                        <p className="font-mono text-[10.5px] text-slate-500">NRP: {sub.personnelNumber}</p>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 text-[11.5px]">{sub.position}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        {sub.isAspirationFilled ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                            Sudah Isi
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                            Belum Isi
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {sub.isSupervisorReviewFilled ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10.5px] font-bold text-blue-800">
                            Sudah Direview
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {sub.isAspirationFilled ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupervisorTeam(null);
                              setSelectedAspiration(sub);
                            }}
                            className="h-6 text-[10.5px] font-bold text-purple-700 hover:bg-purple-50"
                          >
                            Lihat
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
