import { BookOpenCheck, ClipboardList, GraduationCap } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listCoachingGovernance } from "@/lib/services/hr-modules.service";
import { listEmployeesWithGeneratedIdpAi } from "@/lib/services/talent-ai.service";
import { getSuccessionPipelineFromDb, listAllSuccessorsDirectory } from "@/lib/services/succession.service";

export const metadata = { title: "Learning - Harmoni" };

export default async function LearningPage() {
  const session = await requireAuth();
  const [aiEligibility, successionPipeline, coaching] = await Promise.all([
    listEmployeesWithGeneratedIdpAi(),
    getSuccessionPipelineFromDb(),
    listCoachingGovernance(),
  ]);
  const successionNames = new Set(
    listAllSuccessorsDirectory(successionPipeline).map((s) => s.name.toLowerCase())
  );
  const aiIdpCount = new Set([
    ...aiEligibility.skillGapIds,
    ...aiEligibility.careerPathIds,
    ...aiEligibility.successionIdpIds,
  ]).size;
  const totalEligibleHint = Math.max(aiIdpCount, successionNames.size);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Learning"
        title="The Learning & Growth Engine"
        description="Monitoring IDP berbasis AI (70-20-10), coaching governance, dan career evolution dalam satu workspace pengembangan karyawan."
        icon={GraduationCap}
      />
      <section className="grid gap-4 md:grid-cols-2">
        <ModuleMenuCard
          title="IDP Progress Monitoring"
          href="/learning/idp"
          icon={BookOpenCheck}
          description="Pantau status aktivitas 70-20-10 dari Succession, AI Current Gap, dan AI Career Path."
          meta={`${totalEligibleHint}+ IDP AI`}
          isLocked={!isRoutePermitted("/learning/idp", session.user.role, session.user.allowedRoutes)}
        />
        <ModuleMenuCard
          title="Coaching Governance"
          href="/learning/coaching-governance"
          icon={ClipboardList}
          description="Monitoring goals, action plan, schedule, mentor, progress, result, dan status."
          meta={`${coaching.length} sessions`}
          isLocked={!isRoutePermitted("/learning/coaching-governance", session.user.role, session.user.allowedRoutes)}
        />
      </section>
    </div>
  );
}
