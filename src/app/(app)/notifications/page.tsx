import { BellRing, Mail, UserRoundCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/session";
import { listEmployeeNotifications } from "@/lib/services/notification.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Notifications - Berau Coal" };

export default async function EmployeeNotificationsPage() {
  const { profile } = await getCurrentProfile();
  const notifications = await listEmployeeNotifications(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold"><BellRing className="h-5 w-5" /> Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Task reminders and PIC contacts for your probation onboarding.</p>
      </div>

      <div className="grid gap-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">No active notifications.</CardContent>
          </Card>
        ) : notifications.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant={item.urgency === "Overdue" ? "destructive" : item.urgency === "Due Soon" ? "warning" : "secondary"}>{item.urgency}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{item.message}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Due {formatDate(item.dueDate)}</Badge>
                <Badge variant="outline">Status {item.status}</Badge>
                <Badge variant="outline">{item.channel}</Badge>
              </div>
              {item.pic && (
                <div className="rounded-md border bg-emerald-50 p-3 text-emerald-950">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <UserRoundCheck className="h-3.5 w-3.5" /> PIC Contact
                  </p>
                  <p className="mt-1 font-medium">{item.pic.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-800">
                    <Mail className="h-3.5 w-3.5" /> {item.pic.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
