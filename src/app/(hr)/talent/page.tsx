import { ChartNoAxesCombined, GitCompareArrows, GraduationCap, Milestone, RotateCcw, ShieldCheck, UsersRound } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listDevelopmentProgramEmployees, listPromotionEmployees, listSkillGapEmployees } from "@/lib/services/hr-modules.service";
import { listTalentMonitoringEmployees } from "@/lib/services/talent-monitoring.service";

export const metadata = { title: "Talent - Harmoni" };

export default async function TalentPage() {
  const [promotion, dp, gaps, talentMonitoring] = await Promise.all([
    listPromotionEmployees(),
    listDevelopmentProgramEmployees(),
    listSkillGapEmployees(),
    listTalentMonitoringEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Talent workspace untuk karyawan post-probation"
        description="Kelola talent monitoring retention, promosi, development program, mobility, skill needs, serta akses Talent Dictionary dan Talent Card."
        icon={UsersRound}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleMenuCard title="Talent Monitoring" href="/talent/talent-monitoring" icon={ShieldCheck} description="Monitoring khusus daftar retensi talenta kunci Tier 1 dan Tier 2." meta={`${talentMonitoring.length} retention talents`} />
        <ModuleMenuCard title="Promotion" href="/talent/promotion" icon={ChartNoAxesCombined} description="Lihat posisi saat ini, last promotion, successor, dan masa di posisi." meta={`${promotion.length} employees`} />
        <ModuleMenuCard title="Development Program" href="/talent/development-program" icon={GraduationCap} description="Pantau karyawan yang mengikuti program pengembangan." meta={`${dp.length} programs`} />
        <ModuleMenuCard title="Mobility" href="/talent/rotation" icon={RotateCcw} description="Cari kandidat mobility berdasarkan skill dan job desc." meta="Matching" />
        <ModuleMenuCard title="Career Path" href="/talent/career-path" icon={Milestone} description="Pilih karyawan, lalu lihat opsi posisi lanjutan yang paling dekat." meta="Person first" />
        <ModuleMenuCard title="Current Gap / Skill Needs" href="/talent/gap" icon={GitCompareArrows} description="Skill needs karyawan terhadap posisi saat ini dengan action plan 70-20-10." meta={`${gaps.filter((gap) => gap.skillGap.length > 0).length} needs`} />
      </section>
    </div>
  );
}
