"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitCommitVertical, PieChart as PieIcon, X, Filter } from "lucide-react";

export type PromotionChartData = {
  stageDistribution: Array<{
    name: string;
    count: number;
    fill: string;
  }>;
  statusProportions: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  pilarSummary: {
    submissionCompleted: number;
    submissionPending: number;
    threeSixtyCompleted: number;
    threeSixtyPending: number;
    presentationCompleted: number;
    presentationScheduled: number;
    presentationPending: number;
  };
  totalCount: number;
};

export function PromotionCharts({ data }: { data: PromotionChartData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams?.get("status") || "";

  function handleStageClick(stageName: string) {
    if (!stageName) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (params.get("status") === stageName) {
      params.delete("status");
    } else {
      params.set("status", stageName);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleResetFilter() {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("status");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const activeProportions = data.statusProportions.filter((p) => p.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* 1. Bar Chart: Pipeline Tahapan Approval Promosi */}
      <Card className="border-slate-200/90 shadow-xs lg:col-span-7 bg-white flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitCommitVertical className="h-4 w-4 text-emerald-600" />
                Pipeline Tahapan Persetujuan Promosi
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Klik tahapan untuk memfilter tabel di bawah • Default menampilkan semua
              </CardDescription>
            </div>
            
            {/* Filter Pill / Total Usulan */}
            <div className="flex items-center gap-2 shrink-0">
              {activeStatus ? (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Klik untuk tampilkan semua"
                >
                  <Filter className="h-3 w-3 text-emerald-400" />
                  <span>Filter: {activeStatus}</span>
                  <X className="h-3.5 w-3.5 text-slate-300 hover:text-white" />
                </button>
              ) : (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 text-right">
                  <span className="block text-[10px] font-semibold uppercase text-emerald-700">Total Usulan</span>
                  <span className="text-sm font-bold text-emerald-950">{data.totalCount} Orang</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.stageDistribution}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    handleStageClick(state.activeLabel);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#334155", fontWeight: 500 }}
                  width={150}
                  axisLine={{ stroke: "#e2e8f0" }}
                  style={{ cursor: "pointer" }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} Karyawan (Klik untuk filter)`, "Jumlah"]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah"
                  radius={[0, 6, 6, 0]}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    if (entry && entry.name) {
                      handleStageClick(entry.name);
                    }
                  }}
                >
                  {data.stageDistribution.map((entry, index) => {
                    const isSelected = activeStatus === entry.name;
                    const isAnySelected = Boolean(activeStatus);
                    const opacity = isAnySelected ? (isSelected ? 1 : 0.35) : 1;
                    const stroke = isSelected ? "#0f172a" : undefined;
                    const strokeWidth = isSelected ? 2 : 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        fillOpacity={opacity}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        className="cursor-pointer transition-opacity duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 mt-1">
            <span>💡 Klik bar untuk memfilter data tabel</span>
            {activeStatus && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Reset ke Tampil Semua
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Donut Chart + 3 Pilar Kesiapan Promosi */}
      <Card className="border-slate-200/90 shadow-xs lg:col-span-5 bg-white flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-sky-600" />
            Proporsi Status & Pilar Monitoring
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Komposisi status usulan dan pemenuhan 3 pilar promosi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Donut Chart */}
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0 relative cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeProportions.length > 0 ? activeProportions : [{ name: "Kosong", value: 1, fill: "#e2e8f0" }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    onClick={(entry) => {
                      if (entry && entry.name && entry.name !== "Kosong") {
                        handleStageClick(entry.name);
                      }
                    }}
                  >
                    {(activeProportions.length > 0 ? activeProportions : [{ name: "Kosong", value: 1, fill: "#e2e8f0" }]).map((entry, index) => {
                      const isSelected = activeStatus === entry.name;
                      const isAnySelected = Boolean(activeStatus);
                      const opacity = isAnySelected ? (isSelected ? 1 : 0.35) : 1;
                      return (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={entry.fill}
                          fillOpacity={opacity}
                          className="cursor-pointer transition-opacity duration-200"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Usulan (Klik untuk filter)`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                <span className="text-xs font-semibold text-slate-400">Total</span>
                <span className="text-base font-bold text-slate-800">{data.totalCount}</span>
              </div>
            </div>

            {/* Status Legend List (Interactive Click) */}
            <div className="flex-1 space-y-1 min-w-0">
              {activeProportions.length > 0 ? (
                activeProportions.map((item) => {
                  const isSelected = activeStatus === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleStageClick(item.name)}
                      className={`w-full flex items-center justify-between text-xs px-2 py-1 rounded-md transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="truncate text-[11px]">{item.name}</span>
                      </div>
                      <span className={`text-xs ml-2 ${isSelected ? "text-white" : "font-bold text-slate-900"}`}>
                        {item.value}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada data usulan promosi.</p>
              )}
            </div>
          </div>

          {/* 3 Pilar Monitoring Summary */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Pemenuhan 3 Pilar Promosi
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Pilar 1 */}
              <div className="rounded-lg bg-white border border-slate-200/60 p-2">
                <div className="text-[10px] text-slate-500 font-medium">1. Pengajuan</div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">
                  {data.pilarSummary.submissionCompleted} <span className="text-[9.5px] font-normal text-slate-400">Diajukan</span>
                </div>
              </div>
              {/* Pilar 2 */}
              <div className="rounded-lg bg-white border border-slate-200/60 p-2">
                <div className="text-[10px] text-slate-500 font-medium">2. 360° Review</div>
                <div className="text-xs font-bold text-emerald-700 mt-0.5">
                  {data.pilarSummary.threeSixtyCompleted} <span className="text-[9.5px] font-normal text-slate-400">Lengkap</span>
                </div>
              </div>
              {/* Pilar 3 */}
              <div className="rounded-lg bg-white border border-slate-200/60 p-2">
                <div className="text-[10px] text-slate-500 font-medium">3. Presentasi</div>
                <div className="text-xs font-bold text-blue-700 mt-0.5">
                  {data.pilarSummary.presentationCompleted} <span className="text-[9.5px] font-normal text-slate-400">Selesai</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
