"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, Loader2, LogOut, Settings, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  roleLabel: string;
  firstName: string;
  isSuper: boolean;
}

export function AdminHeader({ user, roleLabel, firstName, isSuper }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-8 sm:py-3.5 lg:px-12">
        {/* Left: Harmoni Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-52 items-center justify-center overflow-hidden rounded-2xl bg-white px-2 py-1 shadow-lg sm:h-16 sm:w-64 transition-transform hover:scale-[1.01]">
            <Image
              src="/harmoni-logo-with-script-fit.png"
              alt="Harmoni Human Resources Monitoring"
              width={288}
              height={100}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Right: User Profile Dropdown with Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User Profile Pill with Interactive Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-2.5 text-left transition-all hover:border-white/25 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary/40 sm:pr-3.5 cursor-pointer"
                aria-label="Menu akun pengguna"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-slate-950 shadow-sm">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  <p className="mt-0.5 text-[10px] text-white/50">{roleLabel}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/40 transition-transform duration-200" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuLabel className="font-normal pb-2">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-slate-950">
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                    <p className="text-xs font-semibold text-white truncate max-w-[180px]">{user.name}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal truncate">{user.email}</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-white/10" />

              {isSuper && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/user-management"
                    className="flex cursor-pointer items-center gap-2 text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/50 focus:bg-purple-950/50 focus:text-white"
                  >
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                    Manajemen Pengguna
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link
                  href="/account"
                  className="flex cursor-pointer items-center gap-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Pengaturan Akun
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10" />

              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex cursor-pointer items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 focus:bg-rose-950/40 focus:text-rose-300"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                ) : (
                  <LogOut className="h-4 w-4 text-rose-400" />
                )}
                <span>Keluar (Sign Out)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
