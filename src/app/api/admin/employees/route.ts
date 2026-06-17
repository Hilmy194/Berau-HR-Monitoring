import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { createEmployee } from "@/lib/services/employee.service";
import { employeeCreateSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const body = await req.json();
    const parsed = employeeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const user = await createEmployee(actorId, parsed.data);
    return NextResponse.json({ success: true, id: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("Unique")) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("[CREATE_EMPLOYEE_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
