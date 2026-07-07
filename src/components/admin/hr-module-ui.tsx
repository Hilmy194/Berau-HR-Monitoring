import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ModuleHero({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 bg-emerald-400/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Icon className="h-4 w-4" /> {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
      </div>
    </section>
  );
}

export function ModuleMenuCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta?: string;
}) {
  return (
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {meta && <Badge variant="secondary">{meta}</Badge>}
        </div>
        <CardTitle className="pt-3 text-lg">{title}</CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href={href}>
            Buka menu <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DataSourceStrip({ sources }: { sources: readonly { name: string; scope: string; status: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Placeholder data source</CardTitle>
        <CardDescription>Disiapkan agar nanti bisa diganti connector API/SAP/HRIS tanpa mengubah UI utama.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div key={source.name} className="rounded-xl border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{source.name}</p>
              <Badge variant="outline">{source.status}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.scope}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">{message}</p>;
}
