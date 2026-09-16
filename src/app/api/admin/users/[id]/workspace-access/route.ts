import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { HR_WORKSPACES, WORKSPACE } from "@/lib/workspaces";

const bodySchema = z.object({
  workspace: z.enum([
    WORKSPACE.ONBOARDING,
    WORKSPACE.ORGANIZATION_DEVELOPMENT,
    WORKSPACE.TALENT,
    WORKSPACE.LEARNING,
    WORKSPACE.RETIRE,
  ]),
  accessLevel: z.enum(["VIEWER", "EDITOR", "ADMIN"]),
  isActive: z.boolean().default(true),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertAdmin();
  if (error) return error;
  const { id } = await params;

  const access = await prisma.userWorkspaceAccess.findMany({
    where: { userId: id },
    select: { workspace: true, accessLevel: true, isActive: true },
    orderBy: { workspace: "asc" },
  });
  return NextResponse.json({ availableWorkspaces: HR_WORKSPACES.map(({ key, label }) => ({ key, label })), access });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertAdmin();
  if (error) return error;
  const payload = bodySchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Invalid workspace access payload" }, { status: 400 });
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "NEW_HIRE") return NextResponse.json({ error: "New Hire is limited to the Probation workspace" }, { status: 422 });

  const access = await prisma.userWorkspaceAccess.upsert({
    where: { userId_workspace: { userId: id, workspace: payload.data.workspace } },
    create: { userId: id, ...payload.data },
    update: payload.data,
    select: { workspace: true, accessLevel: true, isActive: true },
  });
  return NextResponse.json({ access });
}
