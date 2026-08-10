import { BookOpenCheck, Building, FileText, Network, Target } from "lucide-react";
import { DataSourceStrip, ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { DATA_SOURCES } from "@/lib/services/hr-modules.service";
import { getOrganizationDevelopmentSummary } from "@/lib/services/organization-development.service";
import { getGoalSettingDashboard } from "@/lib/services/goal-setting/goal-setting.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Organization Development - Berau Coal HR" };

export default async function OrganizationDevelopmentPage() {
  const [summary, goalDashboard] = await Promise.all([
    getOrganizationDevelopmentSummary(),
    getGoalSettingDashboard(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Job architecture, struktur, dan competency requirement"
        description="OD menjadi sumber definisi posisi, job description, dan prioritas competency position yang nantinya dipakai Talent GAP, Mobility, dan Learning/IDP."
        icon={Network}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Organization Units" value={summary.totalOrganizationUnits} />
        <SummaryCard label="Positions" value={summary.totalPositions} />
        <SummaryCard label="Technical Competencies" value={summary.totalTechnicalCompetencies} />
        <SummaryCard label="Positions with Job Description" value={summary.positionsWithCompleteJobDescription} />
        <SummaryCard label="Positions with Competency Mapping" value={summary.positionsWithCompetencyMapping} />
        <SummaryCard label="Positions with Incomplete Data" value={summary.positionsWithIncompleteData} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Completeness label="Job Description Completeness" value={summary.jobDescriptionCompleteness} />
        <Completeness label="Competency Mapping Completeness" value={summary.competencyMappingCompleteness} />
        <Completeness label="Organization Mapping Completeness" value={summary.organizationMappingCompleteness} />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleMenuCard title="Struktur Organisasi" href="/organization-development/organization-structure" icon={Building} description="Hierarchy operation, division, unit, position, holder, dan vacant status." meta={`${summary.totalPositions} positions`} />
        <ModuleMenuCard title="Competencies" href="/organization-development/skills" icon={BookOpenCheck} description="Competency priority per position dari Position Qualification." meta={`${summary.positionsWithCompetencyMapping} mapped`} />
        <ModuleMenuCard title="Job Descriptions" href="/organization-development/job-descriptions" icon={FileText} description="Responsibilities yang berasal dari source Excel." meta={`${summary.positionsWithCompleteJobDescription} JDs`} />
        <ModuleMenuCard title="Goal Setting" href="/organization-development/goal-setting" icon={Target} description="Monitoring SMART goals employee dari Entomo: achievement, status, histori, dan sync." meta={`${goalDashboard.summary.totalGoals} goals`} />
      </section>
      <DataSourceStrip sources={DATA_SOURCES} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value.toLocaleString("id-ID")}</p>
      </CardContent>
    </Card>
  );
}

function Completeness({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{value}%</span>
        </div>
        <Progress value={value} className="mt-3" />
      </CardContent>
    </Card>
  );
}
