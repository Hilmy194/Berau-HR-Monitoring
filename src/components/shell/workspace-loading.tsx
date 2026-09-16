import { Loader2 } from "lucide-react";

interface WorkspaceLoadingProps {
  label?: string;
}

export function WorkspaceLoading({ label = "Memuat halaman" }: WorkspaceLoadingProps) {
  return (
    <section className="flex min-h-[420px] items-center justify-center px-4" aria-label={label} aria-live="polite" aria-busy="true">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-white text-lg font-black text-emerald-700">
              H
            </div>
          </div>
        </div>
        <h2 className="mt-5 text-base font-bold text-slate-950">{label}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Mohon tunggu sebentar, sistem sedang menyiapkan data.</p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Harmoni
        </div>
      </div>
    </section>
  );
}
