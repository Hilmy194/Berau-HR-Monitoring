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
  Info,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

type CandidateRanking = {
  rank: number;
  candidateRef: string;
  aiFitScore: number;
  readinessCategory: string;
  matchReasons: string[];
  criticalGaps: string[];
  risks: string[];
  developmentRequirements: string[];
  confidenceLevel: string;
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
    rankingMethod?: string;
    comparisonSummary?: string;
    candidateRanking?: CandidateRanking[];
    recommendedShortlist?: string[];
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
        <div className="flex shrink-0 flex-wrap gap-2">
          <AiInfoDialog analysisType={props.analysisType} />
          <Button onClick={analyze} disabled={loading} className="gap-2 text-slate-950">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Menganalisis..." : (props.buttonLabel ?? "Analisis dengan AI")}
          </Button>
        </div>
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

function AiInfoDialog({ analysisType }: { analysisType: AnalysisType }) {
  const isMobility = analysisType === "MOBILITY" || analysisType === "SUCCESSOR";
  const dataSources = isMobility
    ? [
      "Target position: posisi tujuan, job level, directorate, division, department, job description, responsibility, experience requirement, dan competency requirement.",
      "Person/candidate: posisi saat ini, level saat ini, organisasi, career history, project, certification, training, technical/behavioral competency, person qualification, performance, potential, readiness, strength/weakness, aspiration, dan supervisor notes.",
    ]
    : [
      "Current position: posisi yang sedang dijabat, job level, organisasi, job description, responsibility, required competency, required level, mandatory flag, dan priority/weight.",
      "Employee profile: current skill, behavioral skill, person qualification/current level, career history, project, certification, training, performance, assessment, strength/weakness, talent class, readiness signal, dan supervisor notes.",
    ];
  const outputs = isMobility
    ? [
      "Ranking kandidat, AI fit score, alasan kecocokan, critical gap, risiko, development need, recommended shortlist, confidence level, dan limitation.",
    ]
    : [
      "Readiness category, summary current gap, strengths, priority skill gaps, development recommendation, IDP 70-20-10, risks, missing information, confidence level, dan limitation.",
    ];
  const workflow = isMobility
    ? [
      "HR memilih target position.",
      "Sistem membentuk kelompok kandidat relevan dan membatasi shortlist.",
      "AI membandingkan data person dengan kebutuhan position.",
      "AI membuat ranking, fit score, alasan match, gap kritikal, risiko, dan development need.",
      "Hasil disimpan; context yang sama memakai hasil tersimpan tanpa hit AI ulang.",
    ]
    : [
      "HR memilih karyawan atau konteks current gap.",
      "Sistem membaca posisi saat ini dan requirement posisinya.",
      "Sistem membandingkan competency person vs requirement position.",
      "AI menjelaskan gap prioritas, risiko, missing information, dan IDP 70-20-10.",
      "Hasil disimpan; context yang sama memakai hasil tersimpan tanpa hit AI ulang.",
    ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
          <Info className="h-4 w-4" />
          Info AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Data dan Cara Kerja AI</DialogTitle>
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
  const candidates = result?.candidateRanking?.length
    ? [...result.candidateRanking].sort((a, b) => a.rank - b.rank)
    : [...(result?.candidateInsights ?? [])]
      .sort((a, b) => a.candidateRef.localeCompare(b.candidateRef))
      .map((candidate, index) => ({
        rank: index + 1,
        candidateRef: candidate.candidateRef,
        aiFitScore: candidateMetadata?.[candidate.candidateRef]?.fitScore ?? 0,
        readinessCategory: candidate.readinessCategory,
        matchReasons: candidate.strengths,
        criticalGaps: candidate.gaps,
        risks: candidate.risks,
        developmentRequirements: candidate.developmentRequirements,
        confidenceLevel: result?.confidenceLevel ?? "MEDIUM",
      }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle icon={Trophy} title="AI Ranking Kandidat" />
          {result?.confidenceLevel && <StatusBadge value={result.confidenceLevel} type="confidence" />}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Backend menyaring kandidat relevan terlebih dahulu. AI meranking shortlist berdasarkan evidence person-position, lalu hasilnya disimpan untuk dipakai ulang.</p>
        {result?.rankingMethod && <p className="mt-2 text-xs leading-5 text-muted-foreground">{result.rankingMethod}</p>}
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
                    {candidate.rank}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{metadata?.currentPosition ?? "Posisi saat ini belum tersedia"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-32">
                    <div className="mb-1 flex justify-between text-xs"><span>AI fit score</span><strong>{candidate.aiFitScore}%</strong></div>
                    <Progress value={candidate.aiFitScore} className="h-1.5" />
                  </div>
                  {typeof metadata?.fitScore === "number" && (
                    <div className="min-w-32">
                      <div className="mb-1 flex justify-between text-xs"><span>Baseline</span><strong>{metadata.fitScore}%</strong></div>
                      <Progress value={metadata.fitScore} className="h-1.5" />
                    </div>
                  )}
                  <StatusBadge value={candidate.readinessCategory} type="readiness" />
                </div>
              </div>
              <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                <CandidateField icon={CheckCircle2} title="Alasan Match" items={candidate.matchReasons} tone="positive" />
                <CandidateField icon={Target} title="Critical Gap" items={candidate.criticalGaps} tone="warning" />
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
