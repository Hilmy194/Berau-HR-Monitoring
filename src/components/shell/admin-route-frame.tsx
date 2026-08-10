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
  const currentPath = pathname ?? "";

  if (currentPath === "/admin") {
    return <>{children}</>;
  }

  if (currentPath.startsWith("/recruitment")
    || currentPath.startsWith("/admin/dashboard")
    || currentPath.startsWith("/admin/employees")
    || currentPath.startsWith("/admin/tasks")
    || currentPath.startsWith("/admin/presentations")
    || currentPath.startsWith("/admin/coaching")
    || currentPath.startsWith("/admin/reports")) {
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

  if (currentPath.startsWith("/organization-development")) {
    return (
      <AppShell
        user={user}
        items={[...NAV_ITEMS.organizationDevelopment]}
        workspaceLabel="Organization Development"
        workspaceDescription="Structure, competencies & job architecture"
      >
        {children}
      </AppShell>
    );
  }

  if (currentPath.startsWith("/talent")) {
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

  if (currentPath.startsWith("/learning")) {
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

  if (currentPath.startsWith("/retire")) {
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

  const isTalentWorkspace = currentPath.startsWith("/admin/employee-management")
    || currentPath.startsWith("/admin/talent-development");

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
