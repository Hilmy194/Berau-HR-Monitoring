"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { MouseEvent } from "react";
import { icons } from "./icons";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function Sidebar({
  items,
  isAdmin,
  workspaceLabel,
  workspaceDescription,
  pendingHref,
  onNavigate,
}: {
  items: NavItem[];
  isAdmin: boolean;
  workspaceLabel?: string;
  workspaceDescription?: string;
  pendingHref?: string | null;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[hsl(222.2,47.4%,11.2%)] text-white">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white overflow-hidden">
          <Image src="/harmoni-logo.png" alt="Harmoni logo" width={40} height={40} className="h-full w-full object-contain" />
        </div>
        <div className="leading-tight ml-1">
          <p className="text-sm font-bold">Harmoni</p>
          <p className="text-[11px] text-white/60">Human Resources Monitoring</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {workspaceLabel ?? (isAdmin ? "HR Workspace" : "My Probation")}
        </p>
        {items.map((item) => {
          const Icon = icons[item.icon] ?? icons.LayoutDashboard;
          const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
          const pending = pendingHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.(item.href, event)}
              aria-busy={pending}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                pending && !active && "bg-white/10 text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {pending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[11px] font-medium text-white/80">
            {workspaceLabel ?? (isAdmin ? "Harmoni Workspace" : "Probation Period")}
          </p>
          <p className="text-xs text-white/50">
            {workspaceDescription ?? (isAdmin ? "Employee & probation monitoring" : "100-day monitoring")}
          </p>
        </div>
      </div>
    </aside>
  );
}
