"use client";

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
import { Users, PieChart as PieIcon, BarChart3, Building2, Layers } from "lucide-react";
import type { DemographicsSummary } from "@/lib/services/dashboard-analytics.service";

interface DemographicsChartsProps {
  genderDistribution: DemographicsSummary["genderDistribution"];
  ageDistribution: DemographicsSummary["ageDistribution"];
  generationDistribution: DemographicsSummary["generationDistribution"];
  employmentStatusDistribution: DemographicsSummary["employmentStatusDistribution"];
  directorateDistribution: DemographicsSummary["directorateDistribution"];
  levelDistribution: DemographicsSummary["levelDistribution"];
}

export function DemographicsCharts({
  genderDistribution,
  ageDistribution,
  generationDistribution,
  employmentStatusDistribution,
  directorateDistribution,
  levelDistribution,
}: DemographicsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: Gender & Employment Status Donut Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gender Distribution */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-blue-600" />
                  Komposisi Jenis Kelamin
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Rasio perbandingan karyawan Laki-laki dan Perempuan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Karyawan`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Pie
                    data={genderDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              {genderDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{item.value}</span>
                    <span className="ml-1 text-[11px] text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employment Status Distribution */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  Status Kepegawaian
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Distribusi kontrak kerja: Permanent (Tetap), Kontrak (PKWT), Probation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Karyawan`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Pie
                    data={employmentStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {employmentStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {employmentStatusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {item.value} <span className="text-[10px] text-muted-foreground font-normal">({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Age Distribution & Generational Cohorts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Age Groups Bar Chart */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Kelompok Rentang Umur Karyawan
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Distribusi headcount berdasarkan rentang umur (tahun)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} Karyawan`, "Jumlah"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="value" name="Jumlah Karyawan" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-5 gap-1.5 border-t border-slate-100 pt-3 text-center">
              {ageDistribution.map((item) => (
                <div key={item.name} className="rounded bg-indigo-50/60 p-1.5">
                  <p className="text-[11px] font-medium text-indigo-900">{item.name}</p>
                  <p className="text-xs font-bold text-indigo-700">{item.value}</p>
                  <p className="text-[10px] text-indigo-500">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generational Breakdown */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Profil Kohort Generasi
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Komposisi demografi: Gen Z, Millennials, Gen X, dan Boomers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generationDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="name" type="category" tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} width={110} />
                  <Tooltip
                    formatter={(value: any) => [`${value} Karyawan`, "Jumlah"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="value" name="Jumlah Karyawan" fill="#9333ea" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {generationDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-purple-50/60 p-2 text-xs">
                  <span className="font-medium text-purple-900 truncate">{item.name}</span>
                  <span className="font-bold text-purple-700 shrink-0 ml-2">
                    {item.value} <span className="font-normal text-[10px] text-purple-500">({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Directorate & Level Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Directorate Breakdown */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Persebaran Karyawan per Direktorat
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Total populasi karyawan aktif di setiap Direktorat PT Berau Coal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={directorateDistribution.slice(0, 6)} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="name" type="category" tickLine={false} tick={{ fontSize: 10, fill: "#334155" }} width={130} />
                  <Tooltip
                    formatter={(value: any) => [`${value} Karyawan`, "Headcount"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" name="Headcount" fill="#059669" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Level Breakdown */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-600" />
              Distribusi Level Jabatan (PS Level)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Struktur jenjang pangkat dan level jabatan karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelDistribution.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} Karyawan`, "Headcount"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" name="Headcount" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
