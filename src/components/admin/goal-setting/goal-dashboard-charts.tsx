"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type DirectorateStatusDatum = {
  directorate: string;
  statuses: Array<{ name: string; value: number; fill: string }>;
};

export function GoalDashboardCharts({ directorateReviewStatus }: { directorateReviewStatus: DirectorateStatusDatum[] }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold">Goal Setting Review Status by Directorate</h3>
          <p className="text-xs text-muted-foreground">Distribution of Reviewed, In Progress, and Complete PAT records per directorate</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
          <LegendDot color="#0ea5e9" label="Reviewed" />
          <LegendDot color="#f59e0b" label="In Progress" />
          <LegendDot color="#15803d" label="Complete" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {directorateReviewStatus.map((item) => <DirectoratePie key={item.directorate} item={item} />)}
      </div>
    </section>
  );
}

function DirectoratePie({ item }: { item: DirectorateStatusDatum }) {
  const total = item.statuses.reduce((sum, status) => sum + status.value, 0);
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{item.directorate}</h4>
          <p className="text-xs text-muted-foreground">{total} employees</p>
        </div>
      </div>
      <div className="mt-3 h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={item.statuses} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2}>
              {item.statuses.map((status) => <Cell key={status.name} fill={status.fill} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid gap-2 text-xs">
        {item.statuses.map((status) => (
          <div key={status.name} className="flex items-center justify-between gap-2">
            <LegendDot color={status.fill} label={status.name} />
            <span className="font-bold">{status.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 };
