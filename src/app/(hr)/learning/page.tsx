import { BookOpenCheck, ClipboardList, GraduationCap, Milestone } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listCoachingGovernance, listLearningAlignment, listLearningRecommendations } from "@/lib/services/hr-modules.service";

export const metadata = { title: "Learning - Berau Coal HR" };

export default async function LearningPage() {
  const [recommendations, coaching, alignment] = await Promise.all([
    listLearningRecommendations(),
    listCoachingGovernance(),
    listLearningAlignment(),
  ]);
  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Learning"
        title="The Learning & Growth Engine"
        description="Integrated IDP, coaching governance, learning alignment, dan career evolution dalam satu workspace pengembangan karyawan."
        icon={GraduationCap}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleMenuCard title="Integrated IDP" href="/learning/idp" icon={BookOpenCheck} description="Individual Development Plans otomatis dipicu oleh hasil gap analysis." meta={`${recommendations.length} IDP`} />
        <ModuleMenuCard title="Coaching Governance" href="/learning/coaching-governance" icon={ClipboardList} description="Track sessions, goals, dan follow-up discussion points dalam satu sistem." meta={`${coaching.length} sessions`} />
        <ModuleMenuCard title="Learning Alignment" href="/learning/alignment" icon={GraduationCap} description="Hubungkan training program langsung ke competency improvement metrics." meta={`${alignment.length} mapped`} />
        <ModuleMenuCard title="Career Evolution" href="/learning/career-evolution" icon={Milestone} description="Visual timeline Join Date, promotion milestones, dan future growth path." meta="Timeline" />
      </section>
    </div>
  );
}
