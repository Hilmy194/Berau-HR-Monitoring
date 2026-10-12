import { Database, ShieldCheck, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listTalentMonitoringEmployees } from "@/lib/services/talent-monitoring.service";
import { TalentMonitoringDirectory } from "@/components/admin/talent-monitoring-directory";

export const metadata = { title: "Talent Monitoring (Retention) - Harmoni" };

export default async function TalentMonitoringPage() {
  await requireAdmin();
  const employees = await listTalentMonitoringEmployees();

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" /> Talent Retention Management
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Talent Monitoring</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Monitoring data karyawan pada daftar <strong>Talent Retention List</strong>, pantau kelengkapan aspiration dan People Review, serta akses ke Talent Card.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Database className="h-3.5 w-3.5 text-primary" /> Terhubung dengan data profil karyawan dan Talent Dictionary.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-36 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{employees.length}</p>
                <p className="mt-1 text-xs text-white/55">Total Retention Talents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TalentMonitoringDirectory employees={employees} />
    </div>
  );
}
