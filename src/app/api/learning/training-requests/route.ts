import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEmployeeTrainingRequest,
  listEmployeeTrainingRequests,
} from "@/lib/services/training-catalog.service";
import { ROLE } from "@/lib/roles";

const createRequestSchema = z.object({
  catalogItemId: z.string().min(1, "Katalog training harus dipilih"),
  preAssessmentNotes: z.string().optional(),
  source: z.enum(["AI_RECOMMENDED", "LEADER_ASSIGNED", "EMPLOYEE_INITIATED"]).optional(),
  employeePersonnelNumber: z.string().optional(),
  employeeName: z.string().optional(),
  department: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeePersonnelNumberParam = searchParams.get("employeePersonnelNumber");

  let nikToQuery: string | undefined = employeePersonnelNumberParam || undefined;

  // Jika login sebagai role NEW_HIRE (karyawan), batasi hanya melihat miliknya sendiri kecuali jika admin/leader
  if (session.user.role === ROLE.NEW_HIRE) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    nikToQuery = profile?.nik || session.user.id;
  }

  try {
    const requests = await listEmployeeTrainingRequests(nikToQuery);
    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error("[TRAINING_REQUESTS_GET]", err);
    return NextResponse.json({ error: "Gagal memuat pengajuan training" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data pengajuan tidak valid." },
      { status: 400 }
    );
  }

  let employeePersonnelNumber = parsed.data.employeePersonnelNumber;
  let employeeName = parsed.data.employeeName;
  let department = parsed.data.department;

  // Jika diajukan langsung oleh user yang sedang login
  if (!employeePersonnelNumber) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    employeePersonnelNumber = profile?.nik && profile.nik !== "-" ? profile.nik : "ADM-01";
    employeeName = session.user.name || "Administrator";
    department = profile?.department || "Head Office";
  }

  try {
    const created = await createEmployeeTrainingRequest({
      employeePersonnelNumber: employeePersonnelNumber || "EMP-01",
      employeeName: employeeName || session.user.name || "Karyawan",
      department: department || "Operations & Mining",
      catalogItemId: parsed.data.catalogItemId,
      preAssessmentNotes: parsed.data.preAssessmentNotes,
      source: parsed.data.source || "EMPLOYEE_INITIATED",
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err: any) {
    console.error("[TRAINING_REQUESTS_POST]", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat pengajuan training." },
      { status: 500 }
    );
  }
}
