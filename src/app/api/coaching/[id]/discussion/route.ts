import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/session";
import { coachingDiscussionSchema } from "@/lib/validations";
import { updateCoachingDiscussion } from "@/lib/services/coaching.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, profile } = await getCurrentProfile();

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = coachingDiscussionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const coaching = await updateCoachingDiscussion(session.user.id, profile.id, id, parsed.data);
    return NextResponse.json({ success: true, id: coaching.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[UPDATE_COACHING_DISCUSSION_ERROR]", err);
    return NextResponse.json({ error: message }, { status: message === "Coaching not found" ? 404 : 500 });
  }
}
