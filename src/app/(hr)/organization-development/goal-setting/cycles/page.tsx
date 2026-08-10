import { CalendarClock } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { getGoalCycles } from "@/lib/services/goal-setting/goal-setting.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Goal Cycles - Berau Coal HR" };

export default async function GoalCyclesPage() {
  const cycles = await getGoalCycles();
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Goal Setting" title="Goal Cycle Monitoring" description="Periode Goal Setting yang disinkronkan dari Entomo." icon={CalendarClock} />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Cycle ID</th><th className="p-4">Cycle Name</th><th className="p-4">Start Date</th><th className="p-4">End Date</th><th className="p-4">Status</th><th className="p-4">Source</th><th className="p-4">Last Sync</th></tr>
          </thead>
          <tbody className="divide-y">
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <td className="p-4">{cycle.externalId}</td>
                <td className="p-4 font-semibold">{cycle.cycleName}</td>
                <td className="p-4">{formatDate(cycle.startDate)}</td>
                <td className="p-4">{formatDate(cycle.endDate)}</td>
                <td className="p-4"><Badge variant={cycle.status === "Active" ? "success" : "secondary"}>{cycle.status}</Badge></td>
                <td className="p-4">{cycle.source}</td>
                <td className="p-4">{formatDate(cycle.lastSync)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
