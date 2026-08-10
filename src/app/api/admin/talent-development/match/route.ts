import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/api-guard";
import { runTalentAiAnalysis } from "@/lib/services/talent-ai.service";

const requestSchema = z.object({
  targetPosition: z.string().trim().min(3).max(120),
  selectedCandidateIds: z.array(z.string()).optional(),
});

type LegacyComparisonResult = {
  comparisonSummary?: string;
  candidateInsights?: Array<{
    candidateRef: string;
    strengths: string[];
    gaps: string[];
    developmentRequirements: string[];
  }>;
};

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Jabatan tujuan tidak valid." }, { status: 400 });

  try {
    const analysis = await runTalentAiAnalysis({
      analysisType: "SUCCESSOR",
      targetPosition: parsed.data.targetPosition,
      selectedCandidateIds: parsed.data.selectedCandidateIds,
      requestedBy: guard.session.user.id,
    });
    const result = (analysis.result ?? {}) as LegacyComparisonResult;
    return NextResponse.json({
      mode: analysis.mode === "MOCK" ? "DETERMINISTIC" : "AI",
      model: analysis.model,
      summary: result.comparisonSummary,
      analysisId: analysis.id,
      reviewStatus: analysis.reviewStatus,
      candidates: result.candidateInsights?.map((candidate) => ({
        id: candidate.candidateRef,
        rationale: [candidate.strengths.join(", "), candidate.gaps.join(", ")].filter(Boolean).join(". "),
        strengths: candidate.strengths,
        skillGaps: candidate.gaps.map((gap) => ({
          skill: gap,
          currentLevel: "Belum tervalidasi",
          targetLevel: "Requirement target",
          gap,
          evidence: "Gap deterministik backend.",
          priority: "MEDIUM",
        })),
        idpActivities: candidate.developmentRequirements.map((item, index) => ({
          category: index % 3 === 0 ? "70_EXPERIENCE" : index % 3 === 1 ? "20_SOCIAL" : "10_FORMAL",
          title: item,
          action: item,
          closesSkillGap: candidate.gaps[0] ?? "Role readiness",
          owner: "HR dan atasan",
          period: "90 hari",
          successMetric: "Evidence disetujui atasan.",
        })),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analisis AI gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
