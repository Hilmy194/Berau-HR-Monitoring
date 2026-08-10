import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/api-guard";
import { runTalentAiAnalysis } from "@/lib/services/talent-ai.service";

const requestSchema = z.object({
  analysisType: z.enum(["SKILL_GAP", "PROMOTION", "MOBILITY", "SUCCESSOR"]),
  employeeId: z.string().optional(),
  targetPosition: z.string().trim().min(2).max(140).optional(),
  selectedCandidateIds: z.array(z.string()).max(Number(process.env.AI_MAX_CANDIDATES ?? 5)).optional(),
});

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Request analisis AI tidak valid." }, { status: 400 });
  }

  try {
    const result = await runTalentAiAnalysis({
      ...parsed.data,
      requestedBy: guard.session.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analisis AI gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
