"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Database,
  GraduationCap,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type AnalysisType = "SKILL_GAP" | "PROMOTION" | "MOBILITY" | "SUCCESSOR";

type CandidateMetadata = {
  name: string;
  currentPosition?: string;
  department?: string;
  fitScore?: number;
};

type TalentAiPanelProps = {
  analysisType: AnalysisType;
  employeeId?: string;
  targetPosition?: string;
  selectedCandidateIds?: string[];
  candidateLabels?: Record<string, string>;
  candidateMetadata?: Record<string, CandidateMetadata>;
  buttonLabel?: string;
};

type SkillGap = {
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  evidenceSummary: string;
  whyItMatters: string;
};

type DevelopmentRecommendation = {
  type: string;
  title: string;
  description: string;
  relatedSkill: string;
  priority: string;
  suggestedDuration: string;
  expectedEvidence: string;
  reason: string;
};

type CandidateInsight = {
  candidateRef: string;
  readinessCategory: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  developmentRequirements: string[];
};

type InsightResult = {
  id: string;
  mode: "AI" | "MOCK";
  provider: string;
  model: string;
  generatedAt: string;
  reviewStatus: string;
  status: string;
  cacheHit?: boolean;
  sanitizedError?: string | null;
  result?: {
    readinessCategory?: string;
    confidenceLevel?: string;
    summary?: string;
    strengths?: string[];
    prioritySkillGaps?: SkillGap[];
    developmentRecommendations?: DevelopmentRecommendation[];
    idpPlan?: { seventy: string[]; twenty: string[]; ten: string[] };
    risks?: string[];
    missingInformation?: string[];
    limitations?: string[];
    comparisonSummary?: string;
    candidateInsights?: CandidateInsight[];
    commonGaps?: string[];
    differentiatedStrengths?: string[];
  };
};

export function TalentAiPanel(props: TalentAiPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/talent-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisType: props.analysisType,
          employeeId: props.employeeId,
          targetPosition: props.targetPosition,
          selectedCandidateIds: props.selectedCandidateIds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Analisis AI gagal.");
      setInsight(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analisis AI gagal.");
    } finally {
      setLoading(false);
    }
  }

  const result = insight?.result;
  const isMobility = props.analysisType === "MOBILITY" || props.analysisType === "SUCCESSOR";

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <BrainCircuit className="h-4 w-4" />
            AI Insight
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
            {isMobility
              ? "AI membandingkan konteks posisi dengan kandidat internal. Keputusan akhir tetap melalui review HR."
              : "AI membandingkan profil karyawan dengan kebutuhan posisi saat ini dan menyusun rancangan IDP."}
          </p>
        </div>
        <Button onClick={analyze} disabled={loading} className="shrink-0 gap-2 text-slate-950">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Menganalisis..." : (props.buttonLabel ?? "Analisis dengan AI")}
        </Button>
      </div>

      <div className="p-5">
        {error && <div className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!insight && !error && (
          <div className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
            <Database className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium text-slate-700">Konteks analisis sudah siap</p>
              <p className="mt-1">Tekan tombol untuk membuat analisis. Konteks yang sama akan memakai hasil tersimpan tanpa memanggil AI dua kali.</p>
            </div>
          </div>
        )}
        {insight && (
          <div className="space-y-6">
            <AnalysisMeta insight={insight} />
            {insight.sanitizedError && (
              <div className="flex gap-2 border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {insight.sanitizedError}
              </div>
            )}
            {isMobility ? (
              <MobilityResult result={result} candidateLabels={props.candidateLabels} candidateMetadata={props.candidateMetadata} />
            ) : (
              <CurrentGapResult result={result} />
            )}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Hasil AI adalah bahan pertimbangan. Sistem tidak mengubah status karyawan, mobility, promotion, successor, atau kompetensi tervalidasi.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisMeta({ insight }: { insight: InsightResult }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-4 text-xs text-muted-foreground">
      <Badge variant="secondary" className="uppercase">{insight.provider}</Badge>
      <span>{insight.model}</span>
      <span>{new Date(insight.generatedAt).toLocaleString("id-ID")}</span>
      <Badge variant="outline" className="gap-1.5">
        <Clock3 className="h-3 w-3" />
        {reviewStatusLabel(insight.reviewStatus)}
      </Badge>
      {insight.cacheHit && (
        <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
          <Database className="h-3 w-3" />
          Hasil tersimpan
        </Badge>
      )}
    </div>
  );
}

function MobilityResult({
  result,
  candidateLabels,
  candidateMetadata,
}: {
  result?: InsightResult["result"];
  candidateLabels?: Record<string, string>;
  candidateMetadata?: Record<string, CandidateMetadata>;
}) {
  const candidates = [...(result?.candidateInsights ?? [])].sort((a, b) => a.candidateRef.localeCompare(b.candidateRef));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle icon={Trophy} title="Ranking Kandidat" />
          {result?.confidenceLevel && <StatusBadge value={result.confidenceLevel} type="confidence" />}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Urutan mengikuti match score backend. AI menjelaskan evidence, gap, risiko, dan kebutuhan pengembangan setiap kandidat.</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{result?.comparisonSummary}</p>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate, index) => {
          const metadata = candidateMetadata?.[candidate.candidateRef];
          const name = metadata?.name ?? candidateLabels?.[candidate.candidateRef] ?? candidate.candidateRef;
          return (
            <article key={candidate.candidateRef} className="overflow-hidden rounded-lg border bg-white">
              <div className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? "bg-primary text-slate-950" : "bg-slate-200 text-slate-700"}`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{metadata?.currentPosition ?? "Posisi saat ini belum tersedia"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof metadata?.fitScore === "number" && (
                    <div className="min-w-32">
                      <div className="mb-1 flex justify-between text-xs"><span>Match score</span><strong>{metadata.fitScore}%</strong></div>
                      <Progress value={metadata.fitScore} className="h-1.5" />
                    </div>
                  )}
                  <StatusBadge value={candidate.readinessCategory} type="readiness" />
                </div>
              </div>
              <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                <CandidateField icon={CheckCircle2} title="Kekuatan" items={candidate.strengths} tone="positive" />
                <CandidateField icon={Target} title="Gap Utama" items={candidate.gaps} tone="warning" />
              </div>
              <div className="grid border-t divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                <CandidateField icon={GraduationCap} title="Kebutuhan Pengembangan" items={candidate.developmentRequirements} />
                <CandidateField icon={ShieldAlert} title="Risiko / Perhatian" items={candidate.risks} tone="muted" />
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 border-t pt-5 md:grid-cols-2">
        <CompactList title="Gap yang Sama" icon={Target} items={result?.commonGaps} />
        <CompactList title="Kekuatan Pembeda" icon={Trophy} items={result?.differentiatedStrengths} />
      </div>
      <CompactList title="Keterbatasan Analisis" icon={AlertTriangle} items={result?.limitations} muted />
    </div>
  );
}

function CurrentGapResult({ result }: { result?: InsightResult["result"] }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {result?.readinessCategory && <StatusBadge value={result.readinessCategory} type="readiness" />}
          {result?.confidenceLevel && <StatusBadge value={result.confidenceLevel} type="confidence" />}
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">Ringkasan Current Gap</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{result?.summary}</p>
      </div>

      <CompactList title="Kekuatan Teridentifikasi" icon={CheckCircle2} items={result?.strengths} />

      {!!result?.prioritySkillGaps?.length && (
        <div>
          <SectionTitle icon={Target} title="Gap Kompetensi Prioritas" />
          <div className="mt-3 divide-y border-y">
            {result.prioritySkillGaps.map((gap, index) => (
              <div key={`${gap.skillName}-${index}`} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-900">{index + 1}. {gap.skillName}</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">Saat ini S{gap.currentLevel}</Badge>
                    <span className="text-muted-foreground">ke</span>
                    <Badge variant="secondary">Kebutuhan S{gap.requiredLevel}</Badge>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Gap {gap.gap}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{gap.whyItMatters}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground"><strong>Evidence:</strong> {gap.evidenceSummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!result?.developmentRecommendations?.length && (
        <div>
          <SectionTitle icon={BriefcaseBusiness} title="Rekomendasi Pengembangan" />
          <div className="mt-3 divide-y border-y">
            {result.developmentRecommendations.map((item, index) => (
              <div key={`${item.title}-${index}`} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge value={item.priority} />
                  <Badge variant="outline">{developmentTypeLabel(item.type)}</Badge>
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.description || item.reason}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span><strong>Gap:</strong> {item.relatedSkill}</span>
                  <span><strong>Durasi:</strong> {item.suggestedDuration}</span>
                  <span><strong>Evidence hasil:</strong> {item.expectedEvidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.idpPlan && (
        <div>
          <SectionTitle icon={GraduationCap} title="Rancangan IDP 70-20-10" />
          <div className="mt-3 grid overflow-hidden rounded-lg border md:grid-cols-3 md:divide-x">
            <IdpColumn percentage="70%" title="Assignment / OJT" items={result.idpPlan.seventy} />
            <IdpColumn percentage="20%" title="Coaching / Mentoring" items={result.idpPlan.twenty} />
            <IdpColumn percentage="10%" title="Training / Certification" items={result.idpPlan.ten} />
          </div>
        </div>
      )}

      <div className="grid gap-5 border-t pt-5 md:grid-cols-2">
        <CompactList title="Risiko / Perhatian" icon={ShieldAlert} items={result?.risks} muted />
        <CompactList title="Informasi yang Belum Tersedia" icon={Database} items={result?.missingInformation} muted />
      </div>
      <CompactList title="Keterbatasan Analisis" icon={AlertTriangle} items={result?.limitations} muted />
    </div>
  );
}

function CandidateField({ icon: Icon, title, items, tone = "default" }: { icon: typeof Target; title: string; items: string[]; tone?: "default" | "positive" | "warning" | "muted" }) {
  const iconColor = tone === "positive" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-slate-500";
  return (
    <div className="min-w-0 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><Icon className={`h-4 w-4 ${iconColor}`} />{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-700">
        {items.length ? items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="text-slate-400">•</span><span>{item}</span></li>) : <li className="text-muted-foreground">Belum ada evidence yang cukup.</li>}
      </ul>
    </div>
  );
}

function IdpColumn({ percentage, title, items }: { percentage: string; title: string; items: string[] }) {
  return (
    <div className="min-w-0 p-4">
      <div className="flex items-center gap-2"><span className="text-xl font-bold text-emerald-700">{percentage}</span><span className="text-xs font-semibold uppercase text-slate-600">{title}</span></div>
      <ol className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
        {items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="font-semibold text-slate-400">{index + 1}.</span><span>{item}</span></li>)}
      </ol>
    </div>
  );
}

function CompactList({ title, icon: Icon, items, muted = false }: { title: string; icon: typeof Target; items?: string[]; muted?: boolean }) {
  if (!items?.length) return null;
  return (
    <div>
      <SectionTitle icon={Icon} title={title} />
      <ul className={`mt-3 space-y-2 text-sm leading-5 ${muted ? "text-slate-600" : "text-slate-700"}`}>
        {items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="text-slate-400">•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Target; title: string }) {
  return <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500"><Icon className="h-4 w-4 text-emerald-600" />{title}</h3>;
}

function StatusBadge({ value, type }: { value: string; type: "readiness" | "confidence" }) {
  const label = type === "readiness" ? readinessLabel(value) : `Confidence: ${confidenceLabel(value)}`;
  const className = value === "READY" || value === "HIGH"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : value === "NEEDS_DEVELOPMENT" || value === "LOW"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-blue-200 bg-blue-50 text-blue-700";
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function PriorityBadge({ value }: { value: string }) {
  const className = value === "HIGH" ? "bg-red-100 text-red-700" : value === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700";
  return <Badge className={`${className} hover:${className}`}>{value === "HIGH" ? "Prioritas Tinggi" : value === "MEDIUM" ? "Prioritas Sedang" : "Prioritas Rendah"}</Badge>;
}

function readinessLabel(value: string) {
  return ({
    READY: "Siap",
    READY_WITH_DEVELOPMENT: "Siap dengan Pengembangan",
    NEEDS_DEVELOPMENT: "Perlu Pengembangan",
    INSUFFICIENT_DATA: "Data Belum Cukup",
  } as Record<string, string>)[value] ?? value;
}

function confidenceLabel(value: string) {
  return ({ HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Rendah" } as Record<string, string>)[value] ?? value;
}

function reviewStatusLabel(value: string) {
  return ({
    PENDING: "Menunggu Review HR",
    APPROVED_AS_REFERENCE: "Disetujui sebagai Referensi",
    REJECTED: "Ditolak HR",
    NEEDS_REVISION: "Perlu Revisi",
  } as Record<string, string>)[value] ?? value;
}

function developmentTypeLabel(value: string) {
  return ({
    TRAINING: "Training",
    COACHING: "Coaching",
    PROJECT_ASSIGNMENT: "Project Assignment",
    CERTIFICATION: "Certification",
    MENTORING: "Mentoring",
  } as Record<string, string>)[value] ?? value;
}
