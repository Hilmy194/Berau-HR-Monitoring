import { BookOpenCheck, ClipboardList, GraduationCap } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listCoachingGovernance, listLearningRecommendations } from "@/lib/services/hr-modules.service";

export const metadata = { title: "Learning - Harmoni" };

export default async function LearningPage() {
  const [recommendations, coaching] = await Promise.all([
    listLearningRecommendations(),
    listCoachingGovernance(),
  ]);
  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Learning"
        title="The Learning & Growth Engine"
        description="Monitoring IDP, coaching governance, dan career evolution dalam satu workspace pengembangan karyawan."
        icon={GraduationCap}
      />
      <section className="grid gap-4 md:grid-cols-2">
        <ModuleMenuCard title="IDP Progress Monitoring" href="/learning/idp" icon={BookOpenCheck} description="Pantau status aktivitas 70-20-10: Not Started, On Progress, dan Completed." meta={`${recommendations.length} IDP`} />
        <ModuleMenuCard title="Coaching Governance" href="/learning/coaching-governance" icon={ClipboardList} description="Monitoring goals, action plan, schedule, mentor, progress, result, dan status." meta={`${coaching.length} sessions`} />
      </section>
    </div>
  );
}
