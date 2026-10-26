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
import { BookOpenCheck, Building2, FileCheck2 } from "lucide-react";
import type { OdDashboardMetrics } from "@/lib/services/dashboard-analytics.service";

interface OdChartsProps {
  competencyLevels: OdDashboardMetrics["competencyLevels"];
  directoratePositions: OdDashboardMetrics["directoratePositions"];
  jobDescriptionCoverage: OdDashboardMetrics["jobDescriptionCoverage"];
}

export function OdCharts({ competencyLevels, directoratePositions, jobDescriptionCoverage }: OdChartsProps) {
  const jdCoverageData = [
    { name: "Lengkap Terdefinisi", value: jobDescriptionCoverage.complete, fill: "#16a34a" },
    { name: "Dalam Proses Review", value: jobDescriptionCoverage.inProgress, fill: "#f59e0b" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Competency Levels */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-purple-600" />
            Distribusi Tingkat Kompetensi
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Proficiency level (Basic, Intermediate, Advanced, Expert)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competencyLevels} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Kompetensi`, "Jumlah"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="count" name="Kompetensi" radius={[6, 6, 0, 0]}>
                  {competencyLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Job Description Coverage Donut */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-600" />
            Cakupan Job Description
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Kelengkapan uraian tugas &amp; tanggung jawab posisi ({jobDescriptionCoverage.percentage}% Terpenuhi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Posisi`, name]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Pie
                  data={jdCoverageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {jdCoverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Positions by Directorate */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Jumlah Jabatan per Direktorat
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Persebaran jenis posisi dalam arsitektur organisasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={directoratePositions.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tickLine={false} tick={{ fontSize: 9, fill: "#334155" }} width={100} />
                <Tooltip
                  formatter={(value: any) => [`${value} Posisi`, "Jumlah"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="positions" name="Posisi" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
