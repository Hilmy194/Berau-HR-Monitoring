import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GraduationCap,
  Hourglass,
  Lock,
  Network,
  ShieldCheck,
  Sparkles,
  User,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ROLE, ROLE_LABELS } from "@/lib/roles";
import { IntegrationSyncCard } from "@/components/admin/integration-sync-card";
import { isWorkspacePermitted } from "@/lib/menu-catalogue";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin Menu - Harmoni" };

const modules = [
  {
    id: "onboarding",
    eyebrow: "Onboarding Transition",
    title: "Onboarding",
    pic: "Aditya Subagyanto",
    description:
      "Kelola Probation Monitoring yang sudah ada: karyawan baru, task, coaching, presentation, dan report.",
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
    title: "Talent",
    pic: "Merita",
    description:
      "Promotion, development program, rotation, skill needs, Talent Dictionary, dan Talent Development berbasis employee post-probation.",
    href: "/talent",
    icon: UsersRound,
    number: "03",
  },
  {
    id: "learning",
    eyebrow: "Capability Building",
    title: "Learning",
    pic: "Irwansyah",
    description:
      "IDP dan rekomendasi pengembangan berupa coaching, assignment, certification, training, dan mentoring.",
    href: "/learning",
    icon: GraduationCap,
    number: "04",
  },
  {
    id: "retire",
    eyebrow: "Workforce Transition",
    title: "Retire",
    pic: "Yoga",
    description:
      "Monitoring employee mendekati usia pensiun, remaining time, dan status risiko retirement berdasarkan umur.",
    href: "/retire",
    icon: Hourglass,
    number: "05",
  },
] as const;

export default async function AdminModuleSelectionPage() {
  const session = await requireAdmin();
  const firstName = session.user.name.split(" ")[0];
  const roleLabel = ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] ?? session.user.role;
  const isSuper = session.user.role === ROLE.SUPER_ADMIN;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-primary/10 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:72px_72px]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white px-2 py-1 shadow-lg sm:h-20 sm:w-72">
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 sm:pr-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-slate-950">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold">{session.user.name}</p>
                <p className="mt-0.5 text-[10px] text-white/45">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8 sm:py-10 lg:py-12">
          <div className="mb-6 max-w-3xl sm:mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Welcome back, {firstName}
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Pilih ruang kerja
              <span className="text-primary"> Anda.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Semua kebutuhan pengelolaan SDM tersedia dalam satu workspace. Pilih modul untuk mulai bekerja.
            </p>
          </div>

          {/* Super Admin Special User Management Banner */}
          {isSuper && (
            <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white sm:text-base">
                    Panel Manajemen Pengguna &amp; Hak Akses Menu
                  </h2>
                  <p className="text-xs text-purple-200/70">
                    Daftarkan akun pengguna baru, atur role, dan tentukan akses spesifik menu &amp; submenu yang diizinkan.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white gap-2 font-medium">
                <Link href="/admin/user-management">
                  <ShieldCheck className="h-4 w-4" /> Buka User Management
                </Link>
              </Button>
            </div>
          )}

          <IntegrationSyncCard />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 lg:gap-6">
            {modules.map((module) => {
              const permitted = isWorkspacePermitted(
                module.id,
                session.user.role,
                session.user.allowedRoutes
              );

              if (!permitted) {
                return (
                  <div
                    key={module.href}
                    className="relative flex min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/5 bg-slate-900/40 p-6 opacity-45 select-none sm:min-h-[20rem] xl:min-h-[23rem]"
                  >
                    <span className="pointer-events-none absolute -bottom-20 -right-16 text-[13rem] font-black leading-none text-white/[0.01]">
                      {module.number}
                    </span>

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-slate-500 sm:h-16 sm:w-16">
                        <module.icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
                      </div>
                      <span className="flex h-8 items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 text-[11px] font-semibold text-amber-400">
                        <Lock className="h-3 w-3" /> Terkunci
                      </span>
                    </div>

                    <div className="relative mt-auto pt-10">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500 sm:text-xs">
                        {module.number} / {module.eyebrow}
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-400 sm:text-3xl line-through decoration-slate-600">
                        {module.title}
                      </h2>
                      <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
                        Akses modul ini terkunci untuk akun Anda. Hubungi Super Admin untuk membukanya.
                      </p>
                      <div className="mt-4 flex items-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 border border-white/10 text-[11px] font-semibold text-slate-400">
                          <User className="h-3 w-3 text-slate-500" />
                          <span>PIC: {module.pic}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group relative flex min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/10 outline-none transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:shadow-[0_24px_70px_rgba(109,209,59,0.2)] focus-visible:-translate-y-1 focus-visible:border-primary focus-visible:bg-primary focus-visible:shadow-[0_0_0_4px_rgba(109,209,59,0.22)] sm:min-h-[20rem] xl:min-h-[23rem]"
                >
                  <span className="pointer-events-none absolute -bottom-20 -right-16 text-[13rem] font-black leading-none text-white/[0.025] transition-colors duration-300 group-hover:text-slate-950/[0.05] group-focus-visible:text-slate-950/[0.05]">
                    {module.number}
                  </span>

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-primary transition-colors duration-300 group-hover:border-slate-950/10 group-hover:bg-slate-950 group-hover:text-primary group-focus-visible:border-slate-950/10 group-focus-visible:bg-slate-950 group-focus-visible:text-primary sm:h-16 sm:w-16">
                      <module.icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 group-hover:rotate-12 group-hover:border-slate-950 group-hover:bg-slate-950 group-hover:text-white group-focus-visible:rotate-12 group-focus-visible:border-slate-950 group-focus-visible:bg-slate-950 group-focus-visible:text-white">
                      <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="relative mt-auto pt-10">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-primary transition-colors duration-300 group-hover:text-slate-950/60 group-focus-visible:text-slate-950/60 sm:text-xs">
                      {module.number} / {module.eyebrow}
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-slate-950 group-focus-visible:text-slate-950 sm:text-3xl">
                      {module.title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-400 transition-colors duration-300 group-hover:text-slate-900/75 group-focus-visible:text-slate-900/75">
                      {module.description}
                    </p>

                    <div className="mt-4 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 border border-white/15 text-[11px] font-semibold text-white transition-colors duration-300 group-hover:border-slate-950/20 group-hover:bg-slate-950/15 group-hover:text-slate-950">
                        <User className="h-3 w-3 text-primary transition-colors duration-300 group-hover:text-slate-950" />
                        <span>PIC: {module.pic}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <Image src="/harmoni-logo.png" alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" aria-hidden="true" />
            Harmoni
          </span>
          <span>Human Resources Monitoring</span>
        </footer>
      </div>
    </main>
  );
}
