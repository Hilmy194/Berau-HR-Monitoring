import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { submitScore } from "@/lib/services/presentation.service";
import { scoreSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = scoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { score, remarks, recommendation } = parsed.data;
    const profile = await submitScore(actorId, id, { score, remarks, recommendation });
    return NextResponse.json({ success: true, probationStatus: profile.probationStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[SUBMIT_SCORE_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
