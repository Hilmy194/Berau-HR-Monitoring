import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { logAudit } from "@/lib/services/audit.service";

const reminderTypes = new Set(["PRESENTATION", "PIC_TASK"]);

export async function POST(req: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const profileId = typeof body.profileId === "string" ? body.profileId : "";
    const type = typeof body.type === "string" ? body.type : "";
    const channels = Array.isArray(body.channels)
      ? body.channels.filter((channel: unknown): channel is string => typeof channel === "string")
      : [];
    const recipients = Array.isArray(body.recipients)
      ? body.recipients.filter((recipient: unknown): recipient is string => typeof recipient === "string")
      : [];

    if (!profileId || !reminderTypes.has(type)) {
      return NextResponse.json({ error: "Invalid reminder request" }, { status: 400 });
    }

    await logAudit({
      action: "REMINDER_DISPATCH",
      entity: "Probation",
      entityId: profileId,
      userId: guard.session.user.id,
      details: `${type} reminder queued via ${channels.join(", ") || "Email, App account"} to ${recipients.join(", ") || "configured recipients"}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROBATION_REMINDER_ERROR]", error);
    return NextResponse.json({ error: "Failed to queue reminder" }, { status: 500 });
  }
}
