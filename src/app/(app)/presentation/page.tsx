import { getCurrentProfile } from "@/lib/session";
import { getPresentationsForProfile } from "@/lib/services/presentation.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  CalendarClock,
  MapPin,
  Link2,
  Users2,
  Award,
  MessageSquare,
  Presentation as PresentationIcon,
  ExternalLink,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Presentation — Berau Coal" };

export default async function PresentationPage() {
  const { profile } = await getCurrentProfile();
  const presentations = await getPresentationsForProfile(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Probation Presentation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your final probation presentation details and result.
        </p>
      </div>

      {presentations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PresentationIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">
              No presentation has been scheduled yet. HR will schedule this closer to the end of your probation.
            </p>
          </CardContent>
        </Card>
      ) : (
        presentations.map((p) => (
          <div key={p.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Presentation Details</CardTitle>
                    <CardDescription>Your scheduled probation presentation</CardDescription>
                  </div>
                  <StatusBadge status={p.resultStatus} className="text-sm px-3 py-1" />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Detail icon={CalendarClock} label="Date" value={formatDate(p.presentationDate)} />
                <Detail icon={Clock} label="Time" value={p.presentationTime ?? "—"} />
                <Detail icon={MapPin} label="Location" value={p.location ?? "—"} />
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" /> Meeting Link
                  </div>
                  {p.meetingLink ? (
                    <a href={p.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium mt-1 text-primary hover:underline flex items-center gap-1">
                      Join meeting <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium mt-1">—</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Panelists */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users2 className="h-4 w-4" /> Panelists
                </CardTitle>
                <CardDescription>The panel evaluating your presentation</CardDescription>
              </CardHeader>
              <CardContent>
                {p.panelists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No panelists assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {p.panelists.map((pl) => (
                      <div key={pl.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(pl.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{pl.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{pl.position ?? "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score & Result */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" /> Score & Result
                </CardTitle>
                <CardDescription>Your evaluation outcome</CardDescription>
              </CardHeader>
              <CardContent>
                {p.score == null && p.resultStatus === "SCHEDULED" ? (
                  <div className="rounded-lg bg-muted/40 p-6 text-center">
                    <Award className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm font-medium mt-2">Result Pending</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your score and recommendation will appear here after the presentation.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-xs text-muted-foreground">Final Score</p>
                      <p className="text-3xl font-bold text-primary mt-1">{p.score ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">out of 100</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-xs text-muted-foreground">Recommendation</p>
                      <div className="mt-2 flex justify-center">
                        <StatusBadge status={p.resultStatus} className="text-sm px-3 py-1" />
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-xs text-muted-foreground">Probation Status</p>
                      <div className="mt-2 flex justify-center">
                        <StatusBadge status={profile.probationStatus} className="text-sm px-3 py-1" />
                      </div>
                    </div>
                    {p.remarks && (
                      <div className="md:col-span-3 rounded-lg bg-muted/40 p-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <MessageSquare className="h-3.5 w-3.5" /> Remarks
                        </p>
                        <p className="text-sm">{p.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <div className="text-center pt-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
