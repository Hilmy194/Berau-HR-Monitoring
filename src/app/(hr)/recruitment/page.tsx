import {
  BellRing,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Presentation,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";
import { requireAuth } from "@/lib/session";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { getAdminDashboardData } from "@/lib/services/probation.service";

export const metadata = { title: "Onboarding - Harmoni" };

export default async function RecruitmentPage() {
  const session = await requireAuth();
  const data = await getAdminDashboardData();
  const menus = [
    {
      title: "Dashboard",
      href: "/dashboard-monitoring/onboarding",
      icon: LayoutDashboard,
      description: "Summary probation, status reminder, channel notifikasi, dan timeline presentasi.",
      meta: `${data.cards.activeProbation} active`,
    },
    {
      title: "Rekrutmen",
      href: "/admin/recruitment",
      icon: UserPlus,
      description: "Monitoring pipeline proses rekrutmen calon karyawan, statistik per departemen, dan tahapan seleksi.",
      meta: "Pipeline",
    },
    {
      title: "Probation Employees",
      href: "/admin/employees",
      icon: UserRoundCheck,
      description: "Kelola data karyawan baru selama masa probation.",
      meta: `${data.cards.totalEmployees} hires`,
    },
    {
      title: "Presentation",
      href: "/admin/presentations",
      icon: Presentation,
      description: "Jadwalkan dan nilai presentasi akhir probation.",
      meta: `${data.cards.upcomingPresentations} upcoming`,
    },
    {
      title: "Task Management",
      href: "/admin/tasks",
      icon: ListChecks,
      description: "Kelola master task probation dan assignment untuk karyawan baru.",
      meta: "Tasks",
    },
    {
      title: "Coaching",
      href: "/admin/coaching",
      icon: MessagesSquare,
      description: "Catat coaching dan diskusi selama masa probation.",
      meta: "Active",
    },
    {
      title: "Notification",
      href: "/recruitment/notifications",
      icon: BellRing,
      description: "Reminder PIC untuk laptop, email, akun aplikasi, asset, dan task onboarding lain.",
      meta: "PIC",
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: FileBarChart,
      description: "Export laporan probation dan distribusi status.",
      meta: "Export",
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Onboarding"
        title="Onboarding & probation transition"
        description="Modul Onboarding menampung flow Probation Monitoring yang sudah ada, tanpa mengubah business flow existing."
        icon={ClipboardCheck}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menus.map((menu) => (
          <ModuleMenuCard
            key={menu.href}
            {...menu}
            isLocked={!isRoutePermitted(menu.href, session.user.role, session.user.allowedRoutes)}
          />
        ))}
      </section>
    </div>
  );
}
