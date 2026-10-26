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
import { BookOpenCheck, Layers } from "lucide-react";
import type { LearningDashboardMetrics } from "@/lib/services/dashboard-analytics.service";

interface LearningChartsProps {
  statusDistribution: LearningDashboardMetrics["statusDistribution"];
  activityTypeDistribution: LearningDashboardMetrics["activityTypeDistribution"];
}

export function LearningCharts({
  statusDistribution,
  activityTypeDistribution,
}: LearningChartsProps) {
  const activityData = activityTypeDistribution.map((a) => ({
    name: a.name.split("/")[0].trim(),
    count: a.count,
    percentage: a.percentage,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* IDP Status Distribution */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-emerald-600" />
            Status Penyelesaian IDP
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Distribusi progres rencana aksi pengembangan individu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Aktivitas`, name]}
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

      {/* 70:20:10 Activity Count Distribution */}
      <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            Distribusi Tipe Aktivitas 70:20:10
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Komposisi program Experiential, Social, dan Formal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Aktivitas`, "Jumlah"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="count" name="Jumlah Aktivitas" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
