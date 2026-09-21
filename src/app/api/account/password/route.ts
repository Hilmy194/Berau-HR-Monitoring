import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan masuk kembali." }, { status: 401 });
  }

  try {
    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const currentPasswordIsValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!currentPasswordIsValid) {
      return NextResponse.json({ error: "Password lama tidak sesuai" }, { status: 400 });
    }

    const password = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password } }),
      prisma.auditLog.create({
        data: {
          action: "CHANGE_PASSWORD",
          entity: "User",
          entityId: user.id,
          userId: user.id,
          details: "User changed their account password.",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}
