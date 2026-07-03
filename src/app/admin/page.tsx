import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardCheck,
  LayoutGrid,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Admin Menu - Berau Coal HR" };

const modules = [
  {
    eyebrow: "Probation",
    title: "Probation Monitoring",
    description:
      "Pantau masa probation, tugas, coaching, presentasi, dan laporan karyawan baru dalam satu ruang kerja.",
    href: "/admin/dashboard",
    icon: ClipboardCheck,
    number: "01",
  },
  {
    eyebrow: "People",
    title: "Talent Management",
    description:
      "Akses direktori talent, buka talent card per karyawan, dan siapkan area pengembangan SDM dalam satu workspace.",
    href: "/admin/employee-management",
    icon: UsersRound,
    number: "02",
  },
] as const;

export default async function AdminModuleSelectionPage() {
  const session = await requireAdmin();
  const firstName = session.user.name.split(" ")[0];

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
            <div className="flex items-center -space-x-2">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-950 bg-white p-1 shadow-lg sm:h-11 sm:w-11">
                <Image
                  src="/BERAU-LOGO.png"
                  alt="Berau Coal"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-950 bg-white p-1 shadow-lg sm:h-11 sm:w-11">
                <Image
                  src="/MTL-LOGO.png"
                  alt="MTL"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight sm:text-base">Berau Coal</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45 sm:text-[11px]">
                HR Digital Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 sm:pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-slate-950">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold">{session.user.name}</p>
              <p className="mt-0.5 text-[10px] text-white/45">HR Administrator</p>
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 sm:py-16 lg:py-20">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">
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

          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {modules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group relative flex min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/10 outline-none transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:shadow-[0_24px_70px_rgba(109,209,59,0.2)] focus-visible:-translate-y-1 focus-visible:border-primary focus-visible:bg-primary focus-visible:shadow-[0_0_0_4px_rgba(109,209,59,0.22)] sm:min-h-[20rem] sm:p-8"
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
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            HR Monitoring System
          </span>
          <span>Berau Coal · Human Resources</span>
        </footer>
      </div>
    </main>
  );
}
