import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { addPanelist } from "@/lib/services/presentation.service";
import { panelistSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = panelistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const panelist = await addPanelist(actorId, id, parsed.data);
    return NextResponse.json({ success: true, id: panelist.id }, { status: 201 });
  } catch (err) {
    console.error("[ADD_PANELIST_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
