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
import { Hourglass, Calendar } from "lucide-react";
import type { RetirementDashboardMetrics } from "@/lib/services/dashboard-analytics.service";

interface RetireChartsProps {
  statusDistribution: RetirementDashboardMetrics["statusDistribution"];
  byYearProjection: RetirementDashboardMetrics["byYearProjection"];
}

export function RetireCharts({
  statusDistribution,
  byYearProjection,
}: RetireChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Horizon Status Pie */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-amber-600" />
            Distribusi Horizon Masa Pensiun
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Kategori urgensi: Kritis (&lt; 2 Thn), Warning (2 - 5 Thn), dan Normal
          </CardDescription>
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
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projection By Year Bar */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Proyeksi Pensiun per Tahun
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Estimasi jumlah karyawan yang mencapai masa purna tugas tahunan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYearProjection} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Karyawan`, "Proyeksi"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="count" name="Proyeksi Pensiun" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
