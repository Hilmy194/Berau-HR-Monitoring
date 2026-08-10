"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
};

type TrendPoint = {
  month: string;
  count: number;
};

type ProbationDashboardChartsProps = {
  statusDistribution: ChartSlice[];
  newHireTrend: TrendPoint[];
  endDateTrend: TrendPoint[];
};

export function ProbationDashboardCharts({
  statusDistribution,
  newHireTrend,
  endDateTrend,
}: ProbationDashboardChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1fr_1fr]">
      <StatusCard data={statusDistribution} />
      <TrendCard title="Monthly New Hire Trend" subtitle="New hires over the last 6 months" data={newHireTrend} fill="#2563eb" name="New Hires" />
      <TrendCard title="Probation End Date Trend" subtitle="Probation end dates over the last 6 months" data={endDateTrend} fill="#84cc16" name="End Dates" />
    </section>
  );
}

function StatusCard({ data }: { data: ChartSlice[] }) {
  const hasData = data.some((item) => item.value > 0);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold">Probation Status</h3>
      <p className="mb-4 text-xs text-muted-foreground">Distribution across probation employees</p>
      <div className="h-[260px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={86} paddingAngle={2}>
                {data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-xs text-muted-foreground">No data</div>
        )}
      </div>
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  data,
  fill,
  name,
}: {
  title: string;
  subtitle: string;
  data: TrendPoint[];
  fill: string;
  name: string;
}) {
  const hasData = data.some((item) => item.count > 0);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      <div className="h-[260px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="count" name={name} fill={fill} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-xs text-muted-foreground">No data</div>
        )}
      </div>
    </div>
  );
}
