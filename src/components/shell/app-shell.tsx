"use client";

import { Sidebar, type NavItem } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  user: { name: string; email: string; role: string };
  items: NavItem[];
  children: React.ReactNode;
}

export function AppShell({ user, items, children }: AppShellProps) {
  const isAdmin = user.role === "HR_ADMIN";
  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)]">
      <Sidebar items={items} isAdmin={isAdmin} />
      <div className="lg:pl-64">
        <Topbar user={user} items={items} />
        <main className="p-4 lg:p-8 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
