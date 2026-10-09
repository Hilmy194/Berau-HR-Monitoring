import { requireAdmin } from "@/lib/session";
import { UserPlus } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import {
  listRecruitmentCandidates,
  getRecruitmentStatistics,
  getRecruitmentFilterOptions,
  type RecruitmentFilters,
} from "@/lib/services/recruitment.service";
import { RecruitmentCharts } from "@/components/admin/recruitment/recruitment-charts";
import { RecruitmentTable } from "@/components/admin/recruitment/recruitment-table";

export const metadata = { title: "Rekrutmen — Harmoni" };
export const dynamic = "force-dynamic";

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams?: Promise<RecruitmentFilters>;
}) {
  await requireAdmin();

  const filters = (await searchParams) ?? {};
  const [candidates, filterOptions] = await Promise.all([
    listRecruitmentCandidates(filters),
    getRecruitmentFilterOptions(),
  ]);

  const stats = await getRecruitmentStatistics(candidates);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Onboarding"
        title="Rekrutmen"
        description="Monitoring pipeline proses rekrutmen calon karyawan, statistik per departemen, saluran pelamar (Workable), dan tahapan seleksi."
        icon={UserPlus}
      />

      {/* 3 Analytics Charts */}
      <RecruitmentCharts
        processesByDepartment={stats.processesByDepartment}
        candidatesBySource={stats.candidatesBySource}
        stepByRecruitment={stats.stepByRecruitment}
      />

      {/* Candidates Table & Filters */}
      <RecruitmentTable
        candidates={candidates}
        initialFilters={filters}
        filterOptions={filterOptions}
        kpis={{
          total: stats.total,
          activeProcesses: stats.activeProcesses,
          inInterview: stats.inInterview,
          offeringAndHired: stats.offeringAndHired,
        }}
      />
    </div>
  );
}
