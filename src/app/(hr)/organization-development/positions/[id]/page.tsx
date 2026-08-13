import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, CircleAlert } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetencyDetailPanel } from "@/components/admin/competency-detail-panel";
import { getCompetencyById, getPositionById, type PositionRequirementItem } from "@/lib/services/organization-development.service";

export const metadata = { title: "Position Detail - Harmoni" };

export default async function PositionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const position = await getPositionById(id);
  if (!position) notFound();

  const competencies = (await Promise.all(position.requirements.map((requirement) => getCompetencyById(requirement.competencyId))))
    .filter((competency): competency is NonNullable<typeof competency> => Boolean(competency));
  const competencyById = new Map(competencies.map((competency) => [competency.id, competency]));
  const organizationPath = [position.directorate.name, position.division.name, position.department.name].join(" / ");

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/organization-development/positions"><ArrowLeft className="h-4 w-4" /> Back to directory</Link>
      </Button>
      <ModuleHero eyebrow="Position Detail" title={position.positionName} description={organizationPath} icon={BriefcaseBusiness} />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{position.positionCode}</Badge>
        <Badge variant="secondary">{position.positionGroup}</Badge>
        <Badge variant={position.isActive ? "success" : "neutral"}>{position.isActive ? "Active" : "Inactive"}</Badge>
        <Badge variant={position.hasJobDescription && position.competencyCount > 0 ? "success" : "warning"}>{position.hasJobDescription && position.competencyCount > 0 ? "Complete" : "Incomplete"}</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="job">Job Description</TabsTrigger>
          <TabsTrigger value="skills">Competency Priority</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Organization Information</CardTitle></CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <Info label="Directorate" value={position.directorate.name} />
                <Info label="Division" value={position.division.name} />
                <Info label="Department / Unit" value={position.department.name} />
                <Info label="Functional Area" value={position.functionalArea ?? "Unmapped"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Data Completeness</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <CompletenessItem complete={position.hasJobDescription} label="Job description mapped" />
                <CompletenessItem complete={position.competencyCount > 0} label="Competency requirement mapped" />
                <CompletenessItem complete={position.hasOrganizationMapping} label="Organization unit mapped" />
                <Info label="Source File" value={position.sourceFile ?? "Not available"} />
                <Info label="Source Sheet" value={position.sourceSheet ?? "Not available"} />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent value="job">
          <Card>
            <CardHeader><CardTitle className="text-base">Responsibilities</CardTitle></CardHeader>
            <CardContent>
              {position.jobDescription ? (
                <div className="space-y-2 text-sm leading-6">
                  {splitJobDescription(position.jobDescription).map((item) => <p key={item}>{item}</p>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Job description has not been mapped for this position.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="skills">
          <div className="space-y-4">
            <section className="grid gap-3 lg:grid-cols-5">
              {[5, 4, 3, 2, 1].map((level) => (
                <PriorityColumn key={level} level={level} requirements={position.requirements.filter((requirement) => requirement.priorityLevel === level)} />
              ))}
            </section>
            <TableShell>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="p-4">Competency</th><th className="p-4">Category</th><th className="p-4">Definition</th><th className="p-4">Priority</th><th className="p-4">Dictionary Reference</th></tr>
                </thead>
                <tbody className="divide-y">
                  {position.requirements.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No competency requirements mapped.</td></tr>
                  ) : position.requirements.map((requirement) => (
                    <tr key={requirement.id} className="align-top">
                      <td className="p-4 font-medium">{requirement.competencyName}</td>
                      <td className="p-4">{requirement.competencyCategory}</td>
                      <td className="max-w-md p-4 text-muted-foreground">{requirement.competencyDefinition ?? "Not available"}</td>
                      <td className="p-4"><Badge>Priority {requirement.priorityLevel}</Badge><p className="mt-1 text-xs text-muted-foreground">{requirement.priorityLabel}</p></td>
                      <td className="max-w-md p-4 text-muted-foreground">{requirement.levelDescription ?? "Not available"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
            <div className="space-y-3">
              {position.requirements.map((requirement) => {
                const competency = competencyById.get(requirement.competencyId);
                return competency ? <CompetencyDetailPanel key={requirement.id} competency={competency} priorityLevel={requirement.priorityLevel} /> : null;
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PriorityColumn({ level, requirements }: { level: number; requirements: PositionRequirementItem[] }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">Scale {level}</p>
          <p className="text-xs text-muted-foreground">{priorityLabel(level)}</p>
        </div>
        <Badge variant={level >= 5 ? "success" : "outline"}>{requirements.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {requirements.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not mapped</p>
        ) : requirements.map((requirement) => (
          <div key={requirement.id} className="rounded-lg border bg-slate-50 p-2">
            <p className="text-xs font-semibold leading-5">{requirement.competencyName}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{requirement.competencyCategory}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function priorityLabel(level: number) {
  if (level >= 5) return "Critical Priority";
  if (level === 4) return "High Priority";
  if (level === 3) return "Important Priority";
  if (level === 2) return "Supporting Priority";
  return "Awareness Priority";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function CompletenessItem({ complete, label }: { complete: boolean; label: string }) {
  const Icon = complete ? CheckCircle2 : CircleAlert;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${complete ? "text-emerald-700" : "text-amber-600"}`} />
      <span>{label}</span>
    </div>
  );
}

function splitJobDescription(value: string) {
  const parts = value.split(/(?:\r?\n)+|(?=\b\d+\.\s+)/).map((item) => item.trim()).filter(Boolean);
  return parts.length ? parts : [value];
}
