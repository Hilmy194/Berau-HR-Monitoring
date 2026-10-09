"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Briefcase,
  Users2,
  CheckCircle2,
  Clock,
  UserCheck,
  RotateCcw,
  SlidersHorizontal,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import type {
  RecruitmentCandidate,
  RecruitmentFilters,
} from "@/lib/services/recruitment.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL = "__all__";
const PAGE_SIZE = 15;

type FilterOptions = {
  bus: string[];
  departments: string[];
  positions: string[];
  sources: string[];
  statuses: string[];
};

type RecruitmentTableProps = {
  candidates: RecruitmentCandidate[];
  initialFilters: RecruitmentFilters;
  filterOptions: FilterOptions;
  kpis: {
    total: number;
    activeProcesses: number;
    inInterview: number;
    offeringAndHired: number;
  };
};

export function RecruitmentTable({
  candidates,
  initialFilters,
  filterOptions,
  kpis,
}: RecruitmentTableProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialFilters.q ?? "");
  const [bu, setBu] = useState(initialFilters.bu ?? ALL);
  const [department, setDepartment] = useState(initialFilters.department ?? ALL);
  const [position, setPosition] = useState(initialFilters.position ?? ALL);
  const [source, setSource] = useState(initialFilters.source ?? ALL);
  const [status, setStatus] = useState(initialFilters.status ?? ALL);
  const [page, setPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);

  const filteredCandidates = useMemo(() => {
    const keyword = q.trim().toLocaleLowerCase("id-ID");
    return candidates.filter((c) => {
      if (bu !== ALL && c.businessUnit !== bu) return false;
      if (department !== ALL && c.department !== department) return false;
      if (position !== ALL && c.position !== position) return false;
      if (source !== ALL && c.source !== source) return false;
      if (status !== ALL && c.status !== status) return false;

      if (!keyword) return true;

      return (
        c.candidateName.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.position.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.businessUnit.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.department.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.email.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.source.toLocaleLowerCase("id-ID").includes(keyword) ||
        c.status.toLocaleLowerCase("id-ID").includes(keyword)
      );
    });
  }, [bu, candidates, department, position, q, source, status]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredCandidates]);

  const handleReset = () => {
    setQ("");
    setBu(ALL);
    setDepartment(ALL);
    setPosition(ALL);
    setSource(ALL);
    setStatus(ALL);
    setPage(1);
    router.push("/admin/recruitment");
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Pelamar"
          value={kpis.total}
          icon={Users2}
          color="slate"
          description="Seluruh kandidat dalam database"
        />
        <MetricCard
          label="Dalam Proses Aktif"
          value={kpis.activeProcesses}
          icon={Clock}
          color="blue"
          description="Sedang tahapan seleksi"
        />
        <MetricCard
          label="Tahap Interview"
          value={kpis.inInterview}
          icon={UserCheck}
          color="amber"
          description="User / HR Interview"
        />
        <MetricCard
          label="Offering & Hired"
          value={kpis.offeringAndHired}
          icon={CheckCircle2}
          color="emerald"
          description="Tahap akhir & siap onboarding"
        />
      </section>

      {/* Filter Card */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-primary to-emerald-300" />
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Filter & Pencarian Pelamar</h3>
            </div>
            {(q || bu !== ALL || department !== ALL || position !== ALL || source !== ALL || status !== ALL) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 self-start sm:self-auto"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filter
              </Button>
            )}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* 1. Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nama, email, posisi, sumber..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs focus-visible:bg-white"
              />
            </div>

            {/* 2. Business Unit Select */}
            <Select value={bu} onValueChange={(val) => { setBu(val); setPage(1); }}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 truncate">
                <SelectValue placeholder="Semua Unit Bisnis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Unit Bisnis</SelectItem>
                {filterOptions.bus.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 3. Department Select */}
            <Select value={department} onValueChange={(val) => { setDepartment(val); setPage(1); }}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 truncate">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Departemen</SelectItem>
                {filterOptions.departments.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 4. Position Select */}
            <Select value={position} onValueChange={(val) => { setPosition(val); setPage(1); }}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 truncate">
                <SelectValue placeholder="Semua Posisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Posisi</SelectItem>
                {filterOptions.positions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 5. Source Channel Select */}
            <Select value={source} onValueChange={(val) => { setSource(val); setPage(1); }}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 truncate">
                <SelectValue placeholder="Semua Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Sumber / Channel</SelectItem>
                {filterOptions.sources.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 6. Tahapan / Status Select */}
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 truncate">
                <SelectValue placeholder="Semua Tahapan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Tahap Seleksi</SelectItem>
                {filterOptions.statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="w-full">
          {/* Table Header - 100% fluid grid without overflow */}
          <div className="hidden w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_32px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
            <span className="truncate">BU & Departemen</span>
            <span className="truncate">Posisi Lowongan</span>
            <span className="truncate">Nama Kandidat</span>
            <span className="truncate">Sumber / Channel</span>
            <span className="truncate">Tahap Seleksi</span>
            <span className="sr-only">Aksi</span>
          </div>

          {/* Table Body */}
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Users2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Tidak ada kandidat yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Coba ubah kata kunci pencarian atau sesuaikan filter Business Unit, Departemen, Sumber, dan Tahapan.
              </p>
              <Button variant="outline" size="sm" onClick={handleReset} className="mt-3 rounded-xl text-xs">
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedCandidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left outline-none transition-all hover:bg-emerald-50/60 cursor-pointer lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_32px]"
                >
                  {/* Kolom 1: BU & Departemen */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-bold text-[9px]">
                        BU
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900" title={c.businessUnit}>{c.businessUnit}</p>
                        <p className="truncate text-[10px] text-slate-500" title={c.department}>{c.department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2: Posisi */}
                  <div className="hidden min-w-0 flex-col lg:flex">
                    <p className="truncate text-xs font-semibold text-slate-900" title={c.position}>{c.position}</p>
                    <p className="truncate text-[10px] text-slate-500">{c.division} · {c.directorate}</p>
                  </div>

                  {/* Kolom 3: Nama Kandidat */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center border border-emerald-200">
                        {c.candidateName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900" title={c.candidateName}>{c.candidateName}</p>
                        <p className="truncate text-[10px] text-slate-500" title={c.email}>{c.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 4: Sumber / Channel */}
                  <div className="hidden min-w-0 lg:block">
                    <SourceBadge source={c.source} />
                  </div>

                  {/* Kolom 5: Status */}
                  <div className="min-w-0 flex items-center">
                    <RecruitmentStatusBadge status={c.status} />
                  </div>

                  {/* Action arrow */}
                  <div className="hidden lg:flex justify-end">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 group-hover:border-emerald-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      <Sparkles className="h-2.5 w-2.5" />
                    </span>
                  </div>

                  {/* Mobile Sub Row */}
                  <div className="col-span-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] text-slate-500 lg:hidden">
                    <span className="font-semibold text-slate-800">{c.position}</span>
                    <SourceBadge source={c.source} />
                    <span>Tgl: {c.appliedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {filteredCandidates.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/60 text-xs text-slate-600">
              <p>
                Menampilkan <span className="font-bold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> -{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(currentPage * PAGE_SIZE, filteredCandidates.length)}
                </span>{" "}
                dari <span className="font-bold text-slate-900">{filteredCandidates.length}</span> kandidat
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <span className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 rounded-lg px-2 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <Dialog open={Boolean(selectedCandidate)} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-lg p-6 rounded-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-700">
                  {selectedCandidate.id}
                </Badge>
                <RecruitmentStatusBadge status={selectedCandidate.status} />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 mt-2">
                {selectedCandidate.candidateName}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium">{selectedCandidate.position}</p>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Business Unit</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCandidate.businessUnit}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Sumber Pendaftaran</span>
                  <div className="mt-0.5"><SourceBadge source={selectedCandidate.source} /></div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Departemen</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCandidate.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Direktorat</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCandidate.directorate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{selectedCandidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{selectedCandidate.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Tanggal Masuk: {selectedCandidate.appliedDate}</span>
                </div>
              </div>

              {selectedCandidate.notes && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Catatan / Headline Workable:</span>
                  <p className="text-emerald-950 mt-1 leading-relaxed">{selectedCandidate.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "slate" | "blue" | "amber" | "emerald";
  description: string;
}) {
  const colorStyles = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${colorStyles[color]}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] text-slate-400 truncate">{description}</p>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: string }) {
  const lower = (source || "").toLowerCase();
  let bg = "bg-slate-100 text-slate-700 border-slate-200";

  if (lower.includes("linkedin")) {
    bg = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (lower.includes("ai")) {
    bg = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (lower.includes("uploaded") || lower.includes("sourced")) {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (lower.includes("referral")) {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return (
    <Badge className={`${bg} border text-[10px] font-semibold px-2 py-0.5 truncate max-w-[130px]`}>
      <Share2 className="h-2.5 w-2.5 mr-1 shrink-0" />
      <span className="truncate">{source || "Portal"}</span>
    </Badge>
  );
}

function RecruitmentStatusBadge({ status }: { status: RecruitmentCandidate["status"] }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    Sourcing: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    "Screening CV": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
    Psikotes: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    "User Interview": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    "HR Interview": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Medical Check-Up (MCU)": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    "Offering Letter": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Hired: { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300" },
  };

  const style = styles[status] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };

  return (
    <Badge className={`${style.bg} ${style.text} ${style.border} border text-[10px] font-bold px-2 py-0.5 rounded-full truncate`}>
      {status === "Hired" && "🎉 "}
      <span className="truncate">{status}</span>
    </Badge>
  );
}
