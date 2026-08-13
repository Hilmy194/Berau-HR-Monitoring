import { BellRing, Mail, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { listPicTaskNotifications } from "@/lib/services/notification.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Onboarding Notifications - Harmoni" };

export default async function RecruitmentNotificationsPage() {
  const notifications = await listPicTaskNotifications();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Onboarding"
        title="Notifications"
        description="Daftar reminder untuk PIC task onboarding. Reminder ini mewakili notifikasi email dan app account untuk PIC serta employee baru."
        icon={BellRing}
      />

      <div className="grid gap-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Tidak ada PIC notification aktif.</CardContent>
          </Card>
        ) : notifications.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{item.taskTitle}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                </div>
                <Badge variant={item.urgency === "Overdue" ? "destructive" : item.urgency === "Due Soon" ? "warning" : "secondary"}>{item.urgency}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border bg-slate-50 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Employee</p>
                <p className="mt-1 font-medium">{item.employeeName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {item.employeeEmail}</p>
              </div>
              <div className="rounded-md border bg-emerald-50 p-3 text-emerald-950">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800"><UserRoundCheck className="h-3.5 w-3.5" /> PIC</p>
                <p className="mt-1 font-medium">{item.pic.name}</p>
                <p className="mt-0.5 text-xs text-emerald-800">{item.pic.email}</p>
              </div>
              <div className="rounded-md border bg-slate-50 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Reminder</p>
                <p className="mt-1">Due {formatDate(item.dueDate)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.channels.map((channel) => <Badge key={channel} variant="outline">{channel}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
