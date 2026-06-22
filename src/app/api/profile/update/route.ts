import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileEditSchema } from "@/lib/validations";
import { logAudit } from "@/lib/services/audit.service";

/**
 * Employee self-edit endpoint.
 *
 * Allows a new hire to correct their own personal/employment/contact data
 * without HR involvement. Probation-sensitive fields (probation dates,
 * probation status) are deliberately NOT accepted here — the schema strips
 * them — so the 100-day timeline and final recommendation remain under HR
 * control.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = profileEditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const updated = await prisma.profile.update({
      where: { id: existing.id },
      data: {
        ...(d.nik !== undefined ? { nik: d.nik } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.address !== undefined ? { address: d.address } : {}),
        ...(d.birthDate !== undefined ? { birthDate: new Date(d.birthDate) } : {}),
        ...(d.gender !== undefined ? { gender: d.gender } : {}),
        ...(d.department !== undefined ? { department: d.department } : {}),
        ...(d.position !== undefined ? { position: d.position } : {}),
        ...(d.supervisorName !== undefined ? { supervisorName: d.supervisorName } : {}),
        ...(d.cvUrl !== undefined ? { cvUrl: d.cvUrl || null } : {}),
        ...(d.photoUrl !== undefined ? { photoUrl: d.photoUrl || null } : {}),
        ...(d.emergencyContactName !== undefined ? { emergencyContactName: d.emergencyContactName } : {}),
        ...(d.emergencyContactPhone !== undefined ? { emergencyContactPhone: d.emergencyContactPhone } : {}),
      },
    });

    await logAudit({
      action: "UPDATE",
      entity: "Profile",
      entityId: existing.id,
      userId: session.user.id,
      details: "Employee self-edited profile",
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
