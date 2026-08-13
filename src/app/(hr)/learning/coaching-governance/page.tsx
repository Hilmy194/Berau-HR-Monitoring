import Link from "next/link";
import { ClipboardList, MessagesSquare, Pencil } from "lucide-react";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { getEmployeeFilterOptions, listCoachingGovernance } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachingFormDialog } from "@/components/admin/coaching-form-dialog";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coaching Governance - Harmoni" };

export default async function CoachingGovernancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options, employees] = await Promise.all([
    listCoachingGovernance(filters),
    getEmployeeFilterOptions(),
    prisma.profile.findMany({
      where: { workforceStage: "EMPLOYEE" },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <ModuleHero eyebrow="Learning" title="Coaching Governance Monitoring" description="Monitoring goals, discussion employee, outcome, follow up, jumlah pertemuan, dan status coaching." icon={ClipboardList} />
        <div className="flex justify-end">
          <CoachingFormDialog
            mode="create"
            employees={employees.map((employee) => ({
              id: employee.id,
              name: employee.user.name,
              department: employee.department,
              supervisorName: employee.supervisorName,
            }))}
          />
        </div>
      </div>
      <CascadingFilterBar q={filters.q} selectedDirectorate={filters.directorate} selectedDivision={filters.division} selectedDepartment={filters.department} selectedEmployee={filters.employee} qPlaceholder="Search employee, goal, atau follow-up..." orgOptions={options.orgOptions} employees={options.employees} showEmployee />
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada coaching yang ditambahkan.</p>
          </CardContent>
        </Card>
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-4">Employee</th><th className="p-4">Position</th><th className="p-4">Organization</th><th className="p-4">Goals</th><th className="p-4">Discussion</th><th className="p-4">Schedule</th><th className="p-4">Coach</th><th className="p-4">Progress</th><th className="p-4">Outcome</th><th className="p-4">Follow Up</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-emerald-50/60">
                  <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                  <td className="p-4">{row.currentPosition}</td>
                  <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                  <td className="p-4 min-w-60">{row.goals}</td>
                  <td className="p-4 min-w-64 text-muted-foreground">{row.discussion || "Belum diisi employee"}</td>
                  <td className="p-4"><Badge variant="outline">{formatDate(row.schedule)}</Badge></td>
                  <td className="p-4">{row.coach}</td>
                  <td className="p-4"><Badge variant="secondary">{row.progress}</Badge></td>
                  <td className="p-4 min-w-64 text-muted-foreground">{row.outcome || "Belum ada outcome"}</td>
                  <td className="p-4 min-w-64 text-muted-foreground">{row.followUp || "Belum ada follow up"}</td>
                  <td className="p-4"><Badge variant={row.status === "COMPLETED" ? "default" : row.status === "NOT_STARTED" ? "outline" : "secondary"}>{formatCoachingStatus(row.status)}</Badge></td>
                  <td className="p-4">
                    <CoachingFormDialog
                      mode="edit"
                      profileId={row.profileId}
                      coaching={{
                        id: row.id,
                        coachName: row.coach,
                        coachingDate: row.schedule,
                        sessionNumber: row.sessionNumber,
                        totalSessions: row.totalSessions,
                        status: row.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
                        goals: row.goals,
                        discussionNotes: row.discussion,
                        resultOutcome: row.outcome,
                        followUpAction: row.followUp,
                      }}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}

function formatCoachingStatus(status: string) {
  if (status === "NOT_STARTED") return "Belum Dimulai";
  if (status === "COMPLETED") return "Selesai";
  return "On Progress";
}
