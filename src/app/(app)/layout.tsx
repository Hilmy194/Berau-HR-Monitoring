import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/app-shell";
import { NAV_ITEMS } from "@/lib/constants";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // HR admins should not access employee pages
  if (session.user.role === "HR_ADMIN") {
    redirect("/admin/dashboard");
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/profile/setup");

  return (
    <AppShell user={session.user} items={[...NAV_ITEMS.employee]}>
      {children}
    </AppShell>
  );
}
