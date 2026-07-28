import { BellRing, ClipboardCheck, FileBarChart, MessagesSquare, Presentation, UserRoundCheck } from "lucide-react";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { getAdminDashboardData } from "@/lib/services/probation.service";

export const metadata = { title: "Onboarding - Berau Coal HR" };

export default async function RecruitmentPage() {
  const data = await getAdminDashboardData();
  const menus = [
    { title: "Notifications", href: "/recruitment/notifications", icon: BellRing, description: "Reminder PIC untuk laptop, email, akun aplikasi, asset, dan task onboarding lain.", meta: "PIC" },
    { title: "Probation Monitoring", href: "/recruitment/probation-monitoring", icon: ClipboardCheck, description: "Dashboard probation existing: KPI, recent hires, upcoming presentations.", meta: `${data.cards.activeProbation} active` },
    { title: "Probation Employees", href: "/admin/employees", icon: UserRoundCheck, description: "Kelola data karyawan baru selama masa probation.", meta: `${data.cards.totalEmployees} hires` },
    { title: "Presentations", href: "/admin/presentations", icon: Presentation, description: "Jadwalkan dan nilai presentasi akhir probation.", meta: `${data.cards.upcomingPresentations} upcoming` },
    { title: "Coaching", href: "/admin/coaching", icon: MessagesSquare, description: "Catat coaching dan diskusi selama masa probation.", meta: "Active" },
    { title: "Reports", href: "/admin/reports", icon: FileBarChart, description: "Export laporan probation dan distribusi status.", meta: "Export" },
  ];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Onboarding"
        title="Onboarding & probation transition"
        description="Modul Onboarding menampung flow Probation Monitoring yang sudah ada, tanpa mengubah business flow existing."
        icon={ClipboardCheck}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => <ModuleMenuCard key={menu.href} {...menu} />)}
      </section>
    </div>
  );
}
