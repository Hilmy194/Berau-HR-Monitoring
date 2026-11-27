import Link from "next/link";
import { ArrowLeft, Milestone } from "lucide-react";
import { notFound } from "next/navigation";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Button } from "@/components/ui/button";
import { listEmployeeDirectory } from "@/lib/services/employee-directory.service";
import { listValidCareerTargetPositionsForAi } from "@/lib/services/career-options-sync.service";
import { CareerPathAiPanel } from "@/components/admin/career-path-ai-panel";
import { getLatestTalentAiAnalysisForEmployee } from "@/lib/services/talent-ai.service";

export const metadata = { title: "Employee Career Path - Harmoni" };

export default async function EmployeeCareerPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, filters] = await Promise.all([params, searchParams]);
  const employees = await listEmployeeDirectory();
  const selectedEmployee = employees.find((employee) => employee.id === id);
  if (!selectedEmployee) notFound();

  const [latestAiAnalysis, targetCatalogMeta] = await Promise.all([
    getLatestTalentAiAnalysisForEmployee({ analysisType: "CAREER_PATH", employeeId: selectedEmployee.id }),
    listValidCareerTargetPositionsForAi(selectedEmployee.id, 30),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="gap-2 bg-white">
          <Link href={backHref(filters)}>
            <ArrowLeft className="h-4 w-4" />
            Kembali ke List Employee
          </Link>
        </Button>
      </div>

      <ModuleHero
        eyebrow="Career Path"
        title={selectedEmployee.name}
        description={`${selectedEmployee.position} / ${selectedEmployee.directorate} / ${selectedEmployee.division} / ${selectedEmployee.department} · ${selectedEmployee.nik ?? "No NIK"} / ${selectedEmployee.email}`}
        icon={Milestone}
      />

      <CareerPathAiPanel
        employeeId={selectedEmployee.id}
        initialAnalysis={latestAiAnalysis}
        targetCatalogMeta={targetCatalogMeta.map((item) => ({
          targetPositionId: item.targetPositionId,
          targetPosition: item.targetPosition,
          targetPsLevel: item.targetPsLevel,
          targetLayer: item.targetLayer,
          targetDirectorate: item.targetDirectorate,
          targetDivision: item.targetDivision,
          targetDepartment: item.targetDepartment,
        }))}
      />
    </div>
  );
}

function backHref(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["peopleQ", "directorate", "division", "department", "position", "peopleLimit"]) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/talent/career-path${query ? `?${query}` : ""}`;
}
