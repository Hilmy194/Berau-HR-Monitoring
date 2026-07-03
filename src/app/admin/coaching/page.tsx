import Link from "next/link";
import { MessagesSquare, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoachingFormDialog } from "@/components/admin/coaching-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";

export const metadata = { title: "Coaching Management - Berau Coal" };

export default async function AdminCoachingPage() {
  await requireAdmin();
  const [coachings, employees] = await Promise.all([
    prisma.coachingRecord.findMany({
      include: { profile: { include: { user: true } } },
      orderBy: [{ coachingDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.profile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Coaching Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jadwalkan coaching, pantau notes dari new hire, lalu isi hasil dan tindak lanjutnya.
          </p>
        </div>
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

      {coachings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada catatan coaching.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {coachings.map((coaching) => (
            <Card key={coaching.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/employees/${coaching.profileId}`} className="font-semibold hover:text-primary">
                      {coaching.profile.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {coaching.profile.department ?? "Tanpa departemen"} · Coach: {coaching.coachName}
                    </p>
                  </div>
                  <Badge variant="outline">{formatDate(coaching.coachingDate)}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Summary label="Goals" value={coaching.goals} />
                  <Summary label="Outcome" value={coaching.resultOutcome || "Belum diisi HR/admin"} />
                  <Summary label="Discussion" value={coaching.discussionNotes || "Belum diisi new hire"} />
                  <Summary label="Follow Up" value={coaching.followUpAction || "Belum ada tindak lanjut"} />
                </div>
                <div className="flex justify-end gap-1">
                  <CoachingFormDialog
                    mode="edit"
                    profileId={coaching.profileId}
                    coaching={{
                      id: coaching.id,
                      coachName: coaching.coachName,
                      coachingDate: coaching.coachingDate.toISOString(),
                      goals: coaching.goals,
                      discussionNotes: coaching.discussionNotes,
                      resultOutcome: coaching.resultOutcome,
                      followUpAction: coaching.followUpAction,
                    }}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                    }
                  />
                  <ConfirmDelete endpoint={`/api/admin/coaching/${coaching.id}`} label="coaching" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line">{value}</p>
    </div>
  );
}
