import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { coachingAdminUpdateSchema } from "@/lib/validations";
import { deleteCoaching, updateCoaching } from "@/lib/services/coaching.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = coachingAdminUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const coaching = await updateCoaching(actorId, id, parsed.data);
    return NextResponse.json({ success: true, id: coaching.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[UPDATE_COACHING_ERROR]", err);
    return NextResponse.json({ error: message }, { status: message === "Coaching not found" ? 404 : 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    await deleteCoaching(actorId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE_COACHING_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
