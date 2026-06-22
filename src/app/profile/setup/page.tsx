import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "Profile Setup — Berau Coal" };

export default async function ProfileSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const existing = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)]">
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="leading-tight">
            <p className="text-sm font-bold">Berau Coal</p>
            <p className="text-[11px] text-muted-foreground">Profile Setup</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            100-day probation starts after setup
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {session.user.name.split(" ")[0]}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Complete your profile to activate your probation monitoring dashboard.
          </p>
        </div>

        <ProfileSetupForm defaults={{ name: session.user.name, email: session.user.email }} />
      </main>
    </div>
  );
}
