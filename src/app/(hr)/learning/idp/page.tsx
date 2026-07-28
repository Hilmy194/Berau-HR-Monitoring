import { BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listLearningRecommendations } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Learning IDP - Berau Coal HR" };

export default async function LearningIdpPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listLearningRecommendations(filters), getEmployeeFilterOptions()]);
  const employeeSections = rows.map((row) => ({
    id: row.profileId,
    profileId: row.profileId,
    employeeName: row.employeeName,
    currentPosition: row.currentPosition,
    targetPosition: row.targetPosition,
    department: row.department,
    division: row.division,
    directorate: row.directorate,
    gap: row.promotionGap !== "Ready for promotion validation" ? row.promotionGap : row.currentPositionGap,
    priority: row.priority,
    activities: buildIdpActivities(row),
  }));

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Learning" title="IDP Progress Monitoring" description="Monitoring gap, skill improvement, program, provider, timeline, status, dan success criteria untuk aktivitas Experience, Social, dan Formal Learning." icon={BookOpenCheck} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedEmployee={filters.employee}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
      />
      <section className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-emerald-700">70%</p>
            <p className="mt-1 font-semibold">Project / OJT</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Stretch assignment, improvement project, dan exposure pekerjaan nyata.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-blue-700">20%</p>
            <p className="mt-1 font-semibold">Coaching / Mentoring</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Pendampingan atasan, mentor role tujuan, dan review progress berkala.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-violet-700">10%</p>
            <p className="mt-1 font-semibold">Certification / Formal</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Training, sertifikasi, atau kelas formal untuk menutup gap spesifik.</p>
          </CardContent>
        </Card>
      </section>
      <div className="space-y-4">
        {employeeSections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-4 border-b bg-slate-50/70 p-5 lg:grid-cols-[1.1fr_1fr_1.5fr_auto]">
                <div>
                  <Link href={`/admin/employee-management/${section.profileId}`} className="text-base font-bold hover:text-emerald-700 hover:underline">
                    {section.employeeName}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{section.department} / {section.division}</p>
                </div>
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</p>
                  <p className="mt-1">{section.currentPosition} <span className="text-muted-foreground">to</span> {section.targetPosition}</p>
                </div>
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap</p>
                  <p className="mt-1 text-muted-foreground">{section.gap}</p>
                </div>
                <div className="flex items-start lg:justify-end">
                  <Badge>{section.priority}</Badge>
                </div>
              </div>
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-white text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="p-4">Learning Type</th><th className="p-4">Skill Improvement</th><th className="p-4">Program / Training / Project Name</th><th className="p-4">Provider</th><th className="p-4">Timeline</th><th className="p-4">Status</th><th className="p-4">Success Criteria</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {section.activities.map((activity) => (
                      <tr key={activity.id} className="align-top">
                        <td className="p-4"><LearningTypeBadge type={activity.learningType} /></td>
                        <td className="p-4 min-w-52">{activity.skillImprovement}</td>
                        <td className="p-4 min-w-72 text-muted-foreground">{activity.programName}</td>
                        <td className="p-4 min-w-52">{activity.provider}</td>
                        <td className="p-4"><Badge variant="outline">{activity.timeline}</Badge></td>
                        <td className="p-4"><StatusBadge status={activity.status} /></td>
                        <td className="p-4 min-w-72 text-muted-foreground">{activity.successCriteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "Completed" ? "default" : status === "Not Started" ? "outline" : "secondary"}>{status}</Badge>;
}

function LearningTypeBadge({ type }: { type: string }) {
  const variant = type.startsWith("70%") ? "default" : type.startsWith("20%") ? "secondary" : "outline";
  return <Badge variant={variant}>{type}</Badge>;
}

function buildIdpActivities(row: Awaited<ReturnType<typeof listLearningRecommendations>>[number]) {
  const gap = row.promotionGap !== "Ready for promotion validation" ? row.promotionGap : row.currentPositionGap;
  const skillImprovement = getPrimarySkillImprovement(gap, row.recommendationName);
  const formalSkill = getFormalSkillImprovement(gap, row.certificationPlan);
  const providerBase = getProviderBase(row.department, row.directorate);

  return [
    {
      id: `${row.profileId}-70`,
      profileId: row.profileId,
      employeeName: row.employeeName,
      currentPosition: row.currentPosition,
      targetPosition: row.targetPosition,
      gap,
      learningType: "70% Experience Learning",
      skillImprovement,
      programName: stripLearningPrefix(row.projectOjtPlan),
      provider: `Internal - ${providerBase}`,
      timeline: row.timeline,
      status: row.projectStatus,
      successCriteria: row.successMetric,
    },
    {
      id: `${row.profileId}-20`,
      profileId: row.profileId,
      employeeName: row.employeeName,
      currentPosition: row.currentPosition,
      targetPosition: row.targetPosition,
      gap,
      learningType: "20% Social Learning",
      skillImprovement: /leadership|stakeholder|influence/i.test(gap) ? "Leadership Development" : skillImprovement,
      programName: stripLearningPrefix(row.coachingPlan),
      provider: "Internal Berau Coal",
      timeline: row.timeline,
      status: row.coachingStatus,
      successCriteria: `Mentee shows measurable improvement on ${skillImprovement.toLowerCase()} during coaching review.`,
    },
    {
      id: `${row.profileId}-10`,
      profileId: row.profileId,
      employeeName: row.employeeName,
      currentPosition: row.currentPosition,
      targetPosition: row.targetPosition,
      gap,
      learningType: "10% Formal Learning",
      skillImprovement: formalSkill,
      programName: stripLearningPrefix(row.certificationPlan),
      provider: getFormalProvider(formalSkill),
      timeline: row.timeline,
      status: row.certificationStatus,
      successCriteria: row.successMetric,
    },
  ];
}

function stripLearningPrefix(value: string) {
  return value.replace(/^(70% Project\/OJT|20% Coaching\/Mentoring|10% Certification\/Formal):\s*/i, "");
}

function getPrimarySkillImprovement(gap: string, fallback: string) {
  const firstGap = gap.split(",")[0]?.trim();
  if (firstGap && !/no critical gap|ready for promotion/i.test(firstGap)) return firstGap;
  return fallback.replace(/^(Coaching|Mentoring|Training|Certification|Project Assignment):\s*/i, "");
}

function getFormalSkillImprovement(gap: string, plan: string) {
  if (/safety|hse|risk|k3|smkp/i.test(`${gap} ${plan}`)) return "Occupational Health and Safety Management";
  if (/cost|budget|financial|finance/i.test(`${gap} ${plan}`)) return "Financial and Cost Control";
  if (/data|analysis|analytics|dashboard/i.test(`${gap} ${plan}`)) return "Data Analytics";
  if (/leadership|stakeholder|influence/i.test(`${gap} ${plan}`)) return "Leadership Development";
  if (/operation|operational|mine|pit|production|planning/i.test(`${gap} ${plan}`)) return "Operational Excellence";
  return getPrimarySkillImprovement(gap, plan);
}

function getFormalProvider(skillImprovement: string) {
  if (/safety|health|k3|leadership|operational/i.test(skillImprovement)) return "PPM Manajemen";
  if (/data|analytics/i.test(skillImprovement)) return "Internal Data Academy";
  return "Internal Berau Coal";
}

function getProviderBase(department: string, directorate: string) {
  if (/mining|mine|geology|survey/i.test(department)) return "Mine Operation Division";
  if (/plant|cpp|hauling/i.test(department)) return "Operations Division";
  return `${directorate} Directorate`;
}
