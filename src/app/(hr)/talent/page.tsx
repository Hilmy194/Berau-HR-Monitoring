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
        description="Kelola promosi, development program, rotasi, GAP skill, serta akses Talent Directory dan Talent Card."
        icon={UsersRound}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleMenuCard title="Promotion" href="/talent/promotion" icon={ChartNoAxesCombined} description="Lihat posisi saat ini, last promotion, successor, dan masa di posisi." meta={`${promotion.length} employees`} />
        <ModuleMenuCard title="Development Program" href="/talent/development-program" icon={GraduationCap} description="Pantau karyawan yang mengikuti program pengembangan." meta={`${dp.length} programs`} />
        <ModuleMenuCard title="Rotation" href="/talent/rotation" icon={RotateCcw} description="Cari kandidat pengganti posisi berdasarkan skill dan job desc." meta="Matching" />
        <ModuleMenuCard title="GAP" href="/talent/gap" icon={GitCompareArrows} description="Gap skill karyawan terhadap posisi saat ini." meta={`${gaps.filter((gap) => gap.skillGap.length > 0).length} gaps`} />
      </section>
    </div>
  );
}
