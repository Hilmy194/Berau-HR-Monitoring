"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icons } from "./icons";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function Sidebar({ items, isAdmin }: { items: NavItem[]; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[hsl(222.2,47.4%,11.2%)] text-white">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">HR Digital</p>
          <p className="text-[11px] text-white/60">Probation Monitoring</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {isAdmin ? "Administration" : "My Probation"}
        </p>
        {items.map((item) => {
          const Icon = icons[item.icon] ?? icons.LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[11px] font-medium text-white/80">Probation Period</p>
          <p className="text-xs text-white/50">100-day monitoring</p>
        </div>
      </div>
    </aside>
  );
}
