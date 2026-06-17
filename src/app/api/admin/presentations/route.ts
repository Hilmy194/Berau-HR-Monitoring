import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { createPresentation } from "@/lib/services/presentation.service";
import { presentationSchema } from "@/lib/validations";

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
    const parsed = presentationSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const presentation = await createPresentation(actorId, profileId, parsed.data);
    return NextResponse.json({ success: true, id: presentation.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    // Surface the one-presentation-per-employee business rule as a 409 conflict
    // so the UI can show the message rather than a generic 500.
    if (message.includes("already has a scheduled presentation")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error("[CREATE_PRESENTATION_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
