import { Database, LayoutGrid, Sparkles, Trophy, UsersRound } from "lucide-react";
import { requireTalentPoolAccess } from "@/lib/session";
import { listTalentPoolCandidates } from "@/lib/services/talent-pool.service";
import { TalentPoolDirectory } from "@/components/talent/talent-pool-directory";

export const metadata = {
  title: "Talent Pool (12 Grids) - Harmoni",
  description:
    "Pemetaan potensi talent berdasarkan metodologi People Review 4 Stream (12-Box Matrix).",
};

export default async function TalentPoolPage() {
  await requireTalentPoolAccess();
  const data = await listTalentPoolCandidates(2026);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                <LayoutGrid className="h-4 w-4" /> People Review 4 Stream • 12 Grids
              </p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Talent Year {data.year}
              </span>
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Super Admin Only
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Talent Pool
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Pemetaan potensi talent berdasarkan matriks 12 Grids (TechConnect GO WIN). Memonitor kandidat berpotensi tinggi dari data BigQuery, baik yang berada di dalam maupun di luar daftar 184 Talent Retention.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                Data terintegrasi dari BigQuery: PAT, Assessment &amp; 360 Review
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Interaktif: klik setiap box untuk memfilter kandidat
              </span>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{data.summary.totalCandidates.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white/55">Total Populasi 2026</p>
              </div>
            </div>

            <div className="flex min-w-[140px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {(data.summary.totalGlobalTalent + data.summary.totalTopTalent).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-white/55">Top &amp; Global Talent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 12-Box Grid + Filter Directory */}
      <TalentPoolDirectory
        initialCandidates={data.candidates}
        summary={data.summary}
        targetYear={data.year}
      />
    </div>
  );
}
