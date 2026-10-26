import { BookOpenCheck, Building, FileText, Network, Target } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { requireAuth } from "@/lib/session";
import { ROLE } from "@/lib/roles";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { getOrganizationDevelopmentSummary } from "@/lib/services/organization-development.service";
import { getGoalSettingDashboard } from "@/lib/services/goal-setting/goal-setting.service";

export const metadata = { title: "Organization Development - Harmoni" };

export default async function OrganizationDevelopmentPage() {
  const session = await requireAuth();
  const canSeeGoalSetting = session.user.role === ROLE.SUPER_ADMIN;
  const [summary, goalDashboard] = await Promise.all([
    getOrganizationDevelopmentSummary(),
    canSeeGoalSetting ? getGoalSettingDashboard() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Job architecture, struktur, dan competency requirement"
        description="OD menjadi sumber definisi posisi, job description, dan prioritas competency position yang nantinya dipakai Talent GAP, Mobility, dan Learning/IDP."
        icon={Network}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleMenuCard
          title="Struktur Organisasi"
          href="/organization-development/organization-structure"
          icon={Building}
          description="Hierarchy operation, division, unit, position, holder, dan vacant status."
          meta={`${summary.totalPositions} positions`}
          isLocked={!isRoutePermitted("/organization-development/organization-structure", session.user.role, session.user.allowedRoutes)}
        />
        <ModuleMenuCard
          title="Competencies"
          href="/organization-development/skills"
          icon={BookOpenCheck}
          description="Competency priority per position dari Position Qualification."
          meta={`${summary.positionsWithCompetencyMapping} mapped`}
          isLocked={!isRoutePermitted("/organization-development/skills", session.user.role, session.user.allowedRoutes)}
        />
        <ModuleMenuCard
          title="Job Descriptions"
          href="/organization-development/job-descriptions"
          icon={FileText}
          description="Responsibilities yang berasal dari source Excel."
          meta={`${summary.positionsWithCompleteJobDescription} JDs`}
          isLocked={!isRoutePermitted("/organization-development/job-descriptions", session.user.role, session.user.allowedRoutes)}
        />
        {goalDashboard && (
          <ModuleMenuCard
            title="Goal Setting"
            href="/organization-development/goal-setting"
            icon={Target}
            description="Monitoring SMART goals employee dari Entomo: achievement, status, histori, dan sync."
            meta={`${goalDashboard.summary.totalGoals} goals`}
            isLocked={!isRoutePermitted("/organization-development/goal-setting", session.user.role, session.user.allowedRoutes)}
          />
        )}
      </section>
    </div>
  );
}
