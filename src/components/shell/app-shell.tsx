"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "./sidebar";
import { Topbar } from "./topbar";
import { isAdmin } from "@/lib/roles";

interface AppShellProps {
  user: { name: string; email: string; role: string };
  items: readonly NavItem[];
  children: React.ReactNode;
  workspaceLabel?: string;
  workspaceDescription?: string;
}

export function AppShell({ user, items, children, workspaceLabel, workspaceDescription }: AppShellProps) {
  const adminUser = isAdmin(user.role);
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [currentPath]);

  function handleNavigate(href: string, event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (href !== currentPath) {
      setPendingHref(href);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)]">
      <Sidebar
        items={items}
        isAdmin={adminUser}
        workspaceLabel={workspaceLabel}
        workspaceDescription={workspaceDescription}
        pendingHref={pendingHref}
        onNavigate={handleNavigate}
      />
      <div className="lg:pl-64">
        <Topbar user={user} items={items} onNavigate={handleNavigate} />
        <main className="relative mx-auto max-w-[1400px] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
