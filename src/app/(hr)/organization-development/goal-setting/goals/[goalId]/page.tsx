import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GoalStatusBadge } from "@/components/admin/goal-setting/goal-status-badge";
import { SmartIndicators } from "@/components/admin/goal-setting/smart-indicators";
import { evaluateSmart, getGoalById } from "@/lib/services/goal-setting/goal-setting.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Goal Detail - Berau Coal HR" };

export default async function GoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  const goal = await getGoalById(goalId);
  if (!goal) notFound();
  const smart = evaluateSmart(goal);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="bg-white"><Link href={`/organization-development/goal-setting/employees/${goal.employeeId}`}><ArrowLeft className="h-4 w-4" /> Back to Employee Goals</Link></Button>
      <ModuleHero eyebrow="Goal Detail" title={goal.title} description={`${goal.employeeName} | ${goal.goalCycle} | Source: ${goal.source}`} icon={Target} />

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{goal.category}</p>
              <h2 className="mt-2 text-2xl font-bold">{goal.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{goal.description}</p>
            </div>
            <GoalStatusBadge status={goal.status} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Info label="Target" value={`${goal.targetValue}${goal.unit}`} />
            <Info label="Actual" value={`${goal.actualValue}${goal.unit}`} />
            <Info label="Weight" value={`${goal.weight}%`} />
            <Info label="Priority" value={goal.priority} />
            <Info label="Start Date" value={formatDate(goal.startDate)} />
            <Info label="Due Date" value={formatDate(goal.dueDate)} />
            <Info label="Organization Objective" value={goal.organizationObjective ?? "-"} />
            <Info label="Department Objective" value={goal.departmentObjective ?? "-"} />
            <Info label="Last Updated" value={formatDate(goal.sourceUpdatedAt)} />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm"><span>Achievement Percentage</span><span className="font-bold">{goal.achievement}%</span></div>
            <Progress value={Math.min(100, goal.achievement)} />
          </div>
        </div>
        <SmartIndicators smart={smart} />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Goal Progress History</h2>
        <div className="mt-5 border-l border-slate-200 pl-5">
          {goal.history.map((item) => (
            <div key={item.id} className="relative mb-5">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
              <p className="font-semibold">{formatDate(item.progressDate)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Progress updated from {item.previousAchievement}% to {item.updatedAchievement}%</p>
              <p className="text-sm text-muted-foreground">Actual value: {item.updatedActualValue}</p>
              <p className="text-xs text-muted-foreground">{item.progressDescription} | Updated by {item.updatedBy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
