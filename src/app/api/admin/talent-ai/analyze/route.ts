import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import { runTalentAiAnalysis } from "@/lib/services/talent-ai.service";

const requestSchema = z.object({
  analysisType: z.enum(["SKILL_GAP", "PROMOTION", "MOBILITY", "SUCCESSOR", "CAREER_PATH"]),
  employeeId: z.string().optional(),
  targetPosition: z.string().trim().min(2).max(140).optional(),
  selectedCandidateIds: z.array(z.string()).max(Number(process.env.AI_MAX_CANDIDATES ?? 5)).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.TALENT, "EDITOR")) {
    return NextResponse.json({ error: "Akses editor Talent diperlukan." }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Request analisis AI tidak valid." }, { status: 400 });
  }

  try {
    const result = await runTalentAiAnalysis({
      ...parsed.data,
      requestedBy: session.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analisis AI gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
