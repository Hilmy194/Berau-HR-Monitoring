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

  if (pathname === "/admin" || pathname.startsWith("/admin/employee-management")) {
    return <>{children}</>;
  }

  return <AppShell user={user} items={[...NAV_ITEMS.admin]}>{children}</AppShell>;
}