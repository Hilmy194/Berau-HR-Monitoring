import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GraduationCap,
  Hourglass,
  LayoutDashboard,
  Lock,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ROLE, ROLE_LABELS } from "@/lib/roles";
import { IntegrationSyncCard } from "@/components/admin/integration-sync-card";
import {
  MENU_CATALOGUE,
  isRoutePermitted,
  isWorkspacePermitted,
} from "@/lib/menu-catalogue";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin Menu - Harmoni" };

const modules = [
  {
    id: "dashboard",
    eyebrow: "Executive Analytics",
    title: "Dashboard",
    pic: "Executive & All HR PIC",
    description:
      "Monitoring seluruh karyawan: demografi umur, jenis kelamin, posisi, status, serta analitik komprehensif seluruh modul HR.",
    href: "/dashboard-monitoring",
    icon: LayoutDashboard,
    number: "00",
  },
  {
    id: "onboarding",
    eyebrow: "Onboarding Transition",
    title: "Onboarding",
    pic: "Aditya Subagyanto",
    description:
      "Kelola Probation Monitoring: karyawan baru, task, coaching, presentation, dan kelulusan probation.",
    href: "/recruitment",
    icon: BriefcaseBusiness,
    number: "01",
  },
  {
    id: "od",
    eyebrow: "Org Architecture",
    title: "Organization Development",
    pic: "Anggi Rachmasari",
    description:
      "Struktur organisasi, required skills, dan job descriptions sebagai basis gap, mobility, dan IDP.",
    href: "/organization-development",
    icon: Network,
    number: "02",
  },
  {
    id: "talent",
    eyebrow: "People Growth",
    title: "Talent Management",
    pic: "Merita",
    description:
      "Pemetaan 12-Box, Succession Planning posisi kritikal, Development Program (MDP/EDP/BDP/XDP), dan AI Career Path.",
    href: "/talent",
    icon: UsersRound,
    number: "03",
  },
  {
    id: "learning",
    eyebrow: "Capability Building",
    title: "Learning & Development",
    pic: "Irwansyah",
    description:
      "Monitoring IDP 70-20-10, integrasi Katalog Pelatihan database, dan portal permohonan training karyawan.",
    href: "/learning",
    icon: GraduationCap,
    number: "04",
  },
  {
    id: "retire",
    eyebrow: "Workforce Transition",
    title: "Retirement",
    pic: "Yoga",
    description:
      "Monitoring karyawan mendekati usia pensiun (MPP), sisa masa kerja, dan alih pengetahuan suksesi.",
    href: "/retire",
    icon: Hourglass,
    number: "05",
  },
  {
    id: "goal-setting",
    eyebrow: "Performance & PAT",
    title: "Goal Setting",
    pic: "Super Admin & HROD",
    description:
      "Monitoring SMART goals karyawan, PAT achievement, goal library, siklus penilaian, dan sinkronisasi Entomo.",
    href: "/organization-development/goal-setting",
    icon: Target,
    number: "06",
  },
] as const;

export default async function AdminModuleSelectionPage() {
  const session = await requireAdmin();
  const firstName = session.user.name.split(" ")[0];
  const roleLabel = ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] ?? session.user.role;
  const isSuper = session.user.role === ROLE.SUPER_ADMIN;

  return (
    <main className="relative min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-slate-950 text-white flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/10 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:64px_64px]"
        />
      </div>

      {/* Slim Header */}
      <AdminHeader
        user={session.user}
        roleLabel={roleLabel}
        firstName={firstName}
        isSuper={isSuper}
      />

      {/* Main Content: Well-Spaced, Non-Cramped Single-Screen View */}
      <div className="relative mx-auto flex flex-1 w-full max-w-7xl flex-col justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-5.5 overflow-y-auto lg:overflow-hidden">
        {/* Top Command Bar with Proper Breathing Room */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 mb-3 sm:mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Welcome back, {firstName}
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Pilih ruang kerja<span className="text-primary"> Anda.</span>
              </h1>
              <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">
                — Seluruh modul SDM terintegrasi dalam satu pintu.
              </span>
            </div>
          </div>

          {isSuper && (
            <Button asChild size="sm" className="h-9 bg-purple-600/90 hover:bg-purple-600 text-white gap-2 text-xs font-semibold rounded-xl shadow-md shrink-0 px-3.5">
              <Link href="/admin/user-management">
                <ShieldCheck className="h-4 w-4" />
                <span>User Management &amp; Hak Akses</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Integration Sync Card */}
        <div className="shrink-0 mb-4 sm:mb-5">
          <IntegrationSyncCard />
        </div>

        {/* 7 Module Cards: Balanced 4x2 Grid on Desktop */}
        <div className="grid flex-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-fr content-center">
          {modules.map((module) => {
            const permitted = isWorkspacePermitted(
              module.id,
              session.user.role,
              session.user.allowedRoutes
            );
            const spanClasses = module.id === "dashboard" ? "md:col-span-2 lg:col-span-2" : "";

            if (!permitted) {
              return (
                <div
                  key={module.href}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-5 sm:p-5.5 opacity-45 select-none min-h-[172px] lg:max-h-[240px] ${spanClasses}`}
                >
                  <span className="pointer-events-none absolute -bottom-4 -right-1 text-5xl sm:text-6xl font-black text-white/[0.01]">
                    {module.number}
                  </span>

                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-500">
                      <module.icon className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <span className="flex h-5 items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 text-[9.5px] font-semibold text-amber-400">
                      <Lock className="h-2.5 w-2.5" /> Terkunci
                    </span>
                  </div>

                  <div className="relative py-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {module.number} / {module.eyebrow}
                    </p>
                    <h2 className="text-base font-bold tracking-tight text-slate-400 line-through decoration-slate-600 leading-snug">
                      {module.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      Akses modul ini terkunci untuk akun Anda. Hubungi Super Admin.
                    </p>
                  </div>

                  <div className="relative pt-1 border-t border-white/5 flex items-center">
                    {module.id === "retire" ? (
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-2.5 w-2.5" /> PIC:
                        </span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10 text-[9.5px]">BC: Yoga</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10 text-[9.5px]">MTL: Rizal</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 border border-white/10 text-[10px] text-slate-400">
                        <User className="h-2.5 w-2.5 text-slate-500" />
                        <span>PIC: {module.pic}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            const targetHref = (() => {
              if (isRoutePermitted(module.href, session.user.role, session.user.allowedRoutes)) {
                return module.href;
              }
              const ws = MENU_CATALOGUE.find((w) => w.id === module.id);
              const firstAllowed = ws?.submenus.find((s) =>
                isRoutePermitted(s.href, session.user.role, session.user.allowedRoutes)
              );
              return firstAllowed?.href ?? module.href;
            })();

            return (
              <Link
                key={module.href}
                href={targetHref}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-5.5 shadow-lg shadow-black/20 outline-none transition-all duration-200 hover:border-primary hover:bg-primary hover:shadow-[0_12px_36px_rgba(109,209,59,0.22)] focus-visible:border-primary focus-visible:bg-primary min-h-[172px] lg:max-h-[240px] ${spanClasses}`}
              >
                <span className="pointer-events-none absolute -bottom-4 -right-1 text-5xl sm:text-6xl font-black text-white/[0.025] transition-colors duration-200 group-hover:text-slate-950/[0.06]">
                  {module.number}
                </span>

                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-primary transition-colors duration-200 group-hover:border-slate-950/15 group-hover:bg-slate-950 group-hover:text-primary">
                    <module.icon className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-200 group-hover:rotate-12 group-hover:border-slate-950 group-hover:bg-slate-950 group-hover:text-white">
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>

                <div className="relative py-0.5">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-primary transition-colors duration-200 group-hover:text-slate-950/70">
                    {module.number} / {module.eyebrow}
                  </p>
                  <h2 className="text-base sm:text-[17px] font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-slate-950 leading-snug">
                    {module.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400 transition-colors duration-200 group-hover:text-slate-900/80 line-clamp-2">
                    {module.description}
                  </p>
                </div>

                <div className="relative pt-1 border-t border-white/5 group-hover:border-slate-950/10 flex items-center">
                  {module.id === "retire" ? (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="inline-flex items-center gap-1 font-semibold text-white/70 group-hover:text-slate-950/70">
                        <User className="h-2.5 w-2.5 text-primary group-hover:text-slate-950" />
                        PIC:
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 border border-white/15 font-semibold text-white group-hover:border-slate-950/20 group-hover:bg-slate-950/15 group-hover:text-slate-950 text-[9.5px]">
                        BC: Yoga
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 border border-white/15 font-semibold text-white group-hover:border-slate-950/20 group-hover:bg-slate-950/15 group-hover:text-slate-950 text-[9.5px]">
                        MTL: Rizal
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 border border-white/15 text-[10px] font-semibold text-white group-hover:border-slate-950/20 group-hover:bg-slate-950/15 group-hover:text-slate-950">
                      <User className="h-2.5 w-2.5 text-primary group-hover:text-slate-950" />
                      <span>PIC: {module.pic}</span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Compact Footer */}
        <footer className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/35 shrink-0 mt-2">
          <span className="inline-flex items-center gap-1.5">
            <Image src="/harmoni-logo.png" alt="" width={12} height={12} className="h-3 w-3 object-contain" aria-hidden="true" />
            Harmoni
          </span>
          <span>Human Resources Monitoring · PT Berau Coal</span>
        </footer>
      </div>
    </main>
  );
}
