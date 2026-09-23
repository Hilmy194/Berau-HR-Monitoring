"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, DatabaseZap, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SyncStatus = {
  status: "idle" | "running" | "success" | "failed";
  trigger: "manual" | "scheduled" | null;
  startedAt: string | null;
  finishedAt: string | null;
  schedule: { nextRunAt: string; daysRemaining: number };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function IntegrationSyncCard() {
  const [data, setData] = useState<SyncStatus | null>(null);
  const [starting, setStarting] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/admin/integration-sync", { cache: "no-store" });
    if (!response.ok) return;
    setData((await response.json()) as SyncStatus);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (data?.status !== "running") return;
    const timer = window.setInterval(() => void loadStatus(), 5_000);
    return () => window.clearInterval(timer);
  }, [data?.status, loadStatus]);

  async function startSync() {
    setStarting(true);
    try {
      const response = await fetch("/api/admin/integration-sync", { method: "POST" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Gagal memulai sinkronisasi.");
      toast.success(payload.message || "Sinkronisasi dimulai.");
      setData((current) => current ? { ...current, status: "running", trigger: "manual", startedAt: new Date().toISOString(), finishedAt: null } : current);
      window.setTimeout(() => void loadStatus(), 1_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memulai sinkronisasi.");
    } finally {
      setStarting(false);
    }
  }

  const running = data?.status === "running";
  const statusLabel = running
    ? "Sinkronisasi sedang berjalan"
    : data?.status === "success"
      ? "Sync terakhir berhasil"
      : data?.status === "failed"
        ? "Sync terakhir gagal"
        : "Belum ada riwayat sync";
  const StatusIcon = running ? Loader2 : data?.status === "failed" ? TriangleAlert : CheckCircle2;

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 shadow-xl shadow-black/10 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <DatabaseZap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="text-sm font-bold sm:text-base">Sinkronisasi BigQuery & HSE</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Data Integration</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                {data ? `${data.schedule.daysRemaining === 0 ? "Hari ini" : `${data.schedule.daysRemaining} hari lagi`} · ${formatDate(data.schedule.nextRunAt)} WIB` : "Memuat jadwal..."}
              </span>
              <span className={cn("inline-flex items-center gap-1.5", data?.status === "failed" && "text-red-300")}>
                <StatusIcon className={cn("h-4 w-4", running && "animate-spin")} aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
            {data?.finishedAt && !running && (
              <p className="mt-0.5 text-[11px] text-white/35">Selesai {formatDate(data.finishedAt)} WIB · {data.trigger === "manual" ? "manual" : "otomatis"}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          onClick={startSync}
          disabled={starting || running || !data}
          className="h-9 shrink-0 bg-primary px-4 text-xs font-bold text-slate-950 hover:bg-primary/90 disabled:opacity-60"
        >
          {starting || running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
          {running ? "Sedang sync..." : "Sync sekarang"}
        </Button>
      </div>
    </section>
  );
}
