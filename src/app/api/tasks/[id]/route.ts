import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { taskStatusUpdateSchema } from "@/lib/validations";
import { updateOwnTaskStatus } from "@/lib/services/task.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = taskStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const task = await updateOwnTaskStatus(session.user.id, id, parsed.data);
    return NextResponse.json({ success: true, id: task.id, status: task.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Task not found" ? 404 : message === "You can only update your own tasks" ? 403 : 500;
    console.error("[UPDATE_OWN_TASK_STATUS_ERROR]", err);
    return NextResponse.json({ error: message }, { status });
  }
}