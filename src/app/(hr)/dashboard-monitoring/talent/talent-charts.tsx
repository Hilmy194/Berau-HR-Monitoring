"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartNoAxesCombined,
  ShieldCheck,
  GitCompareArrows,
  Layers,
  LayoutGrid,
  BarChart3,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TalentDashboardMetrics } from "@/lib/services/dashboard-analytics.service";

interface TalentChartsProps {
  twelveBoxDistribution?: TalentDashboardMetrics["twelveBoxDistribution"];
  twelveBoxSummary?: TalentDashboardMetrics["twelveBoxSummary"];
  streamDistribution?: TalentDashboardMetrics["streamDistribution"];
  nineBoxDistribution: TalentDashboardMetrics["nineBoxDistribution"];
  readinessDistribution: TalentDashboardMetrics["readinessDistribution"];
  topSkillGaps: TalentDashboardMetrics["topSkillGaps"];
}

export function TalentCharts({
  twelveBoxDistribution = [],
  twelveBoxSummary,
  streamDistribution = [],
  nineBoxDistribution,
  readinessDistribution,
  topSkillGaps,
}: TalentChartsProps) {
  // Default: Chart (Bar Chart) dulu, baru Grid, baru Stream
  const [twelveBoxView, setTwelveBoxView] = useState<"bars" | "grid" | "streams">("bars");

  // Matriks 12-Box Layout: 3 Baris x 4 Kolom
  // Row 1: Progression (> 2.33) -> [Box 10, Box 7, Box 3, Box 1]
  // Row 2: Grow (1.67 - 2.33)   -> [Box 11, Box 8, Box 4, Box 2]
  // Row 3: Stay (< 1.67)         -> [Box 12, Box 9, Box 6, Box 5]
  const matrixLayout: number[][] = [
    [10, 7, 3, 1],
    [11, 8, 4, 2],
    [12, 9, 6, 5],
  ];

  const boxMap = new Map<number, NonNullable<typeof twelveBoxDistribution>[0]>();
  twelveBoxDistribution.forEach((b) => boxMap.set(b.boxNumber, b));

  const totalAllTalent = twelveBoxDistribution.reduce((acc, b) => acc + b.count, 0) || 1;

  // Data sorted for Bar Chart view
  const sortedTwelveBoxes = [...twelveBoxDistribution].sort((a, b) => b.count - a.count);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. MATRIKS TALENT CLASS (12-BOX HARMONI) */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Matriks Talent Class (12-Box)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                People Review Method (4 Stream Harmoni)
              </CardDescription>
            </div>

            {/* Mode Switcher: Urutan: Chart -> Grid -> Stream */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTwelveBoxView("bars")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all flex items-center gap-1",
                  twelveBoxView === "bars"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Tampilan Distribusi Bar Chart (Default)"
              >
                <BarChart3 className="h-3 w-3" />
                <span>Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setTwelveBoxView("grid")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all flex items-center gap-1",
                  twelveBoxView === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Tampilan Matriks Grid 12-Box"
              >
                <LayoutGrid className="h-3 w-3" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setTwelveBoxView("streams")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all flex items-center gap-1",
                  twelveBoxView === "streams"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Tampilan 4 Stream"
              >
                <Sparkles className="h-3 w-3" />
                <span>Stream</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          {/* VIEW 1: BAR CHART DISTRIBUSI 12-BOX (DEFAULT) */}
          {twelveBoxView === "bars" && (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedTwelveBoxes.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#334155" }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: any, _: any, item: any) => [
                      `${value} Karyawan (${Math.round((value / totalAllTalent) * 100)}%)`,
                      `Box ${item.payload.boxNumber}: ${item.payload.name}`,
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  />
                  <Bar dataKey="count" name="Jumlah" radius={[0, 6, 6, 0]}>
                    {sortedTwelveBoxes.slice(0, 6).map((entry, idx) => (
                      <Cell key={`bar-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* VIEW 2: MINI GRID 12-BOX MATRIX (4 KOLOM x 3 BARIS) */}
          {twelveBoxView === "grid" && (
            <div className="h-64 flex flex-col justify-center">
              {/* Header Kolom (Performa) */}
              <div className="grid grid-cols-[38px_repeat(4,1fr)] gap-1 text-[8.5px] font-semibold text-slate-400 text-center mb-1">
                <span className="text-left text-[8px] truncate">Pot\Perf</span>
                <span>Low (&lt;3)</span>
                <span>Med (3-4.5)</span>
                <span>High (4.5-5.5)</span>
                <span className="text-blue-700 font-bold">Very High (≥5.5)</span>
              </div>

              {/* Rows (Potensi) */}
              <div className="space-y-1">
                {matrixLayout.map((rowBoxes, rIdx) => {
                  const rowLabel = rIdx === 0 ? "High" : rIdx === 1 ? "Med" : "Low";
                  const rowSub = rIdx === 0 ? ">2.33" : rIdx === 1 ? "1.67-2.33" : "<1.67";

                  return (
                    <div key={rIdx} className="grid grid-cols-[38px_repeat(4,1fr)] gap-1 items-stretch">
                      {/* Label Baris */}
                      <div className="flex flex-col justify-center rounded bg-slate-50 border border-slate-200 px-1 py-0.5 text-[8px] text-slate-500 leading-tight">
                        <span className="font-bold text-slate-700">{rowLabel}</span>
                        <span className="text-[7px] text-slate-400">{rowSub}</span>
                      </div>

                      {/* 4 Cells */}
                      {rowBoxes.map((boxNum) => {
                        const box = boxMap.get(boxNum);
                        const count = box?.count || 0;
                        const fill = box?.fill || "#94a3b8";

                        // Determine text color based on background
                        const isDarkBg = fill === "#2F489E" || fill === "#2A57AB" || fill === "#00B0F0" || fill === "#C00000";
                        const textClass = isDarkBg ? "text-white" : "text-slate-900";

                        return (
                          <div
                            key={boxNum}
                            style={{ backgroundColor: fill }}
                            title={`Box ${boxNum}: ${box?.name || "-"} (${count} Karyawan) - Group: ${box?.group || "-"}`}
                            className={cn(
                              "rounded-lg p-1 flex flex-col justify-between items-center text-center transition-all hover:scale-105 shadow-2xs h-16",
                              textClass
                            )}
                          >
                            <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter">
                              B{boxNum}
                            </span>
                            <span className="text-sm font-black leading-none drop-shadow-xs">
                              {count}
                            </span>
                            <span className="text-[7.5px] font-medium leading-tight line-clamp-1 opacity-90 max-w-full">
                              {box?.name?.split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Legend Mini */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[8.5px] font-medium pt-2 text-slate-500 border-t border-slate-100 mt-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#2F489E]" /> Global ({twelveBoxSummary?.totalGlobalTalent || 0})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#00B0F0]" /> Top ({twelveBoxSummary?.totalTopTalent || 0})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#92D050]" /> High Perf ({twelveBoxSummary?.totalRewardHighPerformer || 0})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#C9F298]" /> Pool ({twelveBoxSummary?.totalTalentPool || 0})
                </span>
              </div>
            </div>
          )}

          {/* VIEW 3: 4 STREAM SUMMARY */}
          {twelveBoxView === "streams" && (
            <div className="h-64 flex flex-col justify-center space-y-2.5">
              {streamDistribution.map((stream, idx) => {
                const percent = Math.round((stream.count / totalAllTalent) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stream.fill }} />
                        <span className="truncate max-w-[170px]">{stream.name}</span>
                      </span>
                      <span className="font-bold text-slate-900 text-[11px]">
                        {stream.count} <span className="font-normal text-slate-400">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: stream.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Link to Full Interactive 12-Box Directory */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/talent/talent-pool"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Buka Direktori Talent Pool 12-Box Lengkap</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. PROMOTION READINESS DONUT */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ChartNoAxesCombined className="h-4 w-4 text-emerald-600" />
            Kesiapan Promosi Suksesi
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Distribusi kesiapan suksesi posisi kritikal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Kandidat`, name]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Pie
                  data={readinessDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {readinessDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. TOP SKILL NEEDS */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-amber-600" />
            Prioritas Gap Kebutuhan Skill
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Area pengembangan prioritas kandidat talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSkillGaps.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="skill" type="category" tickLine={false} tick={{ fontSize: 9, fill: "#334155" }} width={110} />
                <Tooltip
                  formatter={(value: any) => [`${value} Gap`, "Jumlah"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="candidatesCount" name="Kebutuhan" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
