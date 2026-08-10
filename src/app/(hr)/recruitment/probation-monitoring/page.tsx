import { BellRing, CalendarClock, CheckCircle2, Mail, Smartphone, TimerReset, UsersRound } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { ProbationReminderActions } from "@/components/admin/probation-reminder-actions";
import { ProbationDashboardCharts } from "@/components/admin/probation-dashboard-charts";
import { listProbationMonitoringRows } from "@/lib/services/probation.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard Probation - Berau Coal HR" };

const INDUCTION_TEMPLATE_TASKS = [
  "Registrasi kedatangan dan welcome briefing",
  "Pembuatan email, akun aplikasi, dan akses sistem",
  "Safety induction dan compliance awal",
  "Pengenalan area kerja, fasilitas, dan PIC",
  "KPI probation, target kerja, dan project assignment",
  "Coaching checkpoint dan final presentation preparation",
];

export default async function ProbationMonitoringPage() {
  const rows = await listProbationMonitoringRows();
  const total = rows.length;
  const active = rows.filter((row) => row.probationStatus === "ACTIVE").length;
  const passed = rows.filter((row) => row.probationStatus === "PASSED").length;
  const failed = rows.filter((row) => row.probationStatus === "FAILED").length;
  const extended = rows.filter((row) => row.probationStatus === "EXTENDED").length;
  const dueSoon = rows.filter((row) => row.reminderStatus === "Due Soon").length;
  const overdue = rows.filter((row) => row.reminderStatus === "Overdue").length;
  const scheduled = rows.filter((row) => row.reminderStatus === "Scheduled").length;
  const completed = rows.filter((row) => row.reminderStatus === "Completed").length;
  const waitingSchedule = rows.filter((row) => row.reminderStatus === "Waiting Schedule").length;
  const actionNeeded = dueSoon + overdue + waitingSchedule;
  const newHireTrend = buildMonthlyTrend(rows, "joinDate");
  const endDateTrend = buildMonthlyTrend(rows, "probationEndDate");

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Recruitment"
        title="Dashboard"
        description="Ringkasan probation: status karyawan, readiness reminder presentasi, channel notifikasi, dan jadwal yang perlu dipantau HR."
        icon={BellRing}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReminderCard label="Probation employees" value={total} icon={UsersRound} />
        <ReminderCard label="Active probation" value={active} icon={CalendarClock} />
        <ReminderCard label="Presentation action" value={actionNeeded} icon={TimerReset} tone={overdue > 0 ? "danger" : "warning"} />
        <ReminderCard label="Passed" value={passed} icon={CheckCircle2} tone="success" />
      </div>

      <ProbationDashboardCharts
        statusDistribution={[
          { name: "Active", value: active, fill: "#2563eb" },
          { name: "Passed", value: passed, fill: "#22c55e" },
          { name: "Failed", value: failed, fill: "#ef4444" },
          { name: "Extended", value: extended, fill: "#eab308" },
        ]}
        newHireTrend={newHireTrend}
        endDateTrend={endDateTrend}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <InsightCard label="Due soon" value={dueSoon} detail="Reminder presentasi dalam 14 hari" tone="warning" />
        <InsightCard label="Overdue" value={overdue} detail="Belum terjadwal melewati tanggal reminder" tone="danger" />
        <InsightCard label="Scheduled or completed" value={scheduled + completed} detail="Sudah punya tanggal presentasi atau selesai" tone="success" />
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Induction Template Task</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {INDUCTION_TEMPLATE_TASKS.map((task, index) => (
            <div key={task} className="rounded-lg border bg-slate-50 p-3 text-sm font-medium">
              <span className="mr-2 text-xs font-bold text-emerald-700">{String(index + 1).padStart(2, "0")}</span>
              {task}
            </div>
          ))}
        </div>
      </section>

      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Join Date</th>
              <th className="p-4">Presentation Reminder</th>
              <th className="p-4">Presentation Date</th>
              <th className="p-4">Probation Status</th>
              <th className="p-4">Reminder Status</th>
              <th className="p-4">Task/PIC Reminder</th>
              <th className="p-4">Channels</th>
              <th className="p-4">Push Reminder</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.profileId} className="hover:bg-emerald-50/60">
                <td className="p-4">
                  <Link href={`/admin/employees/${row.profileId}`} className="font-medium hover:text-emerald-700 hover:underline">
                    {row.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{row.position} - {row.department}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </td>
                <td className="p-4 whitespace-nowrap">{formatDate(row.joinDate)}</td>
                <td className="p-4">
                  <p className="whitespace-nowrap font-medium">{formatDate(row.presentationReminderDate)}</p>
                  <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">{row.presentationReminderSummary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">To: {row.presentationReminderRecipients.join(", ")}</p>
                </td>
                <td className="p-4 whitespace-nowrap">{formatDate(row.presentationDate)}</td>
                <td className="p-4"><StatusBadge status={row.probationStatus} /></td>
                <td className="p-4"><ReminderStatusBadge status={row.reminderStatus} /></td>
                <td className="p-4">
                  <p>{row.taskReminderSummary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.picReminderSummary}</p>
                  {row.picReminderRecipients.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">PIC: {row.picReminderRecipients.join(", ")}</p>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {row.reminderChannels.map((channel) => (
                      <Badge key={channel} variant="outline" className="gap-1.5">
                        {channel === "Email" ? <Mail className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <ProbationReminderActions
                    profileId={row.profileId}
                    channels={row.reminderChannels}
                    presentationRecipients={row.presentationReminderRecipients}
                    picRecipients={row.picReminderRecipients}
                    canSendPresentationReminder={row.canSendPresentationReminder}
                    canSendPicReminder={row.canSendPicReminder}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function ReminderCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: typeof BellRing;
  tone?: "neutral" | "danger" | "success" | "warning";
}) {
  const toneClass = tone === "danger"
    ? "bg-red-50 text-red-700"
    : tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "warning" | "danger" | "success";
}) {
  const toneClass = tone === "danger"
    ? "border-red-200 bg-red-50 text-red-700"
    : tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm opacity-80">{detail}</p>
    </div>
  );
}

function ReminderStatusBadge({ status }: { status: string }) {
  const variant = status === "Overdue" ? "destructive" : status === "Due Soon" ? "warning" : status === "Scheduled" ? "success" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function buildMonthlyTrend(
  rows: Awaited<ReturnType<typeof listProbationMonitoringRows>>,
  dateField: "joinDate" | "probationEndDate"
) {
  const now = new Date();
  const buckets = new Map<string, { month: string; count: number }>();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    buckets.set(key, {
      month: date.toLocaleDateString("id-ID", { month: "short" }),
      count: 0,
    });
  }

  for (const row of rows) {
    const value = row[dateField];
    const bucket = value ? buckets.get(monthKey(value)) : undefined;
    if (bucket) bucket.count += 1;
  }

  return Array.from(buckets.values());
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}
