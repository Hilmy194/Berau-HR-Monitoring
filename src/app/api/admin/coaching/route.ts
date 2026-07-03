import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { coachingScheduleSchema } from "@/lib/validations";
import { createCoaching } from "@/lib/services/coaching.service";

export async function POST(req: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const body = await req.json();
    const { profileId, ...data } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Employee assignment is required" }, { status: 400 });
    }

    const parsed = coachingScheduleSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const coaching = await createCoaching(actorId, profileId, parsed.data);
    return NextResponse.json({ success: true, id: coaching.id }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_COACHING_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
