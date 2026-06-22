import { requireAdmin } from "@/lib/session";
import { listPresentations } from "@/lib/services/presentation.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PresentationFormDialog } from "@/components/admin/presentation-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { RESULT_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, getInitials } from "@/lib/utils";
import Link from "next/link";
import { Pencil, SearchX, Presentation as PresentationIcon, CalendarClock, Users2, Award } from "lucide-react";

export const metadata = { title: "Presentations — Berau Coal" };

export default async function AdminPresentationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const filters = { status: sp?.status };
  const [presentations, employees] = await Promise.all([
    listPresentations(filters),
    prisma.profile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const statusOptions = [...RESULT_STATUS_OPTIONS];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Presentation Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule presentations, manage panelists, and record final scores.
          </p>
        </div>
        <PresentationFormDialog
          mode="create"
          employees={employees.map((e) => ({ id: e.id, name: e.user.name, department: e.department }))}
        />
      </div>

      {presentations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PresentationIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">No presentations scheduled yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {presentations.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/employees/${p.profile.id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(p.profile.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium hover:text-primary truncate">{p.profile.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.profile.department ?? "—"}</p>
                    </div>
                  </Link>
                  <StatusBadge status={p.resultStatus} />
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    <span>{formatDate(p.presentationDate)} · {p.presentationTime ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users2 className="h-4 w-4 shrink-0" />
                    <span>{p.panelists.length} panelist{p.panelists.length !== 1 ? "s" : ""} · {p.location ?? "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4 shrink-0" />
                    <span>{p.score != null ? `Score: ${p.score}/100` : "No score yet"}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-end gap-1">
                  <PresentationFormDialog
                    mode="edit"
                    presentation={{
                      id: p.id,
                      presentationDate: p.presentationDate?.toISOString(),
                      presentationTime: p.presentationTime,
                      location: p.location,
                      meetingLink: p.meetingLink,
                      resultStatus: p.resultStatus,
                        panelists: p.panelists.map((panelist) => ({ name: panelist.name, position: panelist.position })),
                    }}
                    trigger={
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </span>
                    }
                  />
                  <ConfirmDelete endpoint={`/api/admin/presentations/${p.id}`} label="presentation" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {presentations.length} presentation{presentations.length !== 1 ? "s" : ""}. Manage panelists and scores in each employee&apos;s detail view.
      </p>
    </div>
  );
}
