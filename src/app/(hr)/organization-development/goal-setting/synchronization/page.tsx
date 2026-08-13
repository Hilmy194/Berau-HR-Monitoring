import { RefreshCw } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { GoalSyncButton } from "@/components/admin/goal-setting/goal-setting-actions";
import { getGoalSyncLogs } from "@/lib/services/goal-setting/goal-setting.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Entomo Synchronization - Harmoni" };

export default async function GoalSynchronizationPage() {
  const logs = await getGoalSyncLogs();
  const latest = logs[0];
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Goal Setting" title="Entomo Synchronization" description="Panel monitoring proses sinkronisasi Goal Setting dari Entomo ke read model internal aplikasi." icon={RefreshCw} />
      {latest && (
        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Last Successful Sync" value={formatDate(latest.syncFinishedAt)} />
          <Metric label="Sync Status" value={latest.status} />
          <Metric label="Records Received" value={latest.recordsReceived} />
          <Metric label="Sync Duration" value={`${Math.round(latest.durationMs / 1000)}s`} />
        </section>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <GoalSyncButton />
        <GoalSyncButton />
      </div>
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Sync Type</th><th className="p-4">Started</th><th className="p-4">Finished</th><th className="p-4">Status</th><th className="p-4">Received</th><th className="p-4">Inserted</th><th className="p-4">Updated</th><th className="p-4">Failed</th><th className="p-4">Error</th></tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-4">{log.syncType}</td>
                <td className="p-4">{formatDate(log.syncStartedAt)}</td>
                <td className="p-4">{formatDate(log.syncFinishedAt)}</td>
                <td className="p-4"><Badge variant={log.status === "Success" ? "success" : log.status === "Failed" ? "destructive" : "warning"}>{log.status}</Badge></td>
                <td className="p-4">{log.recordsReceived}</td>
                <td className="p-4">{log.recordsInserted}</td>
                <td className="p-4">{log.recordsUpdated}</td>
                <td className="p-4">{log.recordsFailed}</td>
                <td className="p-4 text-muted-foreground">{log.errorMessage ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
