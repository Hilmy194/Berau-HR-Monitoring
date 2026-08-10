import { Badge } from "@/components/ui/badge";
import type { CompetencyDetail } from "@/lib/services/organization-development.service";

export function CompetencyDetailPanel({
  competency,
  priorityLevel,
}: {
  competency: CompetencyDetail;
  priorityLevel: number;
}) {
  return (
    <details className="rounded-lg border bg-slate-50 p-3">
      <summary className="cursor-pointer list-none font-semibold">
        <span className="flex flex-wrap items-center gap-2">
          {competency.competencyName}
          <Badge variant="outline">{competency.competencyCategory}</Badge>
          <Badge>Priority {priorityLevel}</Badge>
        </span>
      </summary>
      <div className="mt-3 space-y-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Definition</p>
          <p className="mt-1 leading-6">{competency.competencyDefinition ?? "Not available"}</p>
        </div>
        <div className="space-y-3">
          {competency.levels.map((level) => (
            <div key={level.level} className={`rounded-lg border p-3 ${level.level === priorityLevel ? "border-primary bg-emerald-50" : "bg-white"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{level.levelName}</p>
                {level.level === priorityLevel && <Badge>Priority Reference</Badge>}
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">{level.description}</p>
              {level.behaviorIndicators.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
                  {level.behaviorIndicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
