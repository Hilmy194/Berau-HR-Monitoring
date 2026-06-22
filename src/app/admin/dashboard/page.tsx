import { requireAdmin } from "@/lib/session";
import { getAdminDashboardData } from "@/lib/services/probation.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCharts } from "@/components/admin/admin-charts";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserMinus,
  UserX,
  Clock4,
  CalendarClock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard — Berau Coal" };

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const data = await getAdminDashboardData();

  // Recent hires + upcoming presentations for lists
  const [recentHires, upcomingPresentations] = await Promise.all([
    prisma.profile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.presentation.findMany({
      where: { resultStatus: "SCHEDULED", presentationDate: { gte: new Date() } },
      include: { profile: { include: { user: true } } },
      orderBy: { presentationDate: "asc" },
      take: 5,
    }),
  ]);

  const cards = [
    { label: "Total New Hires", value: data.cards.totalEmployees, icon: Users, tone: "text-blue-600 bg-blue-50" },
    { label: "Active Probation", value: data.cards.activeProbation, icon: UserCheck, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Passed", value: data.cards.passed, icon: TrendingUp, tone: "text-green-600 bg-green-50" },
    { label: "Failed", value: data.cards.failed, icon: UserX, tone: "text-red-600 bg-red-50" },
    { label: "Extended", value: data.cards.extended, icon: Clock4, tone: "text-amber-600 bg-amber-50" },
    { label: "Upcoming Presentations", value: data.cards.upcomingPresentations, icon: CalendarClock, tone: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s the probation monitoring overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-bold mt-3 leading-none">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts statusDistribution={data.statusDistribution} monthlyTrend={data.monthlyTrend} />

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent hires */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Recent New Hires</CardTitle>
            <Link href="/admin/employees" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentHires.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No employees yet.</p>
            ) : (
              recentHires.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/employees/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(p.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.department ?? "—"} · {p.position ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={p.probationStatus} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming presentations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-4">
            <CardTitle className="text-base">Upcoming Presentations</CardTitle>
            <Link href="/admin/presentations" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPresentations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No upcoming presentations.</p>
            ) : (
              upcomingPresentations.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/employees/${p.profile.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                    <CalendarClock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.profile.user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.presentationDate)} · {p.presentationTime}</p>
                  </div>
                  <Badge variant="secondary">{p.location ?? "TBD"}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
