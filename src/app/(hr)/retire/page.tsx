import { BellRing, ClipboardList, Hourglass } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { listRetirementMonitoring } from "@/lib/services/hr-modules.service";

export const metadata = { title: "Retire - Harmoni" };

export default async function RetirePage() {
  const rows = await listRetirementMonitoring();
  const criticalCount = rows.filter((row) => row.retirementStatus === "Critical" || row.retirementStatus === "Overdue").length;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Retire"
        title="Retire Workspace"
        description="Pantau employee berdasarkan usia tertua, risiko approaching retirement, dan remaining time menuju default retirement age 55 tahun."
        icon={Hourglass}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleMenuCard
          title="Notifications"
          href="/retire/notifications"
          icon={BellRing}
          description="Notifikasi employee yang masuk window 5 tahun, critical 2 tahun, overdue, atau kontrak diperpanjang."
          meta={`${criticalCount} urgent`}
        />
        <ModuleMenuCard
          title="Retirement Monitoring"
          href="/retire/retirement-monitoring"
          icon={ClipboardList}
          description="List employee berdasarkan umur tertua dengan status Overdue, Critical, Warning, dan Normal."
          meta={`${criticalCount} critical`}
        />
      </section>
    </div>
  );
}
