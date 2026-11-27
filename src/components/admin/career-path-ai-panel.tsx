"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit, Info, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type CareerRecommendation = {
  rank: number;
  optionRef: string;
  targetPosition: string;
  pathType: string;
  aiFitScore: number;
  readiness: string;
  rationale: string;
  strengths: string[];
  gaps: string[];
  developmentActions: string[];
};

type CareerPathAnalysis = {
  id: string;
  mode: "AI" | "MOCK";
  provider: string;
  model: string;
  generatedAt: string | Date;
  cacheHit?: boolean;
  sanitizedError?: string | null;
  result?: {
    summary: string;
    recommendations: CareerRecommendation[];
    confidenceLevel: string;
    limitations: string[];
    requiresHumanReview: true;
  };
};

export type CareerTargetMetadata = {
  targetPositionId: string | null;
  targetPosition: string;
  targetPsLevel: string | null;
  targetLayer: string | null;
  targetDirectorate: string;
  targetDivision: string;
  targetDepartment: string;
};

export function CareerPathAiPanel({
  employeeId,
  initialAnalysis,
  targetCatalogMeta = [],
}: {
  employeeId: string;
  initialAnalysis?: unknown;
  targetCatalogMeta?: CareerTargetMetadata[];
}) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CareerPathAnalysis | null>(
    isCareerPathAnalysis(initialAnalysis) ? initialAnalysis : null
  );
  const [loading, setLoading] = useState(false);

  const metaByPosition = useMemo(() => {
    const map = new Map<string, CareerTargetMetadata>();
    for (const item of targetCatalogMeta) {
      map.set(normalizeKey(item.targetPosition), item);
    }
    return map;
  }, [targetCatalogMeta]);

  const recommendations = useMemo(() => {
    const list = analysis?.result?.recommendations ?? [];
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [analysis]);

  const nextRoleCount = recommendations.filter((item) => item.pathType === "NEXT_ROLE").length;
  const readyCount = recommendations.filter((item) => item.aiFitScore >= 85).length;
  const topGap = getTopGap(recommendations.flatMap((item) => item.gaps));

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/talent-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisType: "CAREER_PATH", employeeId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.error ?? "Career path AI gagal dibuat.");
        return;
      }
      setAnalysis(body);
      toast.success("Career path AI berhasil dibuat oleh Google Gemini.");
      router.refresh();
    } catch {
      toast.error("Career path AI gagal dibuat. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Career Options" value={recommendations.length} />
        <SummaryCard label="Next Role" value={nextRoleCount} />
        <SummaryCard label="Ready >= 85%" value={readyCount} />
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Teratas</p>
          <p className="mt-2 text-sm font-semibold">{topGap}</p>
        </div>
      </section>

      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
        <CardContent className="p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-emerald-700 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900">AI Career Path Copilot</h2>
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800">
                Google Gemini
              </Badge>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <CareerPathAiInfoDialog />
              <Button type="button" size="sm" onClick={generate} disabled={loading} className="h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-xs text-white">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {analysis ? "Generate Ulang (Gemini)" : "Generate dengan Gemini"}
              </Button>
            </div>
          </div>
          <p className="w-full text-xs leading-relaxed text-muted-foreground">
            Menyusun dan menilai opsi jalur karier secara penuh menggunakan Google Gemini AI berdasarkan 4 pilar evidence (training/sertifikasi, peran proyek, riwayat karier, dan kompetensi) terhadap posisi real PT Berau Coal. Hasil tidak mengubah keputusan HR secara otomatis.
          </p>

          {analysis?.result && (
            <div className="mt-3 space-y-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]">Google Gemini</Badge>
                <Badge variant="outline" className="text-[11px]">{analysis.model || "gemini-3.5-flash-lite"}</Badge>
                <Badge variant="outline" className="text-[11px]">Confidence {analysis.result.confidenceLevel}</Badge>
                {analysis.cacheHit && <Badge variant="secondary" className="text-[11px]">Cached</Badge>}
              </div>
              <p className="w-full text-xs leading-relaxed text-slate-700">{analysis.result.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!recommendations.length ? (
        <section className="rounded-xl border border-dashed bg-white px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
          Belum ada hasil analisis Career Path dari Google Gemini untuk employee ini. Klik tombol <span className="font-semibold text-emerald-700">Generate dengan Gemini</span> di atas untuk menyusun opsi jalur karier.
        </section>
      ) : (
        <>
          <TableShell>
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 w-14">Rank</th>
                  <th className="p-4 min-w-[180px]">Target Position</th>
                  <th className="p-4 min-w-[160px]">Path Type</th>
                  <th className="p-4 min-w-[200px]">Organization</th>
                  <th className="p-4 w-28">Fit Score</th>
                  <th className="p-4 min-w-[155px]">Readiness</th>
                  <th className="p-4 min-w-[230px]">Strength</th>
                  <th className="p-4 min-w-[230px]">Gap</th>
                  <th className="p-4 min-w-[280px]">Development Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recommendations.map((item) => {
                  const meta = metaByPosition.get(normalizeKey(item.targetPosition));
                  return (
                    <tr key={`${item.rank}-${item.optionRef}-row`} className="align-top">
                      <td className="p-4 font-bold text-slate-600">#{item.rank}</td>
                      <td className="p-4 font-medium text-slate-900">
                        {item.targetPosition}
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {meta ? `${meta.targetLayer ?? "-"}${meta.targetPsLevel ? ` · ${meta.targetPsLevel}` : ""}` : "Evaluasi AI"}
                        </p>
                        {meta?.targetPositionId && (
                          <Link
                            href={`/organization-development/job-descriptions?search=${encodeURIComponent(item.targetPosition)}`}
                            className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Lihat job description
                          </Link>
                        )}
                      </td>
                      <td className="p-4"><PathTypeTag pathType={item.pathType} /></td>
                      <td className="p-4 text-slate-700">
                        {meta?.targetDirectorate ?? "-"}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {meta ? `${meta.targetDivision}${meta.targetDepartment !== "-" && meta.targetDepartment !== "UNMAPPED" ? ` / ${meta.targetDepartment}` : ""}` : "-"}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="mb-1.5 font-semibold text-slate-900">{item.aiFitScore}%</p>
                        <Progress value={item.aiFitScore} />
                      </td>
                      <td className="p-4">
                        <Badge variant={readinessVariant(item.aiFitScore)} className="whitespace-nowrap rounded-md px-2.5 py-1">
                          {formatReadiness(item.readiness)}
                        </Badge>
                      </td>
                      <td className="p-4"><InsightTextList items={item.strengths} tone="emerald" /></td>
                      <td className="p-4"><InsightTextList items={item.gaps} tone="amber" /></td>
                      <td className="p-4 text-xs leading-relaxed text-slate-700">
                        <p>{item.rationale}</p>
                        {item.developmentActions.length > 0 && (
                          <ul className="mt-2 space-y-1 text-slate-600 list-disc pl-4">
                            {item.developmentActions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>

          {analysis?.result?.limitations?.length ? (
            <p className="text-xs text-muted-foreground">
              Human review wajib · {analysis.result.limitations.join(" · ")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PathTypeTag({ pathType }: { pathType: string }) {
  if (pathType === "NEXT_ROLE") {
    return (
      <span className="inline-flex flex-col rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold leading-tight text-emerald-800 whitespace-nowrap">
        <span>Promosi Vertikal</span>
        <span className="text-[11px] font-medium text-emerald-700">Next Role</span>
      </span>
    );
  }
  if (pathType === "LATERAL_ENRICHMENT") {
    return (
      <span className="inline-flex flex-col rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-tight text-blue-800 whitespace-nowrap">
        <span>Pengayaan Lateral</span>
        <span className="text-[11px] font-medium text-blue-700">Setara</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold leading-tight text-purple-800 whitespace-nowrap">
      <span>Jalur Jangka Panjang</span>
      <span className="text-[11px] font-medium text-purple-700">Step-up</span>
    </span>
  );
}

function InsightTextList({ items, tone }: { items: string[]; tone: "emerald" | "amber" }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">-</span>;
  const accent =
    tone === "emerald"
      ? "border-emerald-400 bg-emerald-50/40 text-slate-700"
      : "border-amber-400 bg-amber-50/40 text-slate-700";
  return (
    <ul className="space-y-1.5 text-xs leading-relaxed">
      {items.map((item, idx) => (
        <li key={idx} className={`rounded-r-md border-l-2 px-2.5 py-1 ${accent}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function readinessVariant(score: number): "secondary" | "warning" | "success" | "outline" {
  if (score >= 85) return "success";
  if (score >= 70) return "secondary";
  if (score >= 55) return "warning";
  return "outline";
}

function formatReadiness(value: string) {
  if (value === "READY_FOR_VALIDATION") return "Ready for validation";
  if (value === "READY_WITH_DEVELOPMENT") return "Ready with development";
  if (value === "BUILD_READINESS") return "Build readiness";
  if (value === "LONG_TERM_DEVELOPMENT") return "Long-term development";
  return value.toLocaleLowerCase("id-ID").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTopGap(gaps: string[]) {
  if (!gaps.length) return "Belum dianalisis AI";
  const counts = gaps.reduce<Record<string, number>>((acc, gap) => {
    acc[gap] = (acc[gap] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tidak ada gap kritikal";
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}

function CareerPathAiInfoDialog() {
  const dataSources = [
    "Katalog posisi real PT Berau Coal (`bq_raw.p_emps`): daftar jabatan aktif dengan level (`ps_level` & `layer` terpisah antara Manager 5A–5B vs Senior Manager 5C–5D), direktorat, divisi, departemen, dan sertifikasi wajib `S-HCT-04.01` (serta matriks kompetensi Excel OD bila tersedia).",
    "Profil & Talent Card employee: posisi & level saat ini, total masa kerja, masa jabatan saat ini, last promotion, career history, project assignments, sertifikasi, training/XDP, performance history (PAT), dan aspirasi karier.",
    "Prinsip Arah Karier (Setara atau Naik): AI memprioritaskan promosi vertikal 1 jenjang di atas posisi sekarang (`Next Role`) terlebih dahulu, diikuti posisi setara strategis atau step-up 2 jenjang. Dilarang keras merekomendasikan demosi.",
    "Full AI Scoring: Google Gemini mengevaluasi seluruh kecocokan, fit score, strength, gap, dan development action langsung dari evidence employee tanpa rumus deterministik kaku.",
  ];

  const outputs = [
    "Ringkasan kesiapan karier (summary), ranking Top 4–6 opsi posisi, path type (`Next Role` / `Lateral` / `Long Term`), dan `aiFitScore` (0–100%).",
    "Alasan kontekstual (`rationale`), bukti kekuatan (`strengths`), kesenjangan (`gaps`), rencana aksi pengembangan (`developmentActions`), confidence level, dan batasan analisis.",
  ];

  const workflow = [
    "HR membuka profil employee pada menu Career Path.",
    "Backend menyiapkan daftar posisi valid real dari database PT Berau Coal (tanpa demosi) beserta profil evidence employee.",
    "Google Gemini menganalisis kecocokan penuh terhadap 4 pilar evidence dan mengurutkan rekomendasi terbaik.",
    "Hasil AI disimpan di database (`talent_ai_analyses`) sebagai sumber utama tampilan halaman Career Path dan IDP Monitoring.",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-emerald-300 bg-white/80 text-emerald-950 hover:bg-emerald-50 hover:text-emerald-950">
          <Info className="h-3.5 w-3.5 text-emerald-700" />
          Info AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dasar Analisis Career Path (Full AI)</DialogTitle>
          <DialogDescription>
            Ringkasan data real yang dikirim ke Google Gemini dan hasil analisis yang ditampilkan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-6 text-slate-700">
          <InfoSection title="Data yang Diambil" items={dataSources} />
          <InfoSection title="Output AI" items={outputs} />
          <InfoSection title="Cara Kerja" items={workflow} ordered />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoSection({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-slate-500">{title}</h3>
      <List className={`mt-2 space-y-2 ${ordered ? "list-decimal" : "list-disc"} pl-5`}>
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </List>
    </div>
  );
}

function isCareerPathAnalysis(value: unknown): value is CareerPathAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<CareerPathAnalysis>;
  return Boolean(analysis.id && analysis.result && Array.isArray(analysis.result.recommendations));
}
