import { CheckCircle2, CircleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { SmartEvaluation } from "@/lib/services/goal-setting/goal-setting.types";

const ITEMS = [
  ["specific", "Specific"],
  ["measurable", "Measurable"],
  ["achievable", "Achievable"],
  ["relevant", "Relevant"],
  ["timeBound", "Time-bound"],
] as const;

export function SmartIndicators({ smart }: { smart: SmartEvaluation }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">SMART Compliance</span>
        <span className="font-bold">{smart.percentage}%</span>
      </div>
      <Progress value={smart.percentage} className="mt-2" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ITEMS.map(([key, label]) => {
          const complete = smart[key];
          return (
            <div key={key} className="flex items-center gap-2 text-xs" title={`${label}: ${complete ? "Complete" : "Incomplete"}`}>
              {complete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <CircleAlert className="h-3.5 w-3.5 text-amber-700" />}
              <span className={complete ? "text-slate-700" : "font-semibold text-amber-800"}>{label}</span>
            </div>
          );
        })}
      </div>
      {smart.missing.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Missing: {smart.missing.join(", ")}</p>}
    </div>
  );
}
