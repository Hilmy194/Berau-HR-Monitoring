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

  // List of all unique directorates for filtering
  const directorateOptions = useMemo(() => {
    return Array.from(new Set(data.directorates.map((d) => d.name))).sort();
  }, [data.directorates]);

  // Filter roots by selected Directorate and Search query
  const filteredRoots = useMemo(() => {
    let roots = data.roots;

    // Filter by directorate if selected
    if (selectedDirectorate !== "ALL") {
      roots = roots.filter(
        (r) =>
          r.directorateName === selectedDirectorate ||
          hasDescendantInDirectorate(r, selectedDirectorate)
      );
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
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                <Network className="h-5 w-5 text-emerald-600" />
                Bagan Struktur Organisasi (Top-Down Tree)
              </CardTitle>
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
    </div>
  );
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
}) {
  const hasChildren = node.children.length > 0;
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0);

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

  const styles = getNodeStyling(node.jobLevel, depth);

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

      {/* 3. NODE BOX CARD */}
      <div
        onClick={hasChildren ? toggleOpen : undefined}
        className={cn(
          "w-56 sm:w-60 rounded-xl border p-3.5 transition-all select-none shadow-sm cursor-pointer",
          styles.container,
          isMatched && "ring-2 ring-emerald-500 shadow-md scale-105",
          hasChildren && "hover:shadow-md hover:-translate-y-0.5"
        )}
      >
        {/* Header Job Level Tag */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5">
          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", styles.badge)}>
            {styles.roleLabel}
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">
            {node.holderNik}
          </span>
        </div>

        {/* Position & Holder Name */}
        <div className="space-y-0.5 text-center my-1.5">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-2" title={node.holderName}>
            {node.holderName}
          </h3>
          <p className="text-[11px] font-semibold text-emerald-700 leading-snug line-clamp-2" title={node.positionName}>
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
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors border shadow-2xs",
                isExpanded
                  ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
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

/* Helper to get card color/role styling */
function getNodeStyling(jobLevel: string, depth: number) {
  const lvl = (jobLevel || "").toUpperCase();

  if (lvl.includes("DIR") || depth === 0) {
    return {
      roleLabel: "Director / Pimpinan",
      container: "bg-gradient-to-b from-purple-50 to-white border-purple-300 text-purple-950",
      badge: "bg-purple-600 text-white",
    };
  }
  if (lvl.includes("GM") || lvl.includes("GENERAL MANAGER") || depth === 1) {
    return {
      roleLabel: "General Manager",
      container: "bg-gradient-to-b from-blue-50 to-white border-blue-300 text-blue-950",
      badge: "bg-blue-600 text-white",
    };
  }
  if (lvl.includes("MANAGER") || lvl.includes("MGR") || depth === 2) {
    return {
      roleLabel: "Manager",
      container: "bg-gradient-to-b from-emerald-50 to-white border-emerald-300 text-emerald-950",
      badge: "bg-emerald-600 text-white",
    };
  }
  if (lvl.includes("SUPT") || lvl.includes("SUPERINTENDENT") || lvl.includes("SECTION")) {
    return {
      roleLabel: "Superintendent / Section Head",
      container: "bg-gradient-to-b from-amber-50 to-white border-amber-300 text-amber-950",
      badge: "bg-amber-600 text-white",
    };
  }
  if (lvl.includes("SUPV") || lvl.includes("SUPERVISOR")) {
    return {
      roleLabel: "Supervisor",
      container: "bg-white border-teal-300 text-slate-900",
      badge: "bg-teal-600 text-white",
    };
  }
  return {
    roleLabel: lvl || "Staff / Officer",
    container: "bg-white border-slate-200 text-slate-800",
    badge: "bg-slate-200 text-slate-700",
  };
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
