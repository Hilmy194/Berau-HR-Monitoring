import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { createTask } from "@/lib/services/task.service";
import { taskSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const body = await req.json();
    const { profileId, ...taskData } = body;
    if (!profileId) {
      return NextResponse.json({ error: "Employee assignment is required" }, { status: 400 });
    }
    const parsed = taskSchema.safeParse(taskData);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const task = await createTask(actorId, profileId, parsed.data);
    return NextResponse.json({ success: true, id: task.id }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_TASK_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
