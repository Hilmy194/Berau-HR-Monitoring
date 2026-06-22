import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSetupSchema } from "@/lib/validations";
import { getProbationEndDate } from "@/lib/services/probation.service";
import { logAudit } from "@/lib/services/audit.service";
import { createNewHireInductionTasks } from "@/lib/services/task.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    if (existing) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    const d = parsed.data;
    const joinDate = new Date(d.joinDate);
    const probationStart = joinDate;
    const probationEnd = getProbationEndDate(joinDate);

    const profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
        nik: d.nik,
        phone: d.phone,
        address: d.address,
        birthDate: new Date(d.birthDate),
        gender: d.gender,
        department: d.department,
        position: d.position,
        joinDate,
        supervisorName: d.supervisorName,
        cvUrl: d.cvUrl || null,
        photoUrl: d.photoUrl || null,
        emergencyContactName: d.emergencyContactName,
        emergencyContactPhone: d.emergencyContactPhone,
        probationStartDate: probationStart,
        probationEndDate: probationEnd,
        probationStatus: "ACTIVE",
      },
    });

    await logAudit({ action: "CREATE", entity: "Profile", entityId: profile.id, userId: session.user.id, details: "Profile setup completed" });
    await createNewHireInductionTasks(profile.id, joinDate, session.user.id);

    return NextResponse.json({ success: true, profileId: profile.id }, { status: 201 });
  } catch (error) {
    console.error("[PROFILE_SETUP_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
