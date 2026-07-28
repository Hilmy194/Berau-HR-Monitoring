import { ChartNoAxesCombined, GitCompareArrows, GraduationCap, RotateCcw, UsersRound } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listDevelopmentProgramEmployees, listPromotionEmployees, listSkillGapEmployees } from "@/lib/services/hr-modules.service";

export const metadata = { title: "Talent - Berau Coal HR" };

export default async function TalentPage() {
  const [promotion, dp, gaps] = await Promise.all([
    listPromotionEmployees(),
    listDevelopmentProgramEmployees(),
    listSkillGapEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Talent workspace untuk karyawan post-probation"
        description="Kelola promosi, development program, mobility, skill needs, serta akses Talent Directory dan Talent Card."
        icon={UsersRound}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleMenuCard title="Promotion" href="/talent/promotion" icon={ChartNoAxesCombined} description="Lihat posisi saat ini, last promotion, successor, dan masa di posisi." meta={`${promotion.length} employees`} />
        <ModuleMenuCard title="Development Program" href="/talent/development-program" icon={GraduationCap} description="Pantau karyawan yang mengikuti program pengembangan." meta={`${dp.length} programs`} />
        <ModuleMenuCard title="Mobility" href="/talent/rotation" icon={RotateCcw} description="Cari kandidat mobility berdasarkan skill dan job desc." meta="Matching" />
        <ModuleMenuCard title="Current Gap / Skill Needs" href="/talent/gap" icon={GitCompareArrows} description="Skill needs karyawan terhadap posisi saat ini dengan action plan 70-20-10." meta={`${gaps.filter((gap) => gap.skillGap.length > 0).length} needs`} />
      </section>
    </div>
  );
}
