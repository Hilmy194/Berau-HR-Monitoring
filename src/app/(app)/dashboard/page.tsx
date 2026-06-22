import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmployeeDashboardData } from "@/lib/services/probation.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import {
  ListChecks,
  CheckCircle2,
  CircleDashed,
  Percent,
  CalendarClock,
  Award,
  Briefcase,
  CalendarDays,
  MapPin,
  Users2,
  Link2,
  Clock,
} from "lucide-react";

export const metadata = { title: "Dashboard — HR Digital" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const data = await getEmployeeDashboardData(session.user.id);
  if (!data) redirect("/profile/setup");

  const { user, profile, summary, progress, recentTasks, presentation } = data;

  const stats = [
    { label: "Total Tasks", value: progress.totalTasks, icon: ListChecks, tone: "text-blue-600 bg-blue-50" },
    { label: "Completed", value: progress.completedTasks, icon: CheckCircle2, tone: "text-green-600 bg-green-50" },
    { label: "Remaining", value: progress.totalTasks - progress.completedTasks, icon: CircleDashed, tone: "text-amber-600 bg-amber-50" },
    { label: "Progress", value: `${progress.progressPercentage}%`, icon: Percent, tone: "text-indigo-600 bg-indigo-50" },
    {
      label: "Presentation",
      value: presentation?.presentationDate ? formatDate(presentation.presentationDate) : "Not set",
      icon: CalendarClock,
      tone: "text-purple-600 bg-purple-50",
    },
    {
      label: "Final Score",
      value: presentation?.score != null ? `${presentation.score}` : "Pending",
      icon: Award,
      tone: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header / Employee summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{profile.position ?? "—"}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.department ?? "—"}</span>
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(profile.joinDate)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={summary.status} className="text-sm px-3 py-1" />
      </div>

      {/* Probation summary banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Probation Start</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(summary.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Probation End</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(summary.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Day</p>
              <p className="text-sm font-semibold mt-0.5">
                Day {summary.currentDay} <span className="text-muted-foreground font-normal">/ {summary.totalDays}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days Remaining</p>
              <p className="text-sm font-semibold mt-0.5">{summary.remainingDays} days</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Probation timeline</span>
              <span className="font-medium">{Math.min(100, Math.round((summary.currentDay / summary.totalDays) * 100))}%</span>
            </div>
            <Progress value={Math.min(100, (summary.currentDay / summary.totalDays) * 100)} indicatorClassName="bg-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-bold mt-3 leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task progress + Recent tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Task Progress</CardTitle>
            <CardDescription>Your probation activity completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-primary">{progress.progressPercentage}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedTasks} of {progress.totalTasks} tasks done
              </p>
            </div>
            <Progress value={progress.progressPercentage} indicatorClassName="bg-green-600" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-semibold text-green-600">{progress.completedTasks}</p>
                <p className="text-muted-foreground">Done</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-semibold text-amber-600">{progress.inProgressTasks}</p>
                <p className="text-muted-foreground">Active</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="font-semibold text-muted-foreground">{progress.notStartedTasks}</p>
                <p className="text-muted-foreground">To do</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
            <CardDescription>Your latest probation activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No tasks assigned yet.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> Due {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming presentation */}
      {presentation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Upcoming Presentation</CardTitle>
                <CardDescription>Your final probation presentation</CardDescription>
              </div>
              <StatusBadge status={presentation.resultStatus} />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem icon={CalendarClock} label="Date & Time" value={`${formatDate(presentation.presentationDate)} • ${presentation.presentationTime ?? "—"}`} />
            <InfoItem icon={MapPin} label="Location" value={presentation.location ?? "—"} />
            <InfoItem icon={Link2} label="Meeting Link" value={presentation.meetingLink ? "Available" : "—"} link={presentation.meetingLink ?? undefined} />
            <InfoItem icon={Users2} label="Panelists" value={`${presentation.panelists?.length ?? 0} assigned`} />
            {presentation.score != null && (
              <InfoItem icon={Award} label="Final Score" value={`${presentation.score} / 100`} />
            )}
            {presentation.remarks && (
              <div className="md:col-span-2 lg:col-span-4 rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm">{presentation.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, link }: { icon: React.ElementType; label: string; value: string; link?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium mt-1 text-primary hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium mt-1">{value}</p>
      )}
    </div>
  );
}
