import { ClipboardList, MessagesSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import {
  getEmployeeFilterOptions,
  listCoachingGovernance,
  listEmployeeMaster,
} from "@/lib/services/hr-modules.service";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingFormDialog } from "@/components/admin/coaching-form-dialog";
import { CoachingGovernanceTable } from "@/components/admin/coaching-governance-table";

export const metadata = { title: "Coaching Governance - Harmoni" };

export default async function CoachingGovernancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireAuth();
  if (!isRoutePermitted("/learning/coaching-governance", session.user.role, session.user.allowedRoutes)) {
    redirect("/admin");
  }

  const filters = await searchParams;
  const [rows, options, allMasterEmployees] = await Promise.all([
    listCoachingGovernance(filters),
    getEmployeeFilterOptions(),
    listEmployeeMaster(),
  ]);

  const employeesForDialog = allMasterEmployees.map((emp) => ({
    id: emp.profileId,
    name: emp.name,
    department: emp.department,
    supervisorName: emp.supervisorName,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <ModuleHero
          eyebrow="Learning"
          title="Coaching Governance Monitoring"
          description="Monitoring riwayat pertemuan coaching (pertemuan 1 sampai terakhir), action, discussion, outcome, goals, progress, dan coach karyawan."
          icon={ClipboardList}
        />
        <div className="flex justify-end">
          <CoachingFormDialog
            mode="create"
            employees={employeesForDialog}
          />
        </div>
      </div>
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedEmployee={filters.employee}
        qPlaceholder="Cari employee, coach, goals, atau action plan..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
      />
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada data coaching yang sesuai dengan filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CoachingGovernanceTable
          rows={rows}
          employeesForDialog={employeesForDialog}
        />
      )}
    </div>
  );
}
