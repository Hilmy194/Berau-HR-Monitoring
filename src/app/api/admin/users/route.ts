import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLE } from "@/lib/roles";
import {
  createUserWithPermissions,
  listUsers,
} from "@/lib/services/user-management.service";

const createUserSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum([
    ROLE.SUPER_ADMIN,
    ROLE.HR_ADMIN,
    ROLE.MANAGER,
    ROLE.HR_USER,
    ROLE.NEW_HIRE,
  ]),
  allowedRoutes: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const payload = createUserSchema.safeParse(json);
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, role, allowedRoutes } = payload.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar di sistem" },
        { status: 409 }
      );
    }

    const newUser = await createUserWithPermissions({
      name,
      email: normalizedEmail,
      role,
      allowedRoutes,
    });

    return NextResponse.json({
      message: "Pengguna berhasil didaftarkan dengan password default 'password'",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mendaftarkan pengguna" },
      { status: 500 }
    );
  }
}
