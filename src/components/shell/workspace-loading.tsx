import { Loader2 } from "lucide-react";

interface WorkspaceLoadingProps {
  label?: string;
}

export function WorkspaceLoading({ label = "Memuat halaman" }: WorkspaceLoadingProps) {
  return (
    <section className="space-y-5" aria-label={label} aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-7 w-52 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          <span className="truncate">{label}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-5 h-4 w-20 animate-pulse rounded-md bg-muted" />
            <div className="mb-3 h-8 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div className="h-4 animate-pulse rounded-md bg-muted" />
              <div className="h-4 animate-pulse rounded-md bg-muted" />
              <div className="h-4 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
