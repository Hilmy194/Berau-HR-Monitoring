import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { updateTask, deleteTask } from "@/lib/services/task.service";
import { taskSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = taskSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const task = await updateTask(actorId, id, parsed.data);
    return NextResponse.json({ success: true, id: task.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[UPDATE_TASK_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    await deleteTask(actorId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE_TASK_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
