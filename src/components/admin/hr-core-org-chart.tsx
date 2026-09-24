"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, ChevronRight, CircleDot, Database, Loader2, Search, UsersRound } from "lucide-react";
import type { HrCoreOrgNode } from "@/lib/organization-forest";
import type { HrCorePosition, HrCoreBusinessUnit, HrCoreSnapshotSummary } from "@/lib/services/hr-core-organization.service";
import type { OrganizationStructureSource } from "@/lib/services/organization-structure.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type BreadcrumbItem = { code: string; name: string; depth: number };

export function HrCoreOrgChart({ roots, totalUnits, businessUnits, snapshot, source }: {
  roots: HrCoreOrgNode[]; totalUnits: number; businessUnits: HrCoreBusinessUnit[]; snapshot: HrCoreSnapshotSummary; source: OrganizationStructureSource;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HrCoreOrgNode | null>(roots[0] ?? null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [positions, setPositions] = useState<HrCorePosition[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const visibleRoots = useMemo(() => filterForest(roots, query), [roots, query]);
  const selectedBusinessUnit = businessUnits.find((unit) => unit.code === breadcrumb[0]?.code);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    const code = encodeURIComponent(selected.code);
    setDetailLoading(true);
    setDetailError(null);
    const sourceQuery = `?source=${encodeURIComponent(source)}`;
    Promise.all([
      fetch(`/api/organization-development/organization-tree/${code}/breadcrumb${sourceQuery}`, { signal: controller.signal }),
      fetch(`/api/organization-development/organization-tree/${code}/positions${sourceQuery}`, { signal: controller.signal }),
    ])
      .then(async ([breadcrumbResponse, positionsResponse]) => {
        if (!breadcrumbResponse.ok || !positionsResponse.ok) throw new Error("Detail unit tidak tersedia.");
        const [breadcrumbData, positionsData] = await Promise.all([
          breadcrumbResponse.json() as Promise<BreadcrumbItem[]>,
          positionsResponse.json() as Promise<HrCorePosition[]>,
        ]);
        if (controller.signal.aborted) return;
        setBreadcrumb(breadcrumbData);
        setPositions(positionsData);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDetailError(error instanceof Error ? error.message : "Detail unit tidak tersedia.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selected, source]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-slate-50/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><Boxes className="h-5 w-5 text-emerald-700" />Struktur organisasi</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{roots.length} akar · {totalUnits} org-unit aktif</p>
            </div>
            <label className="relative block sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Cari unit organisasi" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau kode unit" className="bg-white pl-9" />
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {visibleRoots.length ? (
            <div className="space-y-3">
              {visibleRoots.map((root) => (
                <OrgNode key={root.code} node={root} level={0} query={query} selectedCode={selected?.code} onSelect={setSelected} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{roots.length ? "Tidak ada unit yang cocok dengan pencarian." : "Belum ada Business Unit yang tersedia dalam scope role ini. Hubungi steward untuk onboarding BU."}</div>
          )}
        </CardContent>
      </Card>

      <aside className="h-fit xl:sticky xl:top-24">
        <Card>
          <CardHeader className="border-b bg-slate-950 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300">Detail Organisasi</p>
            <CardTitle className="mt-1 text-lg">{selected?.name ?? "Pilih org-unit"}</CardTitle>
            {selected ? <p className="font-mono text-xs text-slate-400">{selected.code}</p> : null}
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {detailLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Memuat breadcrumb dan posisi…</div>
            ) : detailError ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{detailError}</p>
            ) : selected ? (
              <>
                <section>
                  {selectedBusinessUnit ? <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{[selectedBusinessUnit.businessGrouping, selectedBusinessUnit.pillar].filter(Boolean).join(" · ") || selectedBusinessUnit.name}</p> : null}
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jalur organisasi</p>
                  <ol className="mt-3 space-y-2">
                    {breadcrumb.map((item, index) => (
                      <li key={item.code} className="flex items-start gap-2 text-xs">
                        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span><span className="font-semibold text-slate-800">{item.name}</span><span className="ml-1 font-mono text-slate-400">({item.code})</span>{index === breadcrumb.length - 1 ? <Badge variant="secondary" className="ml-2">Dipilih</Badge> : null}</span>
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="border-t pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><UsersRound className="h-4 w-4" />Kode posisi aktif</p>
                    <Badge variant="outline">{positions.length}</Badge>
                  </div>
                  {positions.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {positions.map((position) => <li key={`${position.positionCode}-${position.validFrom}-${position.validTo}`}><Badge variant="secondary" className="gap-1"><span className="font-mono">{position.positionCode}</span>{position.positionName ? <span>· {position.positionName}</span> : null}</Badge></li>)}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">Tidak ada posisi aktif pada unit ini.</p>
                  )}
                  <p className="mt-3 text-[11px] leading-5 text-slate-400">Pilih kode posisi untuk melihat informasi yang tersedia.</p>
                </section>
              </>
            ) : null}
          </CardContent>
        </Card>
        <div className="mt-3 flex gap-2 rounded-xl border bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span>Informasi struktur organisasi diperbarui sesuai jadwal sistem.<span className="mt-1 block">Pembaruan terakhir: {snapshot.lastLoad ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(snapshot.lastLoad)) + " WIB" : "belum tersedia"}.</span></span>
        </div>
      </aside>
    </div>
  );
}

function OrgNode({ node, level, query, selectedCode, onSelect }: {
  node: HrCoreOrgNode;
  level: number;
  query: string;
  selectedCode?: string;
  onSelect: (node: HrCoreOrgNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const row = (
    <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition ${selectedCode === node.code ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"}`}>
      {hasChildren ? <ChevronRight className="h-4 w-4 shrink-0 transition group-open/node:rotate-90" /> : <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />}
      <button type="button" onClick={() => onSelect(node)} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-slate-800">{node.name}</span>
        <span className="block truncate font-mono text-[10px] text-slate-400">{node.code} · depth {node.depth}</span>
      </button>
      {hasChildren ? <Badge variant="outline" className="shrink-0">{node.children.length}</Badge> : null}
    </div>
  );

  if (!hasChildren) return <div style={{ marginLeft: level === 0 ? 0 : 14 }}>{row}</div>;
  return (
    <details open={level === 0 || Boolean(query)} className="group/node" style={{ marginLeft: level === 0 ? 0 : 14 }}>
      <summary className="list-none">{row}</summary>
      <div className="mt-1 space-y-1 border-l border-slate-200 pl-1">
        {node.children.map((child) => <OrgNode key={child.code} node={child} level={level + 1} query={query} selectedCode={selectedCode} onSelect={onSelect} />)}
      </div>
    </details>
  );
}

function filterForest(nodes: HrCoreOrgNode[], query: string): HrCoreOrgNode[] {
  const needle = query.trim().toLocaleLowerCase("id-ID");
  if (!needle) return nodes;
  return nodes.flatMap((node) => {
    const children = filterForest(node.children, needle);
    const matches = node.code.toLocaleLowerCase("id-ID").includes(needle) || node.name.toLocaleLowerCase("id-ID").includes(needle);
    return matches || children.length ? [{ ...node, children }] : [];
  });
}
