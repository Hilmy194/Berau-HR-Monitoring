"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { getWorkspaceForPath, HR_WORKSPACES } from "@/lib/workspaces";
import { ROLE } from "@/lib/roles";
import { isRoutePermitted } from "@/lib/menu-catalogue";
import { Button } from "@/components/ui/button";

interface AdminRouteFrameProps {
  user: { name: string; email: string; role: string; allowedRoutes?: string[] | null };
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

  // Check if current route is permitted for this user
  const permitted = isRoutePermitted(currentPath, user.role, user.allowedRoutes);

  const workspace = getWorkspaceForPath(currentPath);
  const items = workspace
    ? filterItems(workspace.navigation)
    : filterItems(HR_WORKSPACES.flatMap((w) => w.navigation));

  return (
    <AppShell
      user={user}
      items={items}
      workspaceLabel={workspace?.label}
      workspaceDescription={workspace?.description}
    >
      {permitted ? (
        children
      ) : (
        <LockedPageFallback userEmail={user.email} path={currentPath} />
      )}
    </AppShell>
  );
}

function LockedPageFallback({ userEmail, path }: { userEmail: string; path: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Menu Ini Terkunci
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Akun Anda (<strong className="font-semibold text-slate-800">{userEmail}</strong>) tidak memiliki izin akses untuk membuka halaman <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">{path}</code>.
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 max-w-md text-left shadow-sm">
        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Hak akses menu dikelola secara khusus oleh <strong>Super Admin</strong>. Jika Anda membutuhkan akses ke menu ini, silakan hubungi administrator HR Anda.
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu Utama
          </Link>
        </Button>
      </div>
    </div>
  );
}
