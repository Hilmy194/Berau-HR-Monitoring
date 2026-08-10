import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, UserRound } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getGoalEmployeeDetail } from "@/lib/services/goal-setting/goal-setting.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Employee Goal Detail - Berau Coal HR" };

export default async function EmployeeGoalDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const detail = await getGoalEmployeeDetail(employeeId);
  if (!detail) notFound();
  const { employee, patAssessment, scorecardKpiSettings } = detail;
  if (!patAssessment) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="bg-white">
        <Link href="/organization-development/goal-setting"><ArrowLeft className="h-4 w-4" /> Back to Goal Setting</Link>
      </Button>

      <ModuleHero
        eyebrow="Goal Setting"
        title={employee.employeeName}
        description={`${employee.position} | ${employee.directorate} / ${employee.division} / ${employee.department}. Monitoring KPI setting, PAT tahunan, dan 360 feedback berasal dari Entomo.`}
        icon={UserRound}
      />

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
            <Info label="Employee ID" value={employee.employeeId} />
            <Info label="Manager" value={employee.managerName} />
            <Info label="Work Location" value={employee.workLocation} />
            <Info label="PAT Year" value={String(patAssessment.year)} />
            <Info label="PAT Name" value={patAssessment.patName} />
            <Info label="Last Sync from Entomo" value={formatDate(patAssessment.lastSyncedAt)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href={`/admin/employee-management/${employee.employeeProfileId}`}>Open Employee Card</Link></Button>
            <Button asChild variant="outline"><a href={employee.entomoUrl}><ExternalLink className="h-4 w-4" /> View in Entomo</a></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="PAT Final Score" value={patAssessment.finalScore} />
        <Metric label="Review Status" value={patAssessment.status} />
        <Metric label="360 Comments" value={patAssessment.feedback360.comments.length} />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scorecard KPI Setting</p>
            <h2 className="mt-2 text-xl font-bold">KPI Setting Template</h2>
            <p className="mt-1 text-sm text-muted-foreground">Template target KPI per orang sesuai file Scorecard KPI Setting.</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Strategy Pillar Name</th>
                <th className="p-3">Goal Name</th>
                <th className="p-3">Goal Description</th>
                <th className="p-3">Review Period</th>
                <th className="p-3">UOM</th>
                <th className="p-3 text-right">Wgt</th>
                <th className="p-3 text-center">L1</th>
                <th className="p-3 text-center">L2</th>
                <th className="p-3 text-center">L3</th>
                <th className="p-3 text-center">L4</th>
                <th className="p-3 text-center">L5</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {scorecardKpiSettings.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="p-3 font-semibold">{row.strategyPillarName}</td>
                  <td className="p-3">{row.goalName}</td>
                  <td className="p-3 text-muted-foreground">{row.goalDescription}</td>
                  <td className="p-3">{row.reviewPeriod}</td>
                  <td className="p-3">{row.uom}</td>
                  <td className="p-3 text-right font-semibold">{row.weight}%</td>
                  <KpiLevel value={row.levels.l1} />
                  <KpiLevel value={row.levels.l2} />
                  <KpiLevel value={row.levels.l3} />
                  <KpiLevel value={row.levels.l4} />
                  <KpiLevel value={row.levels.l5} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SIL / PAT Tahunan</p>
              <h2 className="mt-2 text-xl font-bold">{patAssessment.patName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{patAssessment.cycleName} | Source: {patAssessment.sourceSystem}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Final Score</p>
              <p className="text-2xl font-bold">{patAssessment.finalScore}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {patAssessment.dynamicSections.map((section) => (
              <div key={section.id} className="rounded-xl border bg-slate-50 p-4">
                <h3 className="font-semibold">{section.title}</h3>
                {section.description && <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.key} className="rounded-lg border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.strategyPillarName ?? field.label}</p>
                          <p className="mt-1 font-semibold">{field.value}{field.unit ?? ""}</p>
                          {field.strategyPillarName && <p className="mt-1 text-sm text-muted-foreground">{field.label}</p>}
                        </div>
                        {field.weight !== undefined && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{field.weight}%</span>}
                      </div>
                      {field.reviewPeriod && <p className="mt-2 text-xs text-muted-foreground">Review Period: {field.reviewPeriod}</p>}
                      {field.levels && (
                        <div className="mt-3 grid grid-cols-5 overflow-hidden rounded-md border text-center text-xs">
                          <Level label="L1" value={field.levels.l1} />
                          <Level label="L2" value={field.levels.l2} />
                          <Level label="L3" value={field.levels.l3} />
                          <Level label="L4" value={field.levels.l4} />
                          <Level label="L5" value={field.levels.l5} />
                        </div>
                      )}
                      {field.score !== undefined && (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs"><span>Score</span><span className="font-bold">{field.score}</span></div>
                          <Progress value={field.score} />
                        </div>
                      )}
                      {field.remark && <p className="mt-2 text-xs text-muted-foreground">{field.remark}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">360 Feedback</p>
          <h2 className="mt-2 text-lg font-bold">Strength, Weakness & Comment</h2>
          <FeedbackList title="Strength" items={patAssessment.feedback360.strengths} tone="success" />
          <FeedbackList title="Weakness" items={patAssessment.feedback360.weaknesses} tone="warning" />
          <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold">Comments</p>
            {patAssessment.feedback360.comments.map((item) => (
              <div key={`${item.reviewerGroup}-${item.submittedAt.toISOString()}`} className="rounded-lg border bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.reviewerGroup}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.submittedAt)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Level({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r last:border-r-0">
      <p className="bg-slate-50 py-1 font-semibold text-muted-foreground">{label}</p>
      <p className="py-1 font-semibold">{value}</p>
    </div>
  );
}

function KpiLevel({ value }: { value: string }) {
  return <td className="p-3 text-center font-semibold">{value}</td>;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  const className = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{item}</span>)}
      </div>
    </div>
  );
}
