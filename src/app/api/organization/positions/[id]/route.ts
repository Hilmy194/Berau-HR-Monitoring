import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: Check if newParentId would create a reporting cycle
async function wouldCreateCycle(positionId: string, newParentId: string): Promise<boolean> {
  if (positionId === newParentId) return true;

  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === positionId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const parent: { reportsToId: string | null } | null = await prisma.organizationPosition.findUnique({
      where: { id: currentId },
      select: { reportsToId: true },
    });
    currentId = parent?.reportsToId ?? null;
  }

  return false;
}

// PATCH update position
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  try {
    const existing = await prisma.organizationPosition.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Posisi tidak ditemukan." }, { status: 404 });
    }

    const body = await req.json();
    const {
      positionName,
      jobLevel,
      currentHolder,
      holderPersonnelNumber,
      reportsToId,
      departmentId,
      isActive,
    } = body;

    // Cycle check if reportsToId is being changed
    if (reportsToId && reportsToId !== existing.reportsToId) {
      const isCycle = await wouldCreateCycle(id, reportsToId);
      if (isCycle) {
        return NextResponse.json(
          { error: "Atasan yang dipilih tidak valid karena akan menyebabkan perulangan (cycle) dalam hierarki organisasi." },
          { status: 400 },
        );
      }
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (positionName !== undefined) dataToUpdate.positionName = String(positionName).trim();
    if (jobLevel !== undefined) dataToUpdate.jobLevel = String(jobLevel).trim();
    if (currentHolder !== undefined) dataToUpdate.currentHolder = currentHolder ? String(currentHolder).trim() : null;
    if (holderPersonnelNumber !== undefined) dataToUpdate.holderPersonnelNumber = holderPersonnelNumber ? String(holderPersonnelNumber).trim() : null;
    if (reportsToId !== undefined) dataToUpdate.reportsToId = reportsToId || null;
    if (departmentId !== undefined && departmentId) dataToUpdate.departmentId = departmentId;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.organizationPosition.update({
      where: { id },
      data: dataToUpdate,
      include: {
        department: {
          include: {
            division: {
              include: {
                directorate: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Data posisi berhasil diperbarui.",
      position: updated,
    });
  } catch (error) {
    console.error("[API_UPDATE_POSITION_ERROR]", error);
    return NextResponse.json({ error: "Gagal memperbarui posisi." }, { status: 500 });
  }
}

// DELETE deactivate position
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  try {
    const existing = await prisma.organizationPosition.findUnique({
      where: { id },
      select: { reportsToId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Posisi tidak ditemukan." }, { status: 404 });
    }

    // Move children to deleted position's parent so they don't get detached
    await prisma.organizationPosition.updateMany({
      where: { reportsToId: id },
      data: { reportsToId: existing.reportsToId },
    });

    // Deactivate
    await prisma.organizationPosition.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Posisi berhasil dinonaktifkan.",
    });
  } catch (error) {
    console.error("[API_DELETE_POSITION_ERROR]", error);
    return NextResponse.json({ error: "Gagal menonaktifkan posisi." }, { status: 500 });
  }
}
