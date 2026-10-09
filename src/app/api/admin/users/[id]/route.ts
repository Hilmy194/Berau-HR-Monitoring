import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLE } from "@/lib/roles";
import { updateUserWithPermissions } from "@/lib/services/user-management.service";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z
    .enum([
      ROLE.SUPER_ADMIN,
      ROLE.HR_ADMIN,
      ROLE.MANAGER,
      ROLE.HR_USER,
      ROLE.NEW_HIRE,
    ])
    .optional(),
  allowedRoutes: z.array(z.string()).nullable().optional(),
  resetPassword: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const payload = updateUserSchema.safeParse(json);
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, role, allowedRoutes, resetPassword } = payload.data;

    // Check if email changed and is already taken
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim(), NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain" },
          { status: 409 }
        );
      }
    }

    const updatedUser = await updateUserWithPermissions(id, {
      name,
      email,
      role,
      allowedRoutes,
      resetPassword,
    });

    return NextResponse.json({
      message: resetPassword
        ? "Password berhasil di-reset ke 'password' dan data pengguna diperbarui"
        : "Data pengguna berhasil diperbarui",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengguna" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Anda tidak dapat menghapus akun Super Admin Anda sendiri yang sedang aktif" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
