import { BellRing, Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { listRetirementNotifications } from "@/lib/services/notification.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Retirement Notifications - Harmoni" };

export default async function RetirementNotificationsPage() {
  const notifications = await listRetirementNotifications();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Retire"
        title="Notifications"
        description="Notifikasi khusus employee yang sudah mendekati masa pensiun dalam 3 bulan lagi agar HR bisa menyiapkan kontrak, replacement, dan handover."
        icon={BellRing}
      />

      <div className="grid gap-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Tidak ada employee yang pensiun dalam 3 bulan ke depan.</CardContent>
          </Card>
        ) : notifications.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><Hourglass className="h-4 w-4" /> {item.employeeName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{item.position} - {item.department}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.status === "Overdue" || item.status === "Critical" ? "destructive" : item.status === "Warning" ? "warning" : "secondary"}>{item.status}</Badge>
                  <Badge variant="destructive">3 bulan lagi</Badge>
                  <Badge variant={item.extensionStatus === "Extended" ? "warning" : "outline"}>{item.extensionStatus}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{item.message}</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Retirement Age</p>
                  <p className="mt-1 font-medium">{item.retirementAge} tahun</p>
                </div>
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Retirement Date</p>
                  <p className="mt-1 font-medium">{formatDate(item.retirementDate)}</p>
                </div>
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Remaining</p>
                  <p className="mt-1 font-medium">{item.remainingTime}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.remainingDays} hari lagi</p>
                </div>
              </div>
              {item.notes && <p className="rounded-md border bg-amber-50 p-3 text-xs text-amber-900">{item.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
