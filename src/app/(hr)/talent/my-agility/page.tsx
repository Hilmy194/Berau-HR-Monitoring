import { Compass, Database, Users, UsersRound } from "lucide-react";
import { requireMyAgilityAccess } from "@/lib/session";
import { listMyAgilityMonitoringData } from "@/lib/services/my-agility.service";
import { MyAgilityDirectory } from "@/components/talent/my-agility-directory";

export const metadata = {
  title: "My Agility Monitoring - Harmoni",
  description:
    "Monitoring kelengkapan pengisian Career Aspiration MyAgility oleh karyawan dan review evaluasi oleh atasan.",
};

export default async function MyAgilityPage() {
  await requireMyAgilityAccess();
  const data = await listMyAgilityMonitoringData(2026);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
                <Compass className="h-4 w-4" /> My Agility Cycle • Career Aspiration &amp; Leader Review
              </p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                Tahun {data.year}
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              My Agility Monitoring
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Pemantauan progress kelengkapan pengisian form <strong>Career Aspiration (MyAgility)</strong> oleh karyawan (anak buah) serta status penyelesaian review oleh atasan/supervisor langsung.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-purple-400" />
                Data terintegrasi dari BigQuery: Career Aspiration &amp; 360 Leader Review
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                Dual Monitoring: Pantau dari sudut pandang Karyawan maupun Atasan
              </span>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{data.kpi.employeeFilledCount}</p>
                <p className="mt-1 text-xs text-white/55">Karyawan Sudah Isi</p>
              </div>
            </div>

            <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{data.kpi.employeeFilledRate}%</p>
                <p className="mt-1 text-xs text-white/55">Tingkat Kelengkapan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory & Dual Tab Component */}
      <MyAgilityDirectory data={data} />
    </div>
  );
}
