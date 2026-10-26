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
import { ChartNoAxesCombined, ShieldCheck, GitCompareArrows } from "lucide-react";
import type { TalentDashboardMetrics } from "@/lib/services/dashboard-analytics.service";

interface TalentChartsProps {
  nineBoxDistribution: TalentDashboardMetrics["nineBoxDistribution"];
  readinessDistribution: TalentDashboardMetrics["readinessDistribution"];
  topSkillGaps: TalentDashboardMetrics["topSkillGaps"];
}

export function TalentCharts({
  nineBoxDistribution,
  readinessDistribution,
  topSkillGaps,
}: TalentChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 9-Box / 12-Box Distribution */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            Matriks Talent Class (9-Box)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pemetaan performa vs potensi karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nineBoxDistribution.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tickLine={false} tick={{ fontSize: 9, fill: "#334155" }} width={110} />
                <Tooltip
                  formatter={(value: any) => [`${value} Karyawan`, "Jumlah"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="count" name="Jumlah" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Promotion Readiness Donut */}
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

      {/* Top Skill Needs */}
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
