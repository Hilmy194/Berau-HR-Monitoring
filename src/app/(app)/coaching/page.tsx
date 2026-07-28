import { getCurrentProfile } from "@/lib/session";
import { getCoachingsForProfile } from "@/lib/services/coaching.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoachingDiscussionForm } from "@/components/app/coaching-discussion-form";
import { formatDate } from "@/lib/utils";
import { CalendarDays, MessagesSquare, Target, ClipboardList, CheckCircle2, ArrowRightCircle } from "lucide-react";

export const metadata = { title: "Coaching - Berau Coal" };

export default async function CoachingPage() {
  const { profile } = await getCurrentProfile();
  const coachings = await getCoachingsForProfile(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Coaching</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lihat jadwal coaching dari HR/admin dan isi discussion notes Anda setelah sesi berlangsung.
        </p>
      </div>

      {coachings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada riwayat coaching yang dicatat oleh HR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {coachings.map((coaching) => (
            <Card key={coaching.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{coaching.coachName}</CardTitle>
                    <CardDescription>Coach / Atasan</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="w-fit gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(coaching.coachingDate)}
                    </Badge>
                    <Badge variant="secondary" className="w-fit">
                      Pertemuan {coaching.sessionNumber}/{coaching.totalSessions}
                    </Badge>
                    <Badge variant={coaching.status === "COMPLETED" ? "default" : coaching.status === "NOT_STARTED" ? "outline" : "secondary"} className="w-fit">
                      {formatCoachingStatus(coaching.status)}
                    </Badge>
                    <CoachingDiscussionForm coachingId={coaching.id} defaultValue={coaching.discussionNotes} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Section icon={Target} title="Goals" value={coaching.goals} />
                <Section
                  icon={ClipboardList}
                  title="Discussion / Notes"
                  value={coaching.discussionNotes || "Belum diisi. Silakan isi notes setelah coaching."}
                />
                <Section
                  icon={CheckCircle2}
                  title="Result / Outcome"
                  value={coaching.resultOutcome || "Belum diisi oleh HR/admin."}
                />
                <Section
                  icon={ArrowRightCircle}
                  title="Follow Up Action"
                  value={coaching.followUpAction || "Belum ada tindak lanjut dari HR/admin."}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCoachingStatus(status: string) {
  if (status === "NOT_STARTED") return "Belum Dimulai";
  if (status === "COMPLETED") return "Selesai";
  return "On Progress";
}

function Section({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <p className="mt-2 text-sm whitespace-pre-line">{value}</p>
    </div>
  );
}
