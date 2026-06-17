import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getProfileDetail } from "@/lib/services/employee.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials, toDateInputValue } from "@/lib/utils";
import { TaskFormDialog } from "@/components/admin/task-form-dialog";
import { PresentationFormDialog } from "@/components/admin/presentation-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  AddPanelistDialog,
  RemovePanelistButton,
  ScoreFormDialog,
} from "@/components/admin/presentation-actions";
import {
  Briefcase, MapPin, CalendarDays, Phone, IdCard, Home, Cake, User, ShieldAlert,
  FileText, Image as ImageIcon, Link2, Clock, Users2, Award, ArrowLeft, ExternalLink,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Employee Detail — HR Digital" };

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const profile = await getProfileDetail(id);
  if (!profile) notFound();

  const presentation = profile.presentations[0];
  const tasksCompleted = profile.tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/employees"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">{getInitials(profile.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{profile.user.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{profile.position ?? "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.department ?? "—"}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(profile.joinDate)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={profile.probationStatus} className="text-sm px-3 py-1" />
            </div>
          </div>

          {/* Probation timeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <MiniStat label="Probation Start" value={formatDate(profile.probationStartDate)} />
            <MiniStat label="Probation End" value={formatDate(profile.probationEndDate)} />
            <MiniStat label="Tasks" value={`${tasksCompleted}/${profile.tasks.length} done`} />
            <MiniStat label="NIK" value={profile.nik ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({profile.tasks.length})</TabsTrigger>
          <TabsTrigger value="presentation">Presentation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row icon={IdCard} label="NIK" value={profile.nik} />
                <Row icon={Phone} label="Phone" value={profile.phone} />
                <Row icon={Home} label="Address" value={profile.address} />
                <Row icon={Cake} label="Birth Date" value={formatDate(profile.birthDate)} />
                <Row icon={User} label="Gender" value={profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : null} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Employment & Emergency</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row icon={Briefcase} label="Position" value={profile.position} />
                <Row icon={MapPin} label="Department" value={profile.department} />
                <Row icon={CalendarDays} label="Supervisor" value={profile.supervisorName} />
                <Separator />
                <Row icon={ShieldAlert} label="Emergency Contact" value={profile.emergencyContactName} />
                <Row icon={Phone} label="Emergency Phone" value={profile.emergencyContactPhone} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <TaskFormDialog mode="create" profileId={profile.id} />
          </div>
          {profile.tasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No tasks assigned.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {profile.tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{task.title}</p>
                        <StatusBadge status={task.status} />
                      </div>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Due {formatDate(task.dueDate)}</p>
                      {task.notes && <div className="mt-2 rounded bg-muted/50 p-2 text-sm"><span className="text-xs text-muted-foreground">Notes: </span>{task.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <TaskFormDialog
                        mode="edit"
                        task={{
                          id: task.id,
                          title: task.title,
                          description: task.description,
                          dueDate: task.dueDate?.toISOString(),
                          status: task.status,
                          notes: task.notes,
                        }}
                        trigger={
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </span>
                        }
                      />
                      <ConfirmDelete endpoint={`/api/admin/tasks/${task.id}`} label="task" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PRESENTATION TAB */}
        <TabsContent value="presentation" className="space-y-4">
          {presentation ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Presentation</CardTitle>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={presentation.resultStatus} />
                      <PresentationFormDialog
                        mode="edit"
                        presentation={{
                          id: presentation.id,
                          presentationDate: presentation.presentationDate?.toISOString(),
                          presentationTime: presentation.presentationTime,
                          location: presentation.location,
                          meetingLink: presentation.meetingLink,
                          resultStatus: presentation.resultStatus,
                        }}
                        trigger={<Button variant="outline" size="sm">Edit</Button>}
                      />
                      <ConfirmDelete endpoint={`/api/admin/presentations/${presentation.id}`} label="presentation" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Row icon={CalendarDays} label="Date" value={formatDate(presentation.presentationDate)} />
                  <Row icon={Clock} label="Time" value={presentation.presentationTime} />
                  <Row icon={MapPin} label="Location" value={presentation.location} />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Meeting Link</p>
                    {presentation.meetingLink ? (
                      <a href={presentation.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        Join <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <p className="text-sm font-medium">—</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Panelists */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Users2 className="h-4 w-4" /> Panelists ({presentation.panelists.length})</CardTitle>
                    <AddPanelistDialog presentationId={presentation.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  {presentation.panelists.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No panelists assigned.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {presentation.panelists.map((pl) => (
                        <div key={pl.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(pl.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pl.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pl.position ?? "—"}</p>
                          </div>
                          <RemovePanelistButton presentationId={presentation.id} panelistId={pl.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Score & Result</CardTitle>
                    <ScoreFormDialog
                      presentationId={presentation.id}
                      current={{ score: presentation.score, remarks: presentation.remarks, resultStatus: presentation.resultStatus }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {presentation.score == null ? (
                    <p className="text-sm text-muted-foreground">No score submitted yet. Use &quot;Input Score&quot; to finalize the probation result.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-xs text-muted-foreground">Final Score</p>
                        <p className="text-3xl font-bold text-primary mt-1">{presentation.score}</p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-xs text-muted-foreground">Result</p>
                        <div className="mt-2 flex justify-center"><StatusBadge status={presentation.resultStatus} /></div>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-xs text-muted-foreground">Probation Status</p>
                        <div className="mt-2 flex justify-center"><StatusBadge status={profile.probationStatus} /></div>
                      </div>
                      {presentation.remarks && (
                        <div className="md:col-span-3 rounded-lg bg-muted/40 p-4">
                          <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                          <p className="text-sm">{presentation.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-sm text-muted-foreground">No presentation scheduled for this employee.</p>
                <div className="flex justify-center">
                  <PresentationFormDialog mode="create" profileId={profile.id} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> CV / Resume</CardTitle></CardHeader>
              <CardContent>
                {profile.cvUrl ? (
                  <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View CV <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <p className="text-sm text-muted-foreground">Not provided.</p>}
                <p className="text-xs text-muted-foreground mt-2 break-all">{profile.cvUrl}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photo</CardTitle></CardHeader>
              <CardContent>
                {profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoUrl} alt="Employee" className="h-32 w-32 rounded-lg object-cover border" />
                ) : <p className="text-sm text-muted-foreground">Not provided.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}
