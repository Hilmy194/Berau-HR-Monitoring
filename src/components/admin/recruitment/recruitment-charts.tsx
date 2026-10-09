"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Share2, GitCommitHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProcessesByDept = {
  department: string;
  fullDepartment: string;
  count: number;
};

type SourceSlice = {
  name: string;
  value: number;
  percentage: number;
  fill: string;
};

type StepRecruitment = {
  step: string;
  shortStep: string;
  count: number;
  percentage: number;
  fill: string;
};

type RecruitmentChartsProps = {
  processesByDepartment: ProcessesByDept[];
  candidatesBySource: SourceSlice[];
  stepByRecruitment: StepRecruitment[];
};

export function RecruitmentCharts({
  processesByDepartment,
  candidatesBySource,
  stepByRecruitment,
}: RecruitmentChartsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* 1. Processes by Department */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-primary to-emerald-400" />
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Processes by Department</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Jumlah kandidat aktif per departemen</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {processesByDepartment.length} Dept
            </span>
          </div>

          <div className="h-[260px] w-full mt-2">
            {processesByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processesByDepartment}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={110}
                    tick={{ fontSize: 10, fill: "#334155" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as ProcessesByDept;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                          <p className="font-semibold text-slate-900">{item.fullDepartment}</p>
                          <p className="mt-1 text-emerald-700 font-bold">{item.count} kandidat dalam proses</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} barSize={16}>
                    {processesByDepartment.map((entry, index) => (
                      <Cell
                        key={`cell-dept-${index}`}
                        fill={index % 2 === 0 ? "#059669" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Belum ada data proses departemen
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Candidates by Source Channel */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Share2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Candidates by Source</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Saluran & asal pendaftaran pelamar</p>
            </div>
            <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold">
              Workable Source
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={candidatesBySource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {candidatesBySource.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as SourceSlice;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 font-bold" style={{ color: item.fill }}>
                          {item.value} Kandidat ({item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-slate-100 max-h-[90px] overflow-y-auto">
            {candidatesBySource.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-[11px] font-medium text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900">{item.value}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Step by Recruitment */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:col-span-2 xl:col-span-1">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <GitCommitHorizontal className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Step by Recruitment</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Distribusi pipeline tahapan rekrutmen</p>
            </div>
            <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
              8 Tahapan
            </span>
          </div>

          <div className="h-[260px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stepByRecruitment}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortStep"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as StepRecruitment;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-slate-900">{item.step}</p>
                        <p className="mt-1 font-bold" style={{ color: item.fill }}>
                          {item.count} Kandidat ({item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={20}>
                  {stepByRecruitment.map((entry, index) => (
                    <Cell key={`cell-step-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
