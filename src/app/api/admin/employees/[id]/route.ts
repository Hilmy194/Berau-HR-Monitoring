import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { updateProfile, deleteProfile } from "@/lib/services/employee.service";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateProfile(actorId, id, body);
    return NextResponse.json({ success: true, id: updated.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[UPDATE_EMPLOYEE_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;
  const actorId = guard.session.user.id;

  try {
    const { id } = await params;
    await deleteProfile(actorId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE_EMPLOYEE_ERROR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertAdmin();
  if (error) return error;

  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { user: true, tasks: true, presentations: { include: { panelists: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}
