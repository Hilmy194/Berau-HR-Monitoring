"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  FileCheck2,
  GraduationCap,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  EmployeeTrainingRequest,
  PreAssessmentType,
  StemType,
  TrainingCatalogItem,
  TrainingType,
} from "@/lib/services/training-catalog.service";
import type { LearningActivityType } from "@/lib/services/learning-monitoring.service";

export type IdpTrackType = "Current Gap" | "Succession Plan" | "Career Path";

export interface RecommendationItem {
  id: string;
  track: IdpTrackType;
  targetPosition?: string;
  activityType: LearningActivityType;
  catalogItemId?: string;
  title: string;
  skill: string;
  stemType: StemType;
  vendor: string;
  date: string;
  totalCost: number;
  budgetCode: string;
  preAssessmentRequired: PreAssessmentType;
  recommendedBy: "AI Baseline" | "Leader (Atasan)";
  reason: string;
  successCriteria?: string;
  idpStatus?: string;
}

interface EmployeeTrainingSubmissionProps {
  employeeInfo: {
    nik: string;
    name: string;
    position: string;
    department: string;
    division: string;
    isNonEmployee?: boolean;
  };
  catalog: TrainingCatalogItem[];
  initialRequests: EmployeeTrainingRequest[];
  aiAndLeaderRecommendations: RecommendationItem[];
  defaultTab?: "recommendations" | "catalog" | "my_requests";
}

type DetailTarget =
  | { kind: "recommendation"; data: RecommendationItem; matchedCatalog?: TrainingCatalogItem }
  | { kind: "catalog"; data: TrainingCatalogItem }
  | { kind: "request"; data: EmployeeTrainingRequest }
  | null;

export function EmployeeTrainingSubmission({
  employeeInfo,
  catalog,
  initialRequests,
  aiAndLeaderRecommendations,
  defaultTab,
}: EmployeeTrainingSubmissionProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeTrainingRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"recommendations" | "catalog" | "my_requests">(
    defaultTab || (employeeInfo.isNonEmployee || aiAndLeaderRecommendations.length === 0 ? "catalog" : "recommendations")
  );

  // Detail popup state
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null);

  // Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields - Sesuai Aturan: Semua Dropdown, KECUALI preAssessmentNotes yang diketik!
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [formTrainingType, setFormTrainingType] = useState<TrainingType>("Inhouse");
  const [formStemType, setFormStemType] = useState<StemType>("STEM");
  const [formSkill, setFormSkill] = useState<string>("");
  const [formVendor, setFormVendor] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formCompany, setFormCompany] = useState<string>("PT Berau Coal");
  const [formBudgetCode, setFormBudgetCode] = useState<string>("CC-7120-MINING");
  const [formCostTier, setFormCostTier] = useState<string>("");
  const [formPreAssessmentType, setFormPreAssessmentType] = useState<PreAssessmentType>("Wajib - Online Pre-Test SMKP");
  const [formPreAssessmentNotes, setFormPreAssessmentNotes] = useState<string>("");
  const [submissionSource, setSubmissionSource] = useState<"AI_RECOMMENDED" | "LEADER_ASSIGNED" | "EMPLOYEE_INITIATED">("EMPLOYEE_INITIATED");

  // Filter Recommendation Track (Current Gap / Succession Plan / Career Path)
  const availableTracks = Array.from(new Set(aiAndLeaderRecommendations.map((r) => r.track)));
  const [selectedTrack, setSelectedTrack] = useState<IdpTrackType | "ALL">(
    availableTracks.includes("Current Gap") ? "Current Gap" : (availableTracks[0] ?? "ALL")
  );
  const filteredRecommendations =
    selectedTrack === "ALL"
      ? aiAndLeaderRecommendations
      : aiAndLeaderRecommendations.filter((r) => r.track === selectedTrack);

  // Filter Catalog
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStem, setFilterStem] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  const openFormForCatalog = (item: TrainingCatalogItem, source: "AI_RECOMMENDED" | "LEADER_ASSIGNED" | "EMPLOYEE_INITIATED" = "EMPLOYEE_INITIATED") => {
    setSelectedCatalogId(item.id);
    setFormTrainingType(item.trainingType);
    setFormStemType(item.stemType);
    setFormSkill(item.skill);
    setFormVendor(item.vendor);
    setFormDate(item.date);
    setFormCompany("PT Berau Coal");
    setFormBudgetCode(item.budgetCode);
    setFormCostTier(`Rp ${item.totalCost.toLocaleString("id-ID")}`);
    setFormPreAssessmentType(item.preAssessmentRequired);
    setFormPreAssessmentNotes("");
    setSubmissionSource(source);
    setDialogOpen(true);
  };

  const handleCatalogDropdownChange = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const item = catalog.find((c) => c.id === catalogId);
    if (!item) return;

    setFormTrainingType(item.trainingType);
    setFormStemType(item.stemType);
    setFormSkill(item.skill);
    setFormVendor(item.vendor);
    setFormDate(item.date);
    setFormBudgetCode(item.budgetCode);
    setFormCostTier(`Rp ${item.totalCost.toLocaleString("id-ID")}`);
    setFormPreAssessmentType(item.preAssessmentRequired);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogId) {
      toast.error("Silakan pilih judul pelatihan dari katalog.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/learning/training-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: selectedCatalogId,
          preAssessmentNotes: formPreAssessmentNotes,
          source: submissionSource,
          employeePersonnelNumber: employeeInfo.nik,
          employeeName: employeeInfo.name,
          department: employeeInfo.department,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim pengajuan training.");
      }

      toast.success("Pengajuan training berhasil dikirim ke atasan (Leader) untuk diapprove!");
      setRequests((prev) => [data.request, ...prev]);
      setDialogOpen(false);
      setActiveTab("my_requests");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengajukan training.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Catalog Items
  const queryLower = searchQuery.trim().toLowerCase();
  const filteredCatalog = catalog.filter((item) => {
    if (filterStem !== "ALL" && item.stemType !== filterStem) return false;
    if (filterType !== "ALL" && item.trainingType !== filterType) return false;
    if (queryLower) {
      const hay = `${item.id} ${item.trainingTitle} ${item.skill} ${item.vendor}`.toLowerCase();
      if (!hay.includes(queryLower)) return false;
    }
    return true;
  });

  const pendingRequestsCount = requests.filter((r) => r.status === "PENDING_LEADER_APPROVAL").length;
  const approvedRequestsCount = requests.filter((r) => r.status === "APPROVED_BY_LEADER").length;

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. HEADER PROFILE & SUMMARY                                               */}
      {/* ========================================================================= */}
      <div
        className="rounded-2xl border border-emerald-950/40 shadow-md text-white p-5 relative overflow-hidden bg-[#003829]"
        style={{
          backgroundColor: "#003829",
          backgroundImage: "linear-gradient(135deg, #003829 0%, #064032 45%, #0f241d 100%)",
          color: "#ffffff",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Portal Pembelajaran Karyawan
              </span>
              {employeeInfo.isNonEmployee ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Mode Administrator (Non-Karyawan Dakar)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-emerald-100 border border-white/20">
                  TNA SAP Fiori Integration 2026
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {employeeInfo.name}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 flex flex-wrap items-center gap-2 sm:gap-3">
              <span>
                NIK: <strong className="text-white font-bold">{employeeInfo.nik}</strong>
              </span>
              <span>•</span>
              <span className="font-medium text-emerald-50">{employeeInfo.position}</span>
              <span>•</span>
              <span className="text-emerald-200/90">{employeeInfo.department}</span>
            </p>

            {employeeInfo.isNonEmployee && (
              <p className="inline-flex items-start gap-2 text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-400/30 px-3 py-1.5 rounded-lg max-w-xl">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-300" />
                <span>
                  Akun Anda tidak tercatat di daftar karyawan aktif (Dakar), sehingga rekomendasi IDP fiktif dinonaktifkan. Anda dapat melihat dan mengajukan pelatihan melalui <strong>Katalog Pelatihan</strong>.
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 border-t md:border-t-0 md:border-l border-emerald-800/80 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[11px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                Menunggu Approval
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5 md:justify-end">
                <span className="text-2xl font-bold text-amber-300 tabular-nums">{pendingRequestsCount}</span>
                <span className="text-xs text-emerald-100/80">pengajuan</span>
              </div>
            </div>
            <div className="text-left md:text-right pl-4 border-l border-emerald-800/80">
              <p className="text-[11px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                Disetujui Atasan
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5 md:justify-end">
                <span className="text-2xl font-bold text-emerald-300 tabular-nums">{approvedRequestsCount}</span>
                <span className="text-xs text-emerald-100/80">siap registrasi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS                                                        */}
      {/* ========================================================================= */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full grid-cols-3 max-w-xl h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="recommendations" className="gap-1.5 font-semibold text-xs sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Rekomendasi ({aiAndLeaderRecommendations.length})
            </TabsTrigger>
            <TabsTrigger value="catalog" className="gap-1.5 font-semibold text-xs sm:text-sm">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              Katalog ({catalog.length})
            </TabsTrigger>
            <TabsTrigger value="my_requests" className="gap-1.5 font-semibold text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pengajuan ({requests.length})
            </TabsTrigger>
          </TabsList>

          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Klik baris tabel untuk melihat detail lengkap pelatihan.</span>
          </p>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: REKOMENDASI AI & ATASAN (TABEL RINGKAS)                          */}
        {/* ----------------------------------------------------------------------- */}
        <TabsContent value="recommendations" className="space-y-3 pt-3">
          {aiAndLeaderRecommendations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <GraduationCap className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {employeeInfo.isNonEmployee
                  ? "Akun Administrator (Tidak Tercatat di Dakar)"
                  : "Belum Ada Rekomendasi IDP Aktif"}
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                {employeeInfo.isNonEmployee
                  ? "Akun Anda tidak memiliki data karyawan operasional di Dakar. Silakan lihat dan ajukan pelatihan langsung melalui tab Katalog."
                  : "Saat ini belum ada rekomendasi pelatihan dari AI maupun arahan khusus dari Leader. Anda dapat memilih pelatihan mandiri melalui tab Katalog."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("catalog")}
                className="mt-2 text-xs font-semibold gap-1.5"
              >
                <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
                Buka Katalog Pelatihan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Baris Track IDP & Legenda 70-20-10 */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Track IDP:</span>
                  {availableTracks.map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setSelectedTrack(track)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        selectedTrack === track
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {track}
                    </button>
                  ))}
                  {availableTracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTrack("ALL")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        selectedTrack === "ALL"
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Semua ({aiAndLeaderRecommendations.length})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">
                    70% Experiential
                  </span>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                    20% Social
                  </span>
                  <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 font-semibold text-purple-800">
                    10% Formal
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                      <TableHead className="w-[145px] text-xs font-semibold text-slate-600">Model 70-20-10</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Program / Aktivitas IDP</TableHead>
                      <TableHead className="hidden md:table-cell text-xs font-semibold text-slate-600">Kompetensi</TableHead>
                      <TableHead className="hidden sm:table-cell w-[160px] text-xs font-semibold text-slate-600">Timeline</TableHead>
                      <TableHead className="text-right w-[170px] text-xs font-semibold text-slate-600">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecommendations.map((rec) => {
                      const matchedCatalog = rec.catalogItemId
                        ? catalog.find((c) => c.id === rec.catalogItemId)
                        : undefined;
                      const isLeader = rec.recommendedBy.includes("Leader");
                      const isFormal = rec.activityType === "FORMAL_10";
                      const existingFormalReq = isFormal
                        ? requests.find(
                            (r) =>
                              (matchedCatalog && r.catalogItemId === matchedCatalog.id) ||
                              rec.title.toLowerCase().includes(r.trainingTitle.toLowerCase()) ||
                              r.trainingTitle.toLowerCase().includes(rec.title.toLowerCase())
                          )
                        : undefined;
                      const ratioBadge =
                        rec.activityType === "EXPERIENCE_70"
                          ? { label: "70% Experiential", cls: "border-blue-300 bg-blue-50 text-blue-800" }
                          : rec.activityType === "SOCIAL_20"
                          ? { label: "20% Social", cls: "border-amber-300 bg-amber-50 text-amber-800" }
                          : { label: "10% Formal", cls: "border-purple-300 bg-purple-50 text-purple-800" };
                      return (
                        <TableRow
                          key={rec.id}
                          onClick={() => setDetailTarget({ kind: "recommendation", data: rec, matchedCatalog })}
                          className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                        >
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant="outline" className={`${ratioBadge.cls} text-[11px] font-semibold whitespace-nowrap`}>
                              {ratioBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <p className="font-semibold text-sm text-slate-900 leading-snug">{rec.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {selectedTrack === "ALL" ? `${rec.track} • ` : ""}
                              {rec.vendor}
                            </p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-middle text-xs text-slate-700">
                            {rec.skill}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell align-middle text-xs text-slate-700 whitespace-nowrap">
                            {rec.date}
                          </TableCell>
                          <TableCell className="align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDetailTarget({ kind: "recommendation", data: rec, matchedCatalog })}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                title="Lihat Detail"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Detail
                              </Button>
                              {isFormal && existingFormalReq && existingFormalReq.status !== "REJECTED_BY_LEADER" ? (
                                <StatusRequestBadge status={existingFormalReq.status} />
                              ) : isFormal ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const source = isLeader ? "LEADER_ASSIGNED" : "AI_RECOMMENDED";
                                    if (matchedCatalog) {
                                      openFormForCatalog(matchedCatalog, source);
                                    } else if (catalog[0]) {
                                      openFormForCatalog(catalog[0], source);
                                    }
                                  }}
                                  className="h-8 px-3 text-xs font-semibold gap-1"
                                >
                                  <Send className="h-3 w-3" />
                                  Ajukan
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: KATALOG PELATIHAN LENGKAP (FILTER + TABEL)                       */}
        {/* ----------------------------------------------------------------------- */}
        <TabsContent value="catalog" className="space-y-3 pt-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[210px] max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari program, kompetensi, vendor..."
                  className="h-8.5 pl-8 text-xs"
                />
              </div>
              <Select value={filterStem} onValueChange={setFilterStem}>
                <SelectTrigger className="h-8.5 text-xs w-40">
                  <SelectValue placeholder="STEM / Non-STEM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="STEM">STEM (Teknis)</SelectItem>
                  <SelectItem value="Non-STEM">Non-STEM (Manajerial)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8.5 text-xs w-32">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="Inhouse">Inhouse</SelectItem>
                  <SelectItem value="Outhouse">Outhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500 shrink-0">
              Menampilkan <strong>{filteredCatalog.length}</strong> dari {catalog.length} program
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                  <TableHead className="w-[105px] text-xs font-semibold text-slate-600">Kode</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Program Pelatihan</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold text-slate-600">Kompetensi</TableHead>
                  <TableHead className="w-[155px] text-xs font-semibold text-slate-600">Kategori / Tipe</TableHead>
                  <TableHead className="hidden sm:table-cell w-[160px] text-xs font-semibold text-slate-600">Jadwal</TableHead>
                  <TableHead className="text-right w-[170px] text-xs font-semibold text-slate-600">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-xs text-slate-500">
                      Tidak ada program pelatihan yang cocok dengan filter pencarian Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCatalog.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => setDetailTarget({ kind: "catalog", data: item })}
                      className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                    >
                      <TableCell className="align-middle font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {item.id}
                      </TableCell>
                      <TableCell className="align-middle">
                        <p className="font-semibold text-sm text-slate-900 leading-snug">{item.trainingTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.vendor}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-middle text-xs text-slate-700">
                        {item.skill}
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={
                              item.stemType === "STEM"
                                ? "border-blue-300 bg-blue-50 text-blue-800 text-[10px] whitespace-nowrap"
                                : "border-violet-300 bg-violet-50 text-violet-800 text-[10px] whitespace-nowrap"
                            }
                          >
                            {item.stemType}
                          </Badge>
                          <Badge variant="outline" className="text-slate-600 text-[10px] whitespace-nowrap">
                            {item.trainingType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-middle text-xs text-slate-700 whitespace-nowrap">
                        {item.date}
                      </TableCell>
                      <TableCell className="align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailTarget({ kind: "catalog", data: item })}
                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                            title="Lihat Detail"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFormForCatalog(item, "EMPLOYEE_INITIATED")}
                            className="h-8 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Ajukan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: RIWAYAT & STATUS PENGAJUAN SAYA (TABEL)                          */}
        {/* ----------------------------------------------------------------------- */}
        <TabsContent value="my_requests" className="space-y-3 pt-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <GraduationCap className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">Belum Ada Pengajuan Pelatihan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Anda belum pernah mengajukan pelatihan. Silakan pilih pelatihan dari tab Rekomendasi atau Katalog.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="w-[125px] text-xs font-semibold text-slate-600">ID / Tanggal</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Program Pelatihan</TableHead>
                    <TableHead className="hidden sm:table-cell w-[160px] text-xs font-semibold text-slate-600">Jadwal</TableHead>
                    <TableHead className="w-[190px] text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-right w-[95px] text-xs font-semibold text-slate-600">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow
                      key={req.id}
                      onClick={() => setDetailTarget({ kind: "request", data: req })}
                      className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                    >
                      <TableCell className="align-middle whitespace-nowrap">
                        <p className="font-mono text-[11px] font-semibold text-slate-700">{req.id}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(req.submittedAt).toLocaleDateString("id-ID")}
                        </p>
                      </TableCell>
                      <TableCell className="align-middle">
                        <p className="font-semibold text-sm text-slate-900 leading-snug">
                          {req.trainingTitle}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {req.vendor} • {req.skill}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-middle text-xs text-slate-700 whitespace-nowrap">
                        {req.scheduleDate}
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap">
                        <StatusRequestBadge status={req.status} />
                      </TableCell>
                      <TableCell className="align-middle text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailTarget({ kind: "request", data: req });
                          }}
                          className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 3. POPUP DETAIL PELATIHAN / PENGAJUAN                                     */}
      {/* ========================================================================= */}
      <Dialog open={detailTarget !== null} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {detailTarget && (() => {
            const isRec = detailTarget.kind === "recommendation";
            const isCat = detailTarget.kind === "catalog";
            const isReq = detailTarget.kind === "request";

            const title = isRec
              ? detailTarget.data.title
              : detailTarget.data.trainingTitle;
            const vendor = detailTarget.data.vendor;
            const skill = detailTarget.data.skill;
            const stemType = detailTarget.data.stemType;
            const trainingType = isRec
              ? detailTarget.matchedCatalog?.trainingType
              : detailTarget.data.trainingType;
            const date = isReq ? detailTarget.data.scheduleDate : detailTarget.data.date;
            const totalCost = detailTarget.data.totalCost;
            const budgetCode = detailTarget.data.budgetCode;
            const preAssessment = isReq ? null : detailTarget.data.preAssessmentRequired;
            const code = isRec
              ? detailTarget.matchedCatalog?.id ?? detailTarget.data.id
              : detailTarget.data.id;

            return (
              <>
                <DialogHeader className="space-y-2.5 text-left">
                  <div className="flex flex-wrap items-center gap-2 pr-6">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {code}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        stemType === "STEM"
                          ? "border-blue-300 bg-blue-50 text-blue-800 text-[11px]"
                          : "border-violet-300 bg-violet-50 text-violet-800 text-[11px]"
                      }
                    >
                      {stemType}
                    </Badge>
                    {trainingType && (
                      <Badge variant="outline" className="text-slate-600 text-[11px]">
                        {trainingType}
                      </Badge>
                    )}
                    {isRec && (
                      <>
                        <Badge
                          variant="outline"
                          className={
                            detailTarget.data.activityType === "EXPERIENCE_70"
                              ? "border-blue-300 bg-blue-50 text-blue-800 text-[11px] font-semibold"
                              : detailTarget.data.activityType === "SOCIAL_20"
                              ? "border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold"
                              : "border-purple-300 bg-purple-50 text-purple-800 text-[11px] font-semibold"
                          }
                        >
                          {detailTarget.data.activityType === "EXPERIENCE_70"
                            ? "70% Experiential"
                            : detailTarget.data.activityType === "SOCIAL_20"
                            ? "20% Social"
                            : "10% Formal"}
                        </Badge>
                        <Badge variant="outline" className="text-slate-700 bg-slate-50 text-[11px]">
                          {detailTarget.data.track}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            detailTarget.data.recommendedBy.includes("Leader")
                              ? "bg-amber-50 text-amber-900 border-amber-300 text-[11px] gap-1"
                              : "bg-purple-50 text-purple-900 border-purple-300 text-[11px] gap-1"
                          }
                        >
                          {detailTarget.data.recommendedBy.includes("Leader") ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          {detailTarget.data.recommendedBy.includes("Leader")
                            ? "Ditetapkan oleh Leader"
                            : "Rekomendasi AI IDP"}
                        </Badge>
                      </>
                    )}
                    {isReq && (
                      <>
                        <Badge variant="outline" className="text-[11px] text-slate-600">
                          {detailTarget.data.source === "AI_RECOMMENDED"
                            ? "Rekomendasi AI"
                            : detailTarget.data.source === "LEADER_ASSIGNED"
                            ? "Arahan Atasan"
                            : "Inisiatif Mandiri"}
                        </Badge>
                        <StatusRequestBadge status={detailTarget.data.status} />
                      </>
                    )}
                  </div>
                  <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>Penyelenggara: <strong className="text-slate-700">{vendor}</strong></span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Kompetensi / Skill
                      </span>
                      <p className="font-semibold text-slate-900">{skill}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Jadwal Pelaksanaan
                      </span>
                      <p className="font-semibold text-slate-900">{date}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Coins className="h-3 w-3" /> Estimasi Biaya &amp; WBS
                      </span>
                      <p className="font-bold text-emerald-700 tabular-nums">
                        {totalCost > 0 ? (
                          <>
                            Rp {totalCost.toLocaleString("id-ID")}{" "}
                            <span className="font-mono font-normal text-slate-500">({budgetCode})</span>
                          </>
                        ) : (
                          <span className="font-medium text-slate-700">{budgetCode}</span>
                        )}
                      </p>
                    </div>
                    {preAssessment ? (
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <FileCheck2 className="h-3 w-3" /> Pre-Assessment
                        </span>
                        <p className="font-medium text-slate-900">{preAssessment}</p>
                      </div>
                    ) : isReq ? (
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Tanggal Pengajuan
                        </span>
                        <p className="font-medium text-slate-900">
                          {new Date(detailTarget.data.submittedAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {isRec && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 text-xs space-y-1">
                      <p className="font-semibold text-purple-950">Konteks Rekomendasi IDP</p>
                      <p className="text-purple-900/90 leading-relaxed">{detailTarget.data.reason}</p>
                    </div>
                  )}

                  {isCat && detailTarget.data.description && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                      <p className="font-semibold text-slate-800">Deskripsi Program</p>
                      <p className="text-slate-600 leading-relaxed">{detailTarget.data.description}</p>
                    </div>
                  )}

                  {isReq && (
                    <div className="space-y-2.5">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                        <p className="font-semibold text-slate-800">Catatan Pre-Assessment Saya</p>
                        <p className="text-slate-600 leading-relaxed">
                          {detailTarget.data.preAssessmentNotes || "Tidak ada catatan tambahan."}
                        </p>
                      </div>
                      {detailTarget.data.leaderNotes && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs space-y-1">
                          <p className="font-semibold text-amber-950">
                            Catatan Atasan {detailTarget.data.reviewedBy ? `(${detailTarget.data.reviewedBy})` : ""}
                          </p>
                          <p className="text-amber-900 leading-relaxed">{detailTarget.data.leaderNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-3 border-t gap-2">
                  <Button type="button" variant="outline" onClick={() => setDetailTarget(null)}>
                    Tutup
                  </Button>
                  {(isCat || (isRec && detailTarget.data.activityType === "FORMAL_10")) && (
                    <Button
                      type="button"
                      className="gap-2 font-semibold"
                      onClick={() => {
                        const target = detailTarget;
                        setDetailTarget(null);
                        if (target.kind === "recommendation") {
                          const source = target.data.recommendedBy.includes("Leader")
                            ? "LEADER_ASSIGNED"
                            : "AI_RECOMMENDED";
                          if (target.matchedCatalog) {
                            openFormForCatalog(target.matchedCatalog, source);
                          } else if (catalog[0]) {
                            openFormForCatalog(catalog[0], source);
                          }
                        } else if (target.kind === "catalog") {
                          openFormForCatalog(target.data, "EMPLOYEE_INITIATED");
                        }
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Ajukan Training Ini ke Atasan
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. MODAL FORM PENGAJUAN (SEMUA DROPDOWN, KECUALI PRE-ASSESSMENT KETIK)      */}
      {/* ========================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Formulir Pengajuan Training Karyawan (TNA 2026)
            </DialogTitle>
            <DialogDescription>
              Lengkapi formulir registrasi pelatihan di bawah ini. Sesuai ketentuan TNA, seluruh data spesifikasi dipilih melalui dropdown resmi, dan masukkan catatan pre-assessment Anda secara mandiri.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Header Data Karyawan (Read-only display) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span>Nama Karyawan:</span> <strong className="text-slate-900">{employeeInfo.name}</strong>
              </div>
              <div>
                <span>NIK:</span> <strong className="text-slate-900">{employeeInfo.nik}</strong>
              </div>
              <div className="col-span-2">
                <span>Departemen/Divisi:</span> <strong className="text-slate-900">{employeeInfo.department}</strong>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* 1. DROPDOWN: Judul Pelatihan */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Judul Pelatihan (Pilih dari Katalog) <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedCatalogId} onValueChange={handleCatalogDropdownChange}>
                  <SelectTrigger className="bg-white border-slate-300 font-medium text-xs">
                    <SelectValue placeholder="-- Pilih Judul Pelatihan --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {catalog.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        [{c.stemType}] {c.trainingTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. DROPDOWN: Kategori Pelatihan (STEM / Non-STEM) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Kompetensi (STEM / Non-STEM) <span className="text-red-500">*</span>
                </Label>
                <Select value={formStemType} onValueChange={(v) => setFormStemType(v as StemType)}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STEM">STEM (Teknis / Tambang / Engineering)</SelectItem>
                    <SelectItem value="Non-STEM">Non-STEM (Manajerial / Leadership)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. DROPDOWN: Tipe Pelatihan (Inhouse / Outhouse) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Tipe Pelatihan <span className="text-red-500">*</span>
                </Label>
                <Select value={formTrainingType} onValueChange={(v) => setFormTrainingType(v as TrainingType)}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inhouse">Inhouse (Internal / Site Berau)</SelectItem>
                    <SelectItem value="Outhouse">Outhouse (Eksternal / Jakarta / Bandung)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. DROPDOWN: Bidang Kompetensi (Skill) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Jenis Kompetensi (Skill) <span className="text-red-500">*</span>
                </Label>
                <Select value={formSkill} onValueChange={setFormSkill}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue placeholder="Pilih Jenis Kompetensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational Excellence">Operational Excellence</SelectItem>
                    <SelectItem value="Mine Planning & Tech Services">Mine Planning &amp; Tech Services</SelectItem>
                    <SelectItem value="Geotechnical & Exploration">Geotechnical &amp; Exploration</SelectItem>
                    <SelectItem value="HSE & Mining Safety (SMKP)">HSE &amp; Mining Safety (SMKP)</SelectItem>
                    <SelectItem value="Leadership & Supervisory">Leadership &amp; Supervisory</SelectItem>
                    <SelectItem value="Digital Transformation & AI">Digital Transformation &amp; AI</SelectItem>
                    <SelectItem value="ESG & Environmental Compliance">ESG &amp; Environmental Compliance</SelectItem>
                    <SelectItem value="Financial & Cost Governance">Financial &amp; Cost Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. DROPDOWN: Vendor Penyelenggara */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Nama Vendor Penyelenggara <span className="text-red-500">*</span>
                </Label>
                <Select value={formVendor} onValueChange={setFormVendor}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue placeholder="Pilih Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPSDM Geominerba ESDM">PPSDM Geominerba ESDM</SelectItem>
                    <SelectItem value="ITB Mining Institute">ITB Mining Institute</SelectItem>
                    <SelectItem value="Tekmira ESDM & Hexagon Mining">Tekmira ESDM &amp; Hexagon Mining</SelectItem>
                    <SelectItem value="Mining Institute Indonesia">Mining Institute Indonesia</SelectItem>
                    <SelectItem value="Schneider Electric & Komatsu Training Center">Schneider Electric &amp; Komatsu</SelectItem>
                    <SelectItem value="PPM Manajemen">PPM Manajemen</SelectItem>
                    <SelectItem value="Dale Carnegie Indonesia">Dale Carnegie Indonesia</SelectItem>
                    <SelectItem value="Prasetiya Mulya Executive Learning">Prasetiya Mulya Executive Learning</SelectItem>
                    <SelectItem value="Algoritma Data Science School">Algoritma Data Science School</SelectItem>
                    <SelectItem value="SGS Indonesia">SGS Indonesia</SelectItem>
                    <SelectItem value="MarkPlus Institute">MarkPlus Institute</SelectItem>
                    <SelectItem value="Orica Mining Services & PPSDM">Orica Mining Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 6. DROPDOWN: Tanggal / Batch Pelaksanaan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Tanggal / Batch Pelaksanaan <span className="text-red-500">*</span>
                </Label>
                <Select value={formDate} onValueChange={setFormDate}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue placeholder="Pilih Tanggal Pelaksanaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 - 19 Mei 2026">15 - 19 Mei 2026 (Batch 1)</SelectItem>
                    <SelectItem value="08 - 12 Juni 2026">08 - 12 Juni 2026 (Batch 2)</SelectItem>
                    <SelectItem value="10 - 14 Juni 2026">10 - 14 Juni 2026 (Batch 3)</SelectItem>
                    <SelectItem value="13 - 17 Juli 2026">13 - 17 Juli 2026 (Batch 4)</SelectItem>
                    <SelectItem value="20 - 24 Juli 2026">20 - 24 Juli 2026 (Batch 5)</SelectItem>
                    <SelectItem value="10 - 14 Agustus 2026">10 - 14 Agustus 2026 (Batch 6)</SelectItem>
                    <SelectItem value="18 - 22 Agustus 2026">18 - 22 Agustus 2026 (Batch 7)</SelectItem>
                    <SelectItem value="07 - 11 September 2026">07 - 11 September 2026 (Batch 8)</SelectItem>
                    <SelectItem value="14 - 18 September 2026">14 - 18 September 2026 (Batch 9)</SelectItem>
                    <SelectItem value="05 - 09 Oktober 2026">05 - 09 Oktober 2026 (Batch 10)</SelectItem>
                    <SelectItem value="12 - 16 Oktober 2026">12 - 16 Oktober 2026 (Batch 11)</SelectItem>
                    <SelectItem value="09 - 13 November 2026">09 - 13 November 2026 (Batch 12)</SelectItem>
                    <SelectItem value="14 - 18 Desember 2026">14 - 18 Desember 2026 (Batch 13)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 7. DROPDOWN: Perusahaan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Perusahaan <span className="text-red-500">*</span>
                </Label>
                <Select value={formCompany} onValueChange={setFormCompany}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT Berau Coal">PT Berau Coal</SelectItem>
                    <SelectItem value="PT Mutiara Tanjung Lestari (MTL)">PT Mutiara Tanjung Lestari (MTL)</SelectItem>
                    <SelectItem value="PT Asian Energy Lestari (AEL)">PT Asian Energy Lestari (AEL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 8. DROPDOWN: Budget Code / Cost Center */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Budget Code / WBS <span className="text-red-500">*</span>
                </Label>
                <Select value={formBudgetCode} onValueChange={setFormBudgetCode}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC-7120-MINING">CC-7120-MINING (Cost Center Tambang)</SelectItem>
                    <SelectItem value="CC-7130-HSE">CC-7130-HSE (Cost Center Keselamatan K3)</SelectItem>
                    <SelectItem value="CC-7140-ENGR">CC-7140-ENGR (Cost Center Engineering)</SelectItem>
                    <SelectItem value="WBS-OPS-TRN-2026">WBS-OPS-TRN-2026 (WBS Operasional Pit)</SelectItem>
                    <SelectItem value="WBS-HR-LEAD-2026">WBS-HR-LEAD-2026 (WBS Leadership Talent)</SelectItem>
                    <SelectItem value="CC-7110-FINANCE">CC-7110-FINANCE (Cost Center Keuangan)</SelectItem>
                    <SelectItem value="CC-7150-ENV">CC-7150-ENV (Cost Center Lingkungan Hidup)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 9. DROPDOWN: Estimasi Biaya (Tier / Nilai) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Estimasi Total Biaya Pelatihan <span className="text-red-500">*</span>
                </Label>
                <Select value={formCostTier} onValueChange={setFormCostTier}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs font-bold text-emerald-800">
                    <SelectValue placeholder="Pilih Total Biaya" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rp 7.700.000">Rp 7.700.000 (Inhouse Workshop)</SelectItem>
                    <SelectItem value="Rp 8.850.000">Rp 8.850.000 (Inhouse Soft Skill)</SelectItem>
                    <SelectItem value="Rp 12.100.000">Rp 12.100.000 (Inhouse Blasting Cert)</SelectItem>
                    <SelectItem value="Rp 14.500.000">Rp 14.500.000 (Fleet Inhouse)</SelectItem>
                    <SelectItem value="Rp 14.700.000">Rp 14.700.000 (Outhouse POP SMKP)</SelectItem>
                    <SelectItem value="Rp 15.300.000">Rp 15.300.000 (Outhouse ISO Auditor)</SelectItem>
                    <SelectItem value="Rp 15.600.000">Rp 15.600.000 (Inhouse Mine Planning)</SelectItem>
                    <SelectItem value="Rp 16.300.000">Rp 16.300.000 (Outhouse Python AI)</SelectItem>
                    <SelectItem value="Rp 17.400.000">Rp 17.400.000 (Outhouse POM SMKP)</SelectItem>
                    <SelectItem value="Rp 18.500.000">Rp 18.500.000 (Inhouse Analytics Maintenance)</SelectItem>
                    <SelectItem value="Rp 19.450.000">Rp 19.450.000 (Outhouse Finance)</SelectItem>
                    <SelectItem value="Rp 22.050.000">Rp 22.050.000 (Outhouse ECDP Leadership)</SelectItem>
                    <SelectItem value="Rp 24.250.000">Rp 24.250.000 (Outhouse Geoteknik Slope)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 10. DROPDOWN: Tipe Pre-Assessment */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Ketentuan Pre-Assessment <span className="text-red-500">*</span>
                </Label>
                <Select value={formPreAssessmentType} onValueChange={(v) => setFormPreAssessmentType(v as PreAssessmentType)}>
                  <SelectTrigger className="bg-white border-slate-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wajib - Online Pre-Test SMKP">Wajib - Online Pre-Test SMKP</SelectItem>
                    <SelectItem value="Wajib - Self-Assessment Competency Radar">Wajib - Self-Assessment Competency Radar</SelectItem>
                    <SelectItem value="Wajib - Technical Baseline Exam">Wajib - Technical Baseline Exam</SelectItem>
                    <SelectItem value="Opsional - Pre-Training Survey">Opsional - Pre-Training Survey</SelectItem>
                    <SelectItem value="Tidak Ada Pre-Assessment">Tidak Ada Pre-Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 11. SATU-SATUNYA FIELD KETIK: Catatan Pre-Assessment & Kesiapan Karyawan */}
              <div className="space-y-1 sm:col-span-2 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                <Label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5 text-amber-700" />
                  Catatan / Kesiapan Pre-Assessment (Free Text Input)
                </Label>
                <p className="text-[11px] text-amber-800">
                  Tuliskan hasil self-assessment awal, persiapan modul pra-pelatihan, atau justifikasi kesiapan Anda mengikuti program ini:
                </p>
                <Textarea
                  rows={3}
                  value={formPreAssessmentNotes}
                  onChange={(e) => setFormPreAssessmentNotes(e.target.value)}
                  placeholder="Contoh: Telah menyelesaikan modul pengantar SMKP level 1 dan mendapatkan skor pre-test 82/100, siap mengikuti sertifikasi lanjutan..."
                  className="bg-white border-amber-300 text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2 font-bold bg-primary text-slate-950 hover:bg-primary/90">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim Pengajuan ke Atasan (Leader)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusRequestBadge({ status }: { status: EmployeeTrainingRequest["status"] }) {
  if (status === "APPROVED_BY_LEADER") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 text-[11px]">
        <CheckCircle2 className="h-3 w-3" /> Disetujui Atasan
      </Badge>
    );
  }
  if (status === "REJECTED_BY_LEADER") {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300 gap-1 text-[11px]">
        <XCircle className="h-3 w-3" /> Perlu Penyesuaian
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-[11px]">
      <Clock className="h-3 w-3" /> Menunggu Approval Atasan
    </Badge>
  );
}
