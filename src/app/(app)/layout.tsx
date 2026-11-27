import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/app-shell";
import { NAV_ITEMS } from "@/lib/constants";
import { ROLE, canAccessBackoffice, getDefaultDestination, isAdmin } from "@/lib/roles";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Hanya redirect user backoffice non-admin (seperti HR_USER) yang tidak memiliki POV karyawan
  if (
    session.user.role !== ROLE.NEW_HIRE &&
    !isAdmin(session.user.role) &&
    canAccessBackoffice(session.user.role)
  ) {
    redirect(getDefaultDestination(session.user.role));
  }

  let profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (session.user.role === ROLE.SUPER_ADMIN) {
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          nik: "-",
          position: "Super Administrator",
          department: "IT & HR System Administration",
        },
      });
    } else if (
      profile.nik === "11000414" ||
      profile.department === "MINE PLANNING & TECH. SERVICES DIVISION" ||
      !profile.nik ||
      !profile.department
    ) {
      // Bersihkan profil dummy jika sebelumnya pernah ter-upsert otomatis
      profile = await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          nik: "-",
          position: "Super Administrator",
          department: "IT & HR System Administration",
        },
      });
    }
  }

  if (!profile && session.user.role === ROLE.NEW_HIRE) {
    redirect("/profile/setup");
  }

  const navItems = profile
    ? [...NAV_ITEMS.employee]
    : NAV_ITEMS.employee.filter((item) => item.href === "/trainings");

  return (
    <AppShell
      user={session.user}
      items={navItems}
      workspaceLabel={profile ? undefined : "Portal Karyawan"}
    >
      {children}
    </AppShell>
  );
}
