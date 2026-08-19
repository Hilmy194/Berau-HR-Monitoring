"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { MouseEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MenuSquare, UserCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { NavItem } from "./sidebar";
import { icons } from "./icons";

interface TopbarProps {
  user: { name: string; email: string; role: string };
  items: NavItem[];
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

export function Topbar({ user, items, onNavigate }: TopbarProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const current = items.find((i) => currentPath === i.href || currentPath.startsWith(i.href + "/"));
  const isAdmin = user.role === "HR_ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 lg:px-8">
      <div className="relative z-10 flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{current?.label ?? "Dashboard"}</h1>
      </div>

      {/* Mobile nav dropdown */}
      <div className="lg:hidden shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {(() => {
                const c = current;
                const Icon = c ? icons[c.icon] : icons.LayoutDashboard;
                return <Icon className="h-4 w-4" />;
              })()}
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {items.map((item) => {
              const Icon = icons[item.icon];
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.(item.href, event)} className="cursor-pointer">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-w-0 shrink-0 gap-2 overflow-hidden rounded-full px-2 hover:bg-accent/70 data-[state=open]:bg-accent/70"
              aria-label="Buka menu akun"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 sm:flex flex-col items-start leading-tight">
                <span className="max-w-[11rem] truncate text-sm font-medium">{user.name}</span>
                <span className="max-w-[11rem] truncate text-[11px] text-muted-foreground">
                  {isAdmin ? "HR Admin" : "New Hire"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin" onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.("/admin", event)} className="cursor-pointer">
                <MenuSquare className="h-4 w-4" /> Menu Admin
              </Link>
            </DropdownMenuItem>
          )}
          {!isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard" onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.("/dashboard", event)} className="cursor-pointer">
                <UserCircle className="h-4 w-4" /> My Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => void signOut({ callbackUrl: "/login", redirect: true })}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
