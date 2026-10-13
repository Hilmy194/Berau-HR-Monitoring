"use client";

import { useMemo, useState, useRef } from "react";
import {
  Building,
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  ReportingStructureData,
  ReportingTreeNode,
} from "@/lib/services/reporting-structure.service";
import { cn } from "@/lib/utils";
import { PositionEditModal, type PositionData } from "./position-edit-modal";
import { PositionCreateModal } from "./position-create-modal";

export function ReportingStructureView({
  data,
}: {
  data: ReportingStructureData;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>("ALL");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  const [editingPosition, setEditingPosition] = useState<PositionData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleEditNode(node: ReportingTreeNode) {
    setEditingPosition({
      id: node.id,
      positionCode: node.positionCode,
      positionName: node.positionName,
      jobLevel: node.jobLevel,
      currentHolder: node.holderName === "Tanpa Nama" ? "" : node.holderName,
      holderPersonnelNumber: node.holderNik,
      reportsToId: node.reportsToId,
      departmentId: node.departmentId,
      departmentName: node.departmentName,
    });
    setIsEditOpen(true);
  }

  // List of all unique directorates for filtering
  const directorateOptions = useMemo(() => {
    return Array.from(new Set(data.directorates.map((d) => d.name))).sort();
  }, [data.directorates]);

  // Filter roots by selected Directorate and Search query
  const filteredRoots = useMemo(() => {
    let roots = data.roots;

    // Filter by directorate if selected
    if (selectedDirectorate !== "ALL") {
      const directMatches = roots.filter((r) => r.directorateName === selectedDirectorate);
      if (directMatches.length > 0) {
        roots = directMatches;
      } else {
        const matchingDescendantRoots = roots
          .flatMap((r) => r.children)
          .filter((c) => c.directorateName === selectedDirectorate || hasDescendantInDirectorate(c, selectedDirectorate));

        if (matchingDescendantRoots.length > 0) {
          roots = matchingDescendantRoots;
        } else {
          roots = roots.filter(
            (r) =>
              r.directorateName === selectedDirectorate ||
              hasDescendantInDirectorate(r, selectedDirectorate)
          );
        }
      }
    }

    // Filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      function filterNode(node: ReportingTreeNode): ReportingTreeNode | null {
        const selfMatches =
          node.holderName.toLowerCase().includes(q) ||
          node.positionName.toLowerCase().includes(q) ||
          node.holderNik.includes(q) ||
          node.departmentName.toLowerCase().includes(q) ||
          node.divisionName.toLowerCase().includes(q);

        const matchingChildren = node.children
          .map(filterNode)
          .filter(Boolean) as ReportingTreeNode[];

        if (selfMatches || matchingChildren.length > 0) {
          return {
            ...node,
            children: matchingChildren.length > 0 ? matchingChildren : node.children,
          };
        }
        return null;
      }

      roots = roots.map(filterNode).filter(Boolean) as ReportingTreeNode[];
    }

    return roots;
  }, [data.roots, selectedDirectorate, searchQuery]);

  function handleExpandAll(expand: boolean) {
    setAllExpanded(expand);
    const next: Record<string, boolean> = {};
    if (expand) {
      function collect(node: ReportingTreeNode) {
        next[node.id] = true;
        node.children.forEach(collect);
      }
      data.roots.forEach(collect);
    }
    setExpandedNodes(next);
  }

  function handleResetZoom() {
    setZoomLevel(100);
  }

  return (
    <div className="space-y-5">
      {/* Header Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Users}
          label="Total Karyawan Terdaftar"
          value={`${data.totalEmployees} orang`}
          color="emerald"
        />
        <SummaryCard
          icon={Building}
          label="Total Departemen"
          value={`${data.totalDepartments} departemen`}
          color="blue"
        />
        <SummaryCard
          icon={Network}
          label="Divisi & Direktorat"
          value={`${data.totalDivisions} div · ${data.totalDirectorates} dir`}
          color="amber"
        />
      </div>

      {/* Main Org Chart Workspace Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/90 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                  <Network className="h-5 w-5 text-emerald-600" />
                  Bagan Struktur Organisasi (Top-Down Tree)
                </CardTitle>
                {data.source === "BIGQUERY" && (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-800">
                    BigQuery Live Mirror {data.latestPeriod ? `· ${data.latestPeriod}` : ""}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Struktur hirarki komando atas-ke-bawah resmi PT Berau Coal.
              </p>
            </div>

            {/* Filter & Canvas Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Directorate Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedDirectorate}
                  onChange={(e) => setSelectedDirectorate(e.target.value)}
                  className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">Semua Direktorat (Seluruh Perusahaan)</option>
                  {directorateOptions.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, jabatan..."
                  className="h-8.5 pl-8 text-xs bg-white"
                />
              </div>

              {/* Zoom & Expand Controls */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
                  className="h-7 w-7 p-0 text-slate-700 hover:bg-white"
                  title="Perkecil Tampilan (Zoom Out)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-mono font-semibold text-slate-600 px-1 min-w-10 text-center">
                  {zoomLevel}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
                  className="h-7 w-7 p-0 text-slate-700 hover:bg-white"
                  title="Perbesar Tampilan (Zoom In)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-7 px-1.5 text-[10px] text-slate-600 hover:bg-white"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3 w-3 mr-0.5" /> 100%
                </Button>
              </div>

              {/* Expand / Collapse All */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExpandAll(true)}
                  className="h-8.5 px-2 text-xs gap-1 bg-white text-slate-700"
                  title="Buka Semua Cabang"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Buka Semua</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExpandAll(false)}
                  className="h-8.5 px-2 text-xs gap-1 bg-white text-slate-700"
                  title="Tutup Semua Cabang"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tutup Semua</span>
                </Button>
              </div>

              {/* Action: Tambah Posisi Manual */}
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-8.5 px-2.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
                title="Tambah Posisi Baru"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tambah Posisi</span>
              </Button>
            </div>
          </div>

          {/* Color Legend (Panduan Warna Kesetaraan Jabatan) */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-600 shrink-0 uppercase tracking-wider">
              Keterangan:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {POSITION_TIER_LEGEND.map((leg) => (
                <span
                  key={leg.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-semibold shrink-0 shadow-2xs",
                    leg.bg
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0 shadow-2xs", leg.color)} />
                  <span className={leg.text}>{leg.label}</span>
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Tree Canvas with Grid Background and Drag/Scroll */}
        <CardContent className="p-0 bg-slate-900/[0.02] overflow-auto min-h-[550px] max-h-[78vh] relative [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
          <div
            className="p-8 sm:p-12 min-w-max flex flex-col items-center justify-start transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {filteredRoots.length > 0 ? (
              <div className="flex flex-row justify-center gap-16 items-start">
                {filteredRoots.map((rootNode) => (
                  <TopDownOrgNode
                    key={rootNode.id}
                    node={rootNode}
                    depth={0}
                    isFirst={true}
                    isLast={true}
                    totalSiblings={1}
                    searchQuery={searchQuery}
                    allExpanded={allExpanded}
                    expandedNodes={expandedNodes}
                    setExpandedNodes={setExpandedNodes}
                    onEditNode={handleEditNode}
                  />
                ))}
              </div>
            ) : (
              <div className="my-20 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-muted-foreground shadow-2xs">
                Tidak ada data struktur organisasi yang cocok dengan filter atau pencarian &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit & Create Position Modals */}
      <PositionEditModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingPosition(null);
        }}
        initialData={editingPosition}
      />

      <PositionCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

/* ========================================================================= */
/* KLASIFIKASI WARNA DAN KESETARAAN JABATAN (COLOR HIERARCHY MAPPING)       */
/* ========================================================================= */
export type PositionTierCategory = {
  key: string;
  label: string;
  shortLabel: string;
  cardBg: string;
  borderColor: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  titleColor: string;
  nikColor: string;
  subordinateBtnBorder: string;
  subordinateBtnBg: string;
  subordinateBtnText: string;
};

export const POSITION_TIER_LEGEND = [
  { key: "presdir", label: "President Director", color: "bg-amber-500", text: "text-amber-950", bg: "bg-amber-50/90 border-amber-300" },
  { key: "director", label: "Director / C-Level", color: "bg-indigo-600", text: "text-indigo-950", bg: "bg-indigo-50/90 border-indigo-300" },
  { key: "gm", label: "General Manager / Div Head", color: "bg-purple-600", text: "text-purple-950", bg: "bg-purple-50/90 border-purple-300" },
  { key: "manager", label: "Manager / Dept Head", color: "bg-teal-600", text: "text-teal-950", bg: "bg-teal-50/90 border-teal-300" },
  { key: "supt", label: "Superintendent", color: "bg-emerald-600", text: "text-emerald-950", bg: "bg-emerald-50/90 border-emerald-300" },
  { key: "spv", label: "Supervisor / Specialist", color: "bg-sky-500", text: "text-sky-950", bg: "bg-sky-50/90 border-sky-300" },
  { key: "officer", label: "Engineer / Officer", color: "bg-orange-500", text: "text-orange-950", bg: "bg-orange-50/90 border-orange-300" },
  { key: "foreman", label: "Foreman", color: "bg-rose-500", text: "text-rose-950", bg: "bg-rose-50/90 border-rose-300" },
  { key: "staff", label: "Staff / Pelaksana", color: "bg-slate-500", text: "text-slate-900", bg: "bg-slate-100 border-slate-300" },
];

export function getPositionTierCategory(
  positionName: string,
  jobLevel?: string,
  depth: number = 0
): PositionTierCategory {
  const normPos = (positionName || "").trim().toLowerCase();
  const normLvl = (jobLevel || "").trim().toLowerCase();

  // 1. President Director / CEO / Apex Executive
  if (
    normPos.includes("president director") ||
    normPos.includes("direktur utama") ||
    normPos.includes("presdir") ||
    normPos.includes("ceo") ||
    normPos.includes("fuganto") ||
    normLvl.includes("president director") ||
    (depth === 0 && !normPos.includes("director") && !normPos.includes("head") && !normPos.includes("manager"))
  ) {
    return {
      key: "presdir",
      label: "President Director",
      shortLabel: "Presdir",
      cardBg: "bg-linear-to-b from-amber-50/90 via-amber-50/30 to-white",
      borderColor: "border-amber-400 shadow-amber-500/15 ring-1 ring-amber-400/40",
      accentBg: "bg-linear-to-r from-amber-500 to-yellow-500",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-950 font-bold",
      badgeBorder: "border-amber-300",
      titleColor: "text-amber-900 font-extrabold",
      nikColor: "text-amber-700",
      subordinateBtnBorder: "border-amber-400",
      subordinateBtnBg: "bg-amber-50 hover:bg-amber-100",
      subordinateBtnText: "text-amber-900",
    };
  }

  // 2. Director / C-Level / BOD / ABOD
  if (
    normPos.includes("director") ||
    normPos.includes("direktur") ||
    normPos.includes("chief") ||
    normPos.includes("c-level") ||
    normPos.includes("abod") ||
    normPos.includes("board of director") ||
    normLvl === "director" ||
    normLvl === "c-level" ||
    (depth === 1 && (normPos.includes("head") || normPos.includes("gm")))
  ) {
    return {
      key: "director",
      label: "Director / C-Level",
      shortLabel: "Director",
      cardBg: "bg-linear-to-b from-indigo-50/90 via-indigo-50/30 to-white",
      borderColor: "border-indigo-400 shadow-indigo-500/15 ring-1 ring-indigo-400/40",
      accentBg: "bg-linear-to-r from-indigo-600 to-blue-600",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-950 font-bold",
      badgeBorder: "border-indigo-300",
      titleColor: "text-indigo-900 font-extrabold",
      nikColor: "text-indigo-700",
      subordinateBtnBorder: "border-indigo-400",
      subordinateBtnBg: "bg-indigo-50 hover:bg-indigo-100",
      subordinateBtnText: "text-indigo-900",
    };
  }

  // 3. General Manager / Division Head / Vice President
  if (
    normPos.includes("general manager") ||
    normPos.includes("gm ") ||
    normPos.endsWith(" gm") ||
    normPos.includes("division head") ||
    normPos.includes("div head") ||
    normPos.includes("div. head") ||
    normPos.includes("vice president") ||
    normPos.includes("vp ") ||
    normLvl.includes("general manager") ||
    normLvl.includes("gm") ||
    normLvl.includes("division head")
  ) {
    return {
      key: "gm",
      label: "General Manager / Div Head",
      shortLabel: "GM / Div Head",
      cardBg: "bg-linear-to-b from-purple-50/90 via-purple-50/30 to-white",
      borderColor: "border-purple-400 shadow-purple-500/15 ring-1 ring-purple-400/40",
      accentBg: "bg-linear-to-r from-purple-600 to-violet-600",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-950 font-bold",
      badgeBorder: "border-purple-300",
      titleColor: "text-purple-900 font-extrabold",
      nikColor: "text-purple-700",
      subordinateBtnBorder: "border-purple-400",
      subordinateBtnBg: "bg-purple-50 hover:bg-purple-100",
      subordinateBtnText: "text-purple-900",
    };
  }

  // 4. Senior Manager / Manager / Department Head
  if (
    normPos.includes("manager") ||
    normPos.includes("dept head") ||
    normPos.includes("department head") ||
    normPos.includes("dept. head") ||
    normLvl.includes("manager")
  ) {
    return {
      key: "manager",
      label: "Senior Manager / Manager",
      shortLabel: "Manager",
      cardBg: "bg-linear-to-b from-teal-50/90 via-teal-50/30 to-white",
      borderColor: "border-teal-400 shadow-teal-500/15 ring-1 ring-teal-400/40",
      accentBg: "bg-linear-to-r from-teal-600 to-emerald-600",
      badgeBg: "bg-teal-100",
      badgeText: "text-teal-950 font-bold",
      badgeBorder: "border-teal-300",
      titleColor: "text-teal-900 font-extrabold",
      nikColor: "text-teal-700",
      subordinateBtnBorder: "border-teal-400",
      subordinateBtnBg: "bg-teal-50 hover:bg-teal-100",
      subordinateBtnText: "text-teal-900",
    };
  }

  // 5. Superintendent / Senior Specialist
  if (
    normPos.includes("superintendent") ||
    normPos.includes("supt") ||
    normPos.includes("senior specialist") ||
    normPos.includes("sr specialist") ||
    normPos.includes("sr. specialist") ||
    normLvl.includes("superintendent") ||
    normLvl.includes("supt")
  ) {
    return {
      key: "supt",
      label: "Superintendent / Sr Specialist",
      shortLabel: "Superintendent",
      cardBg: "bg-linear-to-b from-emerald-50/90 via-emerald-50/30 to-white",
      borderColor: "border-emerald-400 shadow-emerald-500/15 ring-1 ring-emerald-400/40",
      accentBg: "bg-linear-to-r from-emerald-600 to-green-600",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-950 font-bold",
      badgeBorder: "border-emerald-300",
      titleColor: "text-emerald-900 font-extrabold",
      nikColor: "text-emerald-700",
      subordinateBtnBorder: "border-emerald-400",
      subordinateBtnBg: "bg-emerald-50 hover:bg-emerald-100",
      subordinateBtnText: "text-emerald-900",
    };
  }

  // 6. Supervisor / Section Head / Specialist
  if (
    normPos.includes("supervisor") ||
    normPos.includes("spv") ||
    normPos.includes("section head") ||
    normPos.includes("sec head") ||
    normPos.includes("sec. head") ||
    normPos.includes("specialist") ||
    normLvl.includes("supervisor") ||
    normLvl.includes("spv")
  ) {
    return {
      key: "spv",
      label: "Supervisor / Specialist",
      shortLabel: "Supervisor",
      cardBg: "bg-linear-to-b from-sky-50/90 via-sky-50/30 to-white",
      borderColor: "border-sky-400 shadow-sky-500/15 ring-1 ring-sky-400/40",
      accentBg: "bg-linear-to-r from-sky-500 to-blue-500",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-950 font-bold",
      badgeBorder: "border-sky-300",
      titleColor: "text-sky-900 font-extrabold",
      nikColor: "text-sky-700",
      subordinateBtnBorder: "border-sky-400",
      subordinateBtnBg: "bg-sky-50 hover:bg-sky-100",
      subordinateBtnText: "text-sky-900",
    };
  }

  // 7. Engineer / Officer / Analyst / Geologist / Planner
  if (
    normPos.includes("engineer") ||
    normPos.includes("officer") ||
    normPos.includes("analyst") ||
    normPos.includes("geologist") ||
    normPos.includes("surveyor") ||
    normPos.includes("planner") ||
    normPos.includes("coordinator") ||
    normLvl.includes("engineer") ||
    normLvl.includes("officer")
  ) {
    return {
      key: "officer",
      label: "Engineer / Officer / Analyst",
      shortLabel: "Officer",
      cardBg: "bg-linear-to-b from-orange-50/90 via-orange-50/30 to-white",
      borderColor: "border-orange-400 shadow-orange-500/15 ring-1 ring-orange-400/40",
      accentBg: "bg-linear-to-r from-orange-500 to-amber-500",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-950 font-bold",
      badgeBorder: "border-orange-300",
      titleColor: "text-orange-900 font-extrabold",
      nikColor: "text-orange-700",
      subordinateBtnBorder: "border-orange-400",
      subordinateBtnBg: "bg-orange-50 hover:bg-orange-100",
      subordinateBtnText: "text-orange-900",
    };
  }

  // 8. Foreman / Pengawas Lapangan
  if (
    normPos.includes("foreman") ||
    normPos.includes("pengawas") ||
    normLvl.includes("foreman")
  ) {
    return {
      key: "foreman",
      label: "Foreman / Pengawas",
      shortLabel: "Foreman",
      cardBg: "bg-linear-to-b from-rose-50/90 via-rose-50/30 to-white",
      borderColor: "border-rose-400 shadow-rose-500/15 ring-1 ring-rose-400/40",
      accentBg: "bg-linear-to-r from-rose-500 to-pink-500",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-950 font-bold",
      badgeBorder: "border-rose-300",
      titleColor: "text-rose-900 font-extrabold",
      nikColor: "text-rose-700",
      subordinateBtnBorder: "border-rose-400",
      subordinateBtnBg: "bg-rose-50 hover:bg-rose-100",
      subordinateBtnText: "text-rose-900",
    };
  }

  // 9. Staff Pelaksana / Operator / Umum
  return {
    key: "staff",
    label: "Staff / Pelaksana / Operator",
    shortLabel: "Staff",
    cardBg: "bg-linear-to-b from-slate-100/90 via-slate-50/30 to-white",
    borderColor: "border-slate-300 shadow-slate-500/10",
    accentBg: "bg-slate-400",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800 font-bold",
    badgeBorder: "border-slate-200",
    titleColor: "text-slate-800 font-extrabold",
    nikColor: "text-slate-500",
    subordinateBtnBorder: "border-slate-300",
    subordinateBtnBg: "bg-slate-50 hover:bg-slate-100",
    subordinateBtnText: "text-slate-800",
  };
}

/* ========================================================================= */
/* TOP-DOWN TREE NODE COMPONENT (Classic Tree Chart with Horizontal Connectors) */
/* ========================================================================= */
function TopDownOrgNode({
  node,
  depth,
  isFirst,
  isLast,
  totalSiblings,
  searchQuery,
  allExpanded,
  expandedNodes,
  setExpandedNodes,
  onEditNode,
}: {
  node: ReportingTreeNode;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  totalSiblings: number;
  searchQuery?: string;
  allExpanded?: boolean | null;
  expandedNodes: Record<string, boolean>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onEditNode?: (node: ReportingTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0);
  const tier = getPositionTierCategory(node.positionName, node.jobLevel, depth);

  // Default: Root and immediate direct reports (depth <= 1) are expanded
  const isDefaultOpen = depth <= 1 || isSearchActive;
  const isExpanded =
    allExpanded !== null && allExpanded !== undefined
      ? allExpanded
      : (expandedNodes[node.id] ?? isDefaultOpen);

  function toggleOpen() {
    if (!hasChildren) return;
    setExpandedNodes((prev) => ({
      ...prev,
      [node.id]: !isExpanded,
    }));
  }

  // Check if this node matches search
  const isMatched =
    isSearchActive &&
    (node.holderName.toLowerCase().includes(searchQuery!.toLowerCase()) ||
      node.positionName.toLowerCase().includes(searchQuery!.toLowerCase()) ||
      node.holderNik.includes(searchQuery!));

  return (
    <div className="flex flex-col items-center relative px-3">
      {/* 1. TOP VERTICAL CONNECTOR (Line from parent to this node) */}
      {depth > 0 && (
        <div className="w-[2px] h-6 bg-slate-300 shrink-0" />
      )}

      {/* 2. HORIZONTAL SIBLING CONNECTOR BAR */}
      {depth > 0 && totalSiblings > 1 && (
        <div
          className={cn(
            "absolute top-0 h-[2px] bg-slate-300",
            isFirst && "left-1/2 right-0",
            isLast && "left-0 right-1/2",
            !isFirst && !isLast && "left-0 right-0"
          )}
        />
      )}

      {/* 3. NODE BOX CARD (Color-Coded by Position & Equivalence) */}
      <div
        onClick={hasChildren ? toggleOpen : undefined}
        className={cn(
          "w-56 sm:w-64 rounded-xl border overflow-hidden transition-all select-none shadow-xs cursor-pointer relative group hover:shadow-lg",
          tier.borderColor,
          tier.cardBg,
          isMatched && "ring-3 ring-emerald-500 scale-105 z-10 shadow-xl",
          hasChildren && "hover:-translate-y-0.5"
        )}
      >
        {/* Top colored accent indicator bar */}
        <div className={cn("h-1.5 w-full shrink-0", tier.accentBg)} />

        <div className="p-3">
          {/* Header: Level Badge, NIK & Quick Edit Button */}
          <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-black/5">
            <span
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full border shadow-2xs shrink-0 tracking-wide uppercase",
                tier.badgeBg,
                tier.badgeText,
                tier.badgeBorder
              )}
            >
              {tier.shortLabel}
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className={cn("text-[10px] font-mono font-medium truncate", tier.nikColor)}>
                NIK: {node.holderNik}
              </span>
              {onEditNode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNode(node);
                  }}
                  title="Edit Posisi / Ganti Atasan"
                  className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-black/5 transition-colors shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Position & Holder Name */}
          <div className="space-y-0.5 text-center my-1.5">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-2" title={node.holderName}>
              {node.holderName}
            </h3>
            <p className={cn("text-[11px] leading-snug line-clamp-2", tier.titleColor)} title={node.positionName}>
              {node.positionName}
            </p>
          </div>

          {/* Department & Division Footer */}
          <div className="pt-1.5 mt-1 border-t border-black/5 text-center">
            <p className="text-[10px] text-slate-500 font-medium truncate" title={`${node.departmentName} • ${node.divisionName}`}>
              {node.departmentName}
            </p>
          </div>

          {/* Subordinates Pill Button */}
          {hasChildren && (
            <div className="mt-2 pt-1 flex justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen();
                }}
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors border shadow-2xs",
                  isExpanded
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                    : cn(tier.subordinateBtnBg, tier.subordinateBtnText, tier.subordinateBtnBorder)
                )}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    <span>{node.children.length} Bawahan</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    <span>+{node.children.length} Bawahan ({node.totalSubordinatesCount} tim)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM VERTICAL CONNECTOR (Line going down from this node to children) */}
      {hasChildren && isExpanded && (
        <div className="w-[2px] h-6 bg-slate-300 shrink-0" />
      )}

      {/* 5. CHILDREN ROW */}
      {hasChildren && isExpanded && (
        <div className="flex flex-row justify-center items-start pt-0">
          {node.children.map((child, index) => (
            <TopDownOrgNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isFirst={index === 0}
              isLast={index === node.children.length - 1}
              totalSiblings={node.children.length}
              searchQuery={searchQuery}
              allExpanded={allExpanded}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
              onEditNode={onEditNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Helper to check if any descendant belongs to a directorate */
function hasDescendantInDirectorate(node: ReportingTreeNode, directorateName: string): boolean {
  if (node.directorateName === directorateName) return true;
  return node.children.some((c) => hasDescendantInDirectorate(c, directorateName));
}



function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <Card className="shadow-none border-slate-200">
      <CardContent className="flex items-center gap-3 p-3.5">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <span className="block text-[11px] text-muted-foreground">{label}</span>
          <span className="block truncate text-sm font-bold text-slate-900">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
