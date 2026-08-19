"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "./sidebar";
import { Topbar } from "./topbar";
import { WorkspaceLoading } from "./workspace-loading";

interface AppShellProps {
  user: { name: string; email: string; role: string };
  items: NavItem[];
  children: React.ReactNode;
  workspaceLabel?: string;
  workspaceDescription?: string;
}

export function AppShell({ user, items, children, workspaceLabel, workspaceDescription }: AppShellProps) {
  const isAdmin = user.role === "HR_ADMIN";
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
      {pendingHref && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/10">
          <div className="h-full w-1/3 animate-[loading-bar_1.15s_ease-in-out_infinite] rounded-r-full bg-primary" />
        </div>
      )}
      <Sidebar
        items={items}
        isAdmin={isAdmin}
        workspaceLabel={workspaceLabel}
        workspaceDescription={workspaceDescription}
        pendingHref={pendingHref}
        onNavigate={handleNavigate}
      />
      <div className="lg:pl-64">
        <Topbar user={user} items={items} onNavigate={handleNavigate} />
        <main className="relative mx-auto max-w-[1400px] p-4 lg:p-8">
          <div className={pendingHref ? "pointer-events-none opacity-35 transition-opacity duration-200" : "transition-opacity duration-200"}>
            {children}
          </div>
          {pendingHref && (
            <div className="absolute inset-x-4 top-4 z-20 lg:inset-x-8 lg:top-8">
              <div className="rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
                <WorkspaceLoading label="Membuka menu" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
