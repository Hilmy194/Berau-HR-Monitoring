import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { ROLE } from "@/lib/roles";
import {
  updateTrainingRequestStatus,
  getEmployeeTrainingRequestById,
} from "@/lib/services/training-catalog.service";
import {
  listEmployeeMaster,
  resolveEmployeeForSession,
} from "@/lib/services/hr-modules.service";

const patchSchema = z.object({
  status: z.enum(["APPROVED_BY_LEADER", "REJECTED_BY_LEADER"]),
  leaderNotes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetId = decodeURIComponent(id || "").trim();
  const item = await getEmployeeTrainingRequestById(targetId);
  if (!item) {
    return NextResponse.json(
      { error: "Pengajuan training tidak ditemukan" },
      { status: 404 }
    );
  }
  return NextResponse.json({ request: item });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetId = decodeURIComponent(id || "").trim();
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Status tidak valid" },
      { status: 400 }
    );
  }

  // Validasi Otoritas Approval:
  // Hanya Leader yang memiliki bawahan atau peran Manager di SO yang dapat menyetujui/menolak.
  // Dari sisi HR (HR Admin, HR User, Super Admin) hanya memiliki hak akses monitoring.
  const [allEmployeesMaster, existingItem] = await Promise.all([
    listEmployeeMaster(),
    getEmployeeTrainingRequestById(targetId),
  ]);

  if (!existingItem) {
    return NextResponse.json(
      { error: `Pengajuan training dengan ID "${targetId}" tidak ditemukan.` },
      { status: 404 }
    );
  }

  const userNameLower = (session.user.name || "").toLowerCase().trim();

  // Cari identitas user di SO
  const employeeInDakar = resolveEmployeeForSession(allEmployeesMaster, session.user, {
    allowFebriwiadiAlias: true,
  });

  const directSubordinates = allEmployeesMaster.filter((emp) => {
    const sup = (emp.supervisorName || "").toLowerCase().trim();
    if (!sup || sup === "-" || sup === "unknown") return false;
    if (employeeInDakar) {
      const empName = employeeInDakar.name.toLowerCase().trim();
      if (
        sup === empName ||
        sup.includes(empName) ||
        empName.includes(sup) ||
        empName.split(" ").some((p) => p.length >= 4 && sup.includes(p))
      ) {
        return true;
      }
    }
    if (userNameLower && userNameLower.length >= 4) {
      if (
        sup === userNameLower ||
        sup.includes(userNameLower) ||
        userNameLower.includes(sup) ||
        userNameLower.split(" ").some((p) => p.length >= 4 && sup.includes(p))
      ) {
        return true;
      }
    }
    return false;
  });

  const isLeader = directSubordinates.length > 0 || session.user.role === ROLE.MANAGER;

  if (!isLeader) {
    return NextResponse.json(
      {
        error:
          "Akses ditolak: Persetujuan pengajuan training hanya dapat dilakukan oleh Leader / Atasan Langsung. Dari sisi HR hanya memiliki wewenang monitoring.",
      },
      { status: 403 }
    );
  }

  const reviewerName = employeeInDakar?.name || session.user.name || "Leader / Atasan";

  try {
    const updated = await updateTrainingRequestStatus(
      targetId,
      parsed.data.status,
      parsed.data.leaderNotes,
      reviewerName
    );

    if (!updated) {
      return NextResponse.json(
        { error: `Pengajuan training dengan ID "${targetId}" tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: updated });
  } catch (err: any) {
    console.error("[TRAINING_REQUEST_PATCH]", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui status pengajuan" },
      { status: 500 }
    );
  }
}
