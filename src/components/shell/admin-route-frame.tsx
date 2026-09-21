"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getWorkspaceForPath, HR_WORKSPACES } from "@/lib/workspaces";
import { ROLE } from "@/lib/roles";

interface AdminRouteFrameProps {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

export function AdminRouteFrame({ user, children }: AdminRouteFrameProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const filterItems = <T extends { href: string }>(items: readonly T[]) => {
    if (user.role === ROLE.HR_ADMIN) return items.filter((item) => !item.href.startsWith("/organization-development/goal-setting"));
    return [...items];
  };

  if (currentPath === "/admin") {
    return <>{children}</>;
  }

  const workspace = getWorkspaceForPath(currentPath);
  if (workspace) {
    return (
      <AppShell
        user={user}
        items={filterItems(workspace.navigation)}
        workspaceLabel={workspace.label}
        workspaceDescription={workspace.description}
      >
        {children}
      </AppShell>
    );
  }

  // /admin remains the admin-only workspace selector. The five operational
  // workspaces above are entirely driven by the shared catalogue.
  return <AppShell user={user} items={filterItems(HR_WORKSPACES.flatMap((workspace) => workspace.navigation))}>{children}</AppShell>;
}
