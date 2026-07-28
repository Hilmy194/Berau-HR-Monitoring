import { BellRing, CalendarClock, Mail, Smartphone } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { ProbationReminderActions } from "@/components/admin/probation-reminder-actions";
import { listProbationMonitoringRows } from "@/lib/services/probation.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Probation Monitoring - Berau Coal HR" };

export default async function ProbationMonitoringPage() {
  const rows = await listProbationMonitoringRows();
  const dueSoon = rows.filter((row) => row.reminderStatus === "Due Soon").length;
  const overdue = rows.filter((row) => row.reminderStatus === "Overdue").length;
  const scheduled = rows.filter((row) => row.reminderStatus === "Scheduled").length;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Recruitment"
        title="Probation Monitoring"
        description="Workspace reminder probation: presentasi dipantau dari join date + 2 bulan, lalu reminder disiapkan ke email dan akun aplikasi employee maupun PIC task."
        icon={BellRing}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ReminderCard label="Presentation due soon" value={dueSoon} icon={CalendarClock} />
        <ReminderCard label="Presentation overdue" value={overdue} icon={BellRing} tone="danger" />
        <ReminderCard label="Already scheduled" value={scheduled} icon={Mail} tone="success" />
      </div>

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
  tone?: "neutral" | "danger" | "success";
}) {
  const toneClass = tone === "danger"
    ? "bg-red-50 text-red-700"
    : tone === "success"
      ? "bg-emerald-50 text-emerald-700"
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

function ReminderStatusBadge({ status }: { status: string }) {
  const variant = status === "Overdue" ? "destructive" : status === "Due Soon" ? "warning" : status === "Scheduled" ? "success" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
