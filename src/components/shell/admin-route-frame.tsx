"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { NAV_ITEMS } from "@/lib/constants";

interface AdminRouteFrameProps {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

export function AdminRouteFrame({ user, children }: AdminRouteFrameProps) {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/recruitment")
    || pathname.startsWith("/admin/dashboard")
    || pathname.startsWith("/admin/employees")
    || pathname.startsWith("/admin/tasks")
    || pathname.startsWith("/admin/presentations")
    || pathname.startsWith("/admin/coaching")
    || pathname.startsWith("/admin/reports")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.recruitment]}
        workspaceLabel="Onboarding"
        workspaceDescription="Probation monitoring & onboarding transition"
      >
        {children}
      </AppShell>
    );
  }

  if (pathname.startsWith("/organization-development")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.organizationDevelopment]}
        workspaceLabel="Organization Development"
        workspaceDescription="Structure, skills & job architecture"
      >
        {children}
      </AppShell>
    );
  }

  if (pathname.startsWith("/talent")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.talentModule]}
        workspaceLabel="Talent"
        workspaceDescription="Promotion, mobility, gap & talent cards"
      >
        {children}
      </AppShell>
    );
  }

  if (pathname.startsWith("/learning")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.learning]}
        workspaceLabel="Learning"
        workspaceDescription="IDP, training & development recommendation"
      >
        {children}
      </AppShell>
    );
  }

  if (pathname.startsWith("/retire")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.retire]}
        workspaceLabel="Retire"
        workspaceDescription="Retirement monitoring & workforce transition"
      >
        {children}
      </AppShell>
    );
  }

  const isTalentWorkspace = pathname.startsWith("/admin/employee-management")
    || pathname.startsWith("/admin/talent-development");

  if (isTalentWorkspace) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.talentModule]}
        workspaceLabel="Talent"
        workspaceDescription="Promotion, mobility, gap & talent cards"
      >
        {children}
      </AppShell>
    );
  }

  return <AppShell user={user} items={[...NAV_ITEMS.admin]}>{children}</AppShell>;
}
