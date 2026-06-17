import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { removePanelist } from "@/lib/services/presentation.service";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; panelistId: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { panelistId } = await params;
    await removePanelist(actorId, panelistId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[REMOVE_PANELIST_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
