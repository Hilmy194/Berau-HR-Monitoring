import { BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listLearningRecommendations } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LearningMonitoringEditor, type EditableLearningActivity } from "@/components/admin/learning-monitoring-editor";
import { learningStatusLabel } from "@/lib/learning-monitoring-status";
import { listLearningMonitoring, type LearningActivityType, type LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";
import { requireWorkspaceAccess } from "@/lib/session";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import { listLatestSkillGapIdpDefaults, type SkillGapIdpDefault } from "@/lib/services/talent-ai.service";

export const metadata = { title: "Learning IDP - Harmoni" };

export default async function LearningIdpPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [filters, session] = await Promise.all([searchParams, requireWorkspaceAccess(WORKSPACE.LEARNING)]);
  const [rows, options] = await Promise.all([listLearningRecommendations(filters), getEmployeeFilterOptions()]);
  const [savedMonitoring, canEdit, aiDefaults] = await Promise.all([
    listLearningMonitoring(rows.map((row) => row.profileId)),
    canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.LEARNING, "EDITOR"),
    listLatestSkillGapIdpDefaults(rows.map((row) => row.profileId)),
  ]);
  const monitoringByEmployeeAndKey = new Map(savedMonitoring.map((item) => [`${item.employeePersonnelNumber}:${item.activityKey}`, item]));
  const employeeSections = rows.map((row) => {
    const ai = aiDefaults.get(row.profileId);
    const defaultActivities = buildIdpActivities(row, ai);
    const defaultKeys = new Set(defaultActivities.map((activity) => activity.activityKey));
    const activities = defaultActivities.map((activity) => {
      const saved = monitoringByEmployeeAndKey.get(`${row.profileId}:${activity.activityKey}`);
      return saved ? savedActivity(activity, saved) : activity;
    });
    const customActivities = savedMonitoring
      .filter((saved) => saved.employeePersonnelNumber === row.profileId && !defaultKeys.has(saved.activityKey))
      .map((saved) => savedActivityFromScratch(row.employeeName, saved));
    const aiGaps = ai?.prioritySkillGaps.map((gap) => gap.skillName).filter(Boolean) ?? [];
    return {
      id: row.profileId,
      profileId: row.profileId,
      employeeName: row.employeeName,
      currentPosition: row.currentPosition,
      targetPosition: ai?.targetPosition || row.targetPosition,
      department: row.department,
      division: row.division,
      directorate: row.directorate,
      gap: aiGaps.length ? aiGaps.join(", ") : row.promotionGap !== "Ready for promotion validation" ? row.promotionGap : row.currentPositionGap,
      priority: aiPriority(ai) ?? row.priority,
      hasAiDefault: Boolean(ai),
      activities: [...activities, ...customActivities],
    };
  });

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
                <div className="flex items-start gap-2 lg:justify-end">
                  <Badge>{section.priority}</Badge>
                  {section.hasAiDefault && <Badge variant="secondary">Default AI Current Gap</Badge>}
                  {canEdit && <LearningMonitoringEditor activity={newManualActivity(section)} mode="create" />}
                </div>
              </div>
              <TableShell>
                <table className="w-full text-sm">
                  <thead className="bg-white text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="p-4">Learning Type</th><th className="p-4">Skill Improvement</th><th className="p-4">Program / Training / Project Name</th><th className="p-4">Provider</th><th className="p-4">Timeline</th><th className="p-4">Status</th><th className="p-4">Success Criteria</th><th className="p-4">Monitoring Notes</th>{canEdit && <th className="p-4 text-right">Action</th>}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {section.activities.map((activity) => (
                      <tr key={`${activity.employeePersonnelNumber}-${activity.activityKey}`} className="align-top">
                        <td className="p-4"><LearningTypeBadge type={activity.learningType} /></td>
                        <td className="p-4 min-w-52">{activity.skillImprovement}</td>
                        <td className="p-4 min-w-72 text-muted-foreground">{activity.programName}</td>
                        <td className="p-4 min-w-52">{activity.provider}</td>
                        <td className="p-4"><Badge variant="outline">{activity.timeline}</Badge></td>
                        <td className="p-4"><StatusBadge status={activity.status} /></td>
                        <td className="p-4 min-w-72 text-muted-foreground">{activity.successCriteria}</td>
                        <td className="p-4 min-w-64 text-muted-foreground">{activity.notes || "-"}</td>
                        {canEdit && <td className="p-4 text-right"><LearningMonitoringEditor activity={activity} /></td>}
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

function StatusBadge({ status }: { status: LearningMonitoringStatus }) {
  return <Badge variant={status === "COMPLETED" ? "default" : status === "NOT_STARTED" ? "outline" : "secondary"}>{learningStatusLabel(status)}</Badge>;
}

function LearningTypeBadge({ type }: { type: string }) {
  const variant = type.startsWith("70%") ? "default" : type.startsWith("20%") ? "secondary" : "outline";
  return <Badge variant={variant}>{type}</Badge>;
}

function buildIdpActivities(
  row: Awaited<ReturnType<typeof listLearningRecommendations>>[number],
  ai?: SkillGapIdpDefault,
): EditableLearningActivity[] {
  const gap = row.promotionGap !== "Ready for promotion validation" ? row.promotionGap : row.currentPositionGap;
  const aiGap = ai?.prioritySkillGaps[0]?.skillName;
  const skillImprovement = aiGap || getPrimarySkillImprovement(gap, row.recommendationName);
  const formalSkill = aiGap || getFormalSkillImprovement(gap, row.certificationPlan);
  const providerBase = getProviderBase(row.department, row.directorate);
  const targetPosition = ai?.targetPosition || row.targetPosition;
  const experienceRecommendation = findAiRecommendation(ai, ["PROJECT_ASSIGNMENT"]);
  const socialRecommendation = findAiRecommendation(ai, ["COACHING", "MENTORING"]);
  const formalRecommendation = findAiRecommendation(ai, ["TRAINING", "CERTIFICATION"]);

  return [
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "EXPERIENCE_70",
      activityType: "EXPERIENCE_70" as LearningActivityType,
      targetPosition,
      learningType: "70% Experience Learning",
      skillImprovement: experienceRecommendation?.relatedSkill || skillImprovement,
      programName: aiPlanText(ai?.idpPlan.seventy, experienceRecommendation, stripLearningPrefix(row.projectOjtPlan)),
      provider: `Internal - ${providerBase}`,
      timeline: experienceRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.projectStatus),
      successCriteria: experienceRecommendation?.expectedEvidence || row.successMetric,
      notes: "",
      version: 0,
    },
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "SOCIAL_20",
      activityType: "SOCIAL_20" as LearningActivityType,
      targetPosition,
      learningType: "20% Social Learning",
      skillImprovement: socialRecommendation?.relatedSkill || (/leadership|stakeholder|influence/i.test(gap) ? "Leadership Development" : skillImprovement),
      programName: aiPlanText(ai?.idpPlan.twenty, socialRecommendation, stripLearningPrefix(row.coachingPlan)),
      provider: "Internal Berau Coal",
      timeline: socialRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.coachingStatus),
      successCriteria: socialRecommendation?.expectedEvidence || `Mentee shows measurable improvement on ${skillImprovement.toLowerCase()} during coaching review.`,
      notes: "",
      version: 0,
    },
    {
      employeePersonnelNumber: row.profileId,
      employeeName: row.employeeName,
      activityKey: "FORMAL_10",
      activityType: "FORMAL_10" as LearningActivityType,
      targetPosition,
      learningType: "10% Formal Learning",
      skillImprovement: formalRecommendation?.relatedSkill || formalSkill,
      programName: aiPlanText(ai?.idpPlan.ten, formalRecommendation, stripLearningPrefix(row.certificationPlan)),
      provider: getFormalProvider(formalSkill),
      timeline: formalRecommendation?.suggestedDuration || row.timeline,
      status: normalizeLearningStatus(row.certificationStatus),
      successCriteria: formalRecommendation?.expectedEvidence || row.successMetric,
      notes: "",
      version: 0,
    },
  ];
}

function findAiRecommendation(ai: SkillGapIdpDefault | undefined, types: SkillGapIdpDefault["developmentRecommendations"][number]["type"][]) {
  return ai?.developmentRecommendations.find((item) => types.includes(item.type));
}

function aiPlanText(
  plan: string[] | undefined,
  recommendation: SkillGapIdpDefault["developmentRecommendations"][number] | undefined,
  fallback: string,
) {
  if (plan?.length) return plan.join("\n");
  if (recommendation) return `${recommendation.title}: ${recommendation.description}`;
  return fallback;
}

type SavedMonitoring = Awaited<ReturnType<typeof listLearningMonitoring>>[number];

function savedActivity(activity: EditableLearningActivity, saved: SavedMonitoring): EditableLearningActivity {
  return {
    ...activity,
    activityKey: saved.activityKey,
    activityType: saved.activityType as LearningActivityType,
    targetPosition: saved.targetPosition ?? activity.targetPosition,
    skillImprovement: saved.skillImprovement,
    programName: saved.programName,
    provider: saved.provider,
    timeline: saved.timeline,
    status: saved.status as LearningMonitoringStatus,
    successCriteria: saved.successCriteria,
    notes: saved.notes ?? "",
    version: saved.version,
  };
}

function savedActivityFromScratch(employeeName: string, saved: SavedMonitoring): EditableLearningActivity {
  const activityType = saved.activityType as LearningActivityType;
  return {
    employeePersonnelNumber: saved.employeePersonnelNumber,
    employeeName,
    activityKey: saved.activityKey,
    activityType,
    learningType: learningTypeLabel(activityType),
    targetPosition: saved.targetPosition ?? "-",
    skillImprovement: saved.skillImprovement,
    programName: saved.programName,
    provider: saved.provider,
    timeline: saved.timeline,
    status: saved.status as LearningMonitoringStatus,
    successCriteria: saved.successCriteria,
    notes: saved.notes ?? "",
    version: saved.version,
  };
}

function newManualActivity(section: { profileId: string; employeeName: string; targetPosition: string; gap: string }): EditableLearningActivity {
  return {
    employeePersonnelNumber: section.profileId,
    employeeName: section.employeeName,
    activityKey: "",
    activityType: "EXPERIENCE_70",
    learningType: learningTypeLabel("EXPERIENCE_70"),
    targetPosition: section.targetPosition,
    skillImprovement: section.gap.split(",")[0]?.trim() || "Development need",
    programName: "",
    provider: "Internal Berau Coal",
    timeline: "90 hari",
    status: "NOT_STARTED",
    successCriteria: "",
    notes: "",
    version: 0,
  };
}

function learningTypeLabel(type: LearningActivityType) {
  if (type === "EXPERIENCE_70") return "70% Experience Learning";
  if (type === "SOCIAL_20") return "20% Social Learning";
  return "10% Formal Learning";
}

function aiPriority(ai?: SkillGapIdpDefault) {
  if (!ai?.developmentRecommendations.length) return null;
  if (ai.developmentRecommendations.some((item) => item.priority === "HIGH")) return "High";
  if (ai.developmentRecommendations.some((item) => item.priority === "MEDIUM")) return "Medium";
  return "Low";
}

function normalizeLearningStatus(value: string): LearningMonitoringStatus {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "IN_PROGRESS" || normalized === "COMPLETED" || normalized === "ON_HOLD" || normalized === "CANCELLED") return normalized;
  return "NOT_STARTED";
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
