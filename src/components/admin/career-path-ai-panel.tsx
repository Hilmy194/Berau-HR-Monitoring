"use client";

import { useState } from "react";
import { BrainCircuit, Info, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
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

export function CareerPathAiPanel({ employeeId, initialAnalysis }: { employeeId: string; initialAnalysis?: unknown }) {
  const [analysis, setAnalysis] = useState<CareerPathAnalysis | null>(isCareerPathAnalysis(initialAnalysis) ? initialAnalysis : null);
  const [loading, setLoading] = useState(false);

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
      toast.success("Career path AI berhasil dibuat.");
    } catch {
      toast.error("Career path AI gagal dibuat. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-emerald-700" /><h2 className="font-bold">AI Career Path Copilot</h2></div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Meranking opsi posisi berdasarkan profil BQ, evidence talent, dan katalog posisi. Hasil tidak mengubah keputusan HR secara otomatis.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CareerPathAiInfoDialog />
            <Button type="button" onClick={generate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analysis ? "Generate Ulang" : "Generate dengan AI"}
            </Button>
          </div>
        </div>

        {analysis?.result && (
          <div className="mt-5 space-y-4 border-t pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{analysis.mode}</Badge><Badge variant="outline">Confidence {analysis.result.confidenceLevel}</Badge>
              {analysis.cacheHit && <Badge variant="secondary">Cached</Badge>}
            </div>
            <p className="text-sm leading-6 text-slate-700">{analysis.result.summary}</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {analysis.result.recommendations.map((item) => (
                <article key={item.optionRef} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-emerald-700">#{item.rank} · {formatLabel(item.pathType)}</p><h3 className="mt-1 font-bold">{item.targetPosition}</h3></div><Badge variant="secondary">{item.aiFitScore}%</Badge></div>
                  <Progress value={item.aiFitScore} className="mt-3" />
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.rationale}</p>
                  <p className="mt-3 text-xs font-semibold">Gap: <span className="font-normal text-muted-foreground">{item.gaps.join(", ") || "Validasi lanjutan"}</span></p>
                  <p className="mt-2 text-xs font-semibold">Action: <span className="font-normal text-muted-foreground">{item.developmentActions.join(" · ")}</span></p>
                </article>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Human review wajib · {analysis.result.limitations.join(" · ")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CareerPathAiInfoDialog() {
  const dataSources = [
    "Target & katalog posisi: posisi tujuan, job level, direktorat, divisi, departemen, path stage (lateral, next role, vertical), transition type, dan competency requirements.",
    "Profil & Talent Card employee: posisi saat ini, level saat ini, organisasi, total masa kerja, masa di posisi saat ini, last promotion, career history, project assignments, certifications, training/XDP, technical & behavioral competency, performance history, assessment, dan aspirasi karier.",
    "Struktur organisasi resmi: integrasi officialOrganization HR Core berdasarkan positionCode untuk memetakan jalur suksesi dan hierarki posisi yang valid.",
  ];

  const outputs = [
    "Ringkasan rekomendasi jalur karier (summary), perankingan opsi posisi (#1, #2, dst.), dan skor kecocokan AI (aiFitScore 0–100%).",
    "Rasional kecocokan (rationale), kesenjangan kompetensi/persyaratan yang perlu dipenuhi (critical gaps), rekomendasi aksi pengembangan konkret (development actions), confidence level, dan batasan analisis (limitations).",
  ];

  const workflow = [
    "HR membuka profil employee pada menu Career Path.",
    "Backend menyiapkan dan membatasi daftar opsi posisi yang realistis dari katalog organisasi.",
    "AI mengevaluasi kesesuaian rekam jejak, masa kerja, performa, dan kompetensi employee terhadap setiap opsi posisi.",
    "AI meranking jalur yang paling feasible dan menyusun rekomendasi tindakan pengembangan yang terarah.",
    "Hasil disimpan; konteks yang sama akan memakai hasil tersimpan tanpa memanggil AI ulang.",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 border-emerald-300 bg-white/80 text-emerald-950 hover:bg-emerald-50 hover:text-emerald-950">
          <Info className="h-4 w-4 text-emerald-700" />
          Info AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dasar Analisis Career Path</DialogTitle>
          <DialogDescription>
            Ringkasan data yang dipakai AI dan hasil yang ditampilkan pada menu ini.
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

function formatLabel(value: string) {
  return value.toLocaleLowerCase("id-ID").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isCareerPathAnalysis(value: unknown): value is CareerPathAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<CareerPathAnalysis>;
  return Boolean(analysis.id && analysis.result && Array.isArray(analysis.result.recommendations));
}
