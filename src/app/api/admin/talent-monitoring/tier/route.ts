import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { ROLE } from "@/lib/roles";
import { upsertTalentRetentionTierHistory } from "@/lib/services/talent-monitoring.service";

const tierUpdateSchema = z.object({
  talentKey: z.string().min(1).optional().nullable(),
  employeeName: z.string().min(1, "Nama karyawan wajib diisi"),
  personnelNumber: z.string().nullable().optional(),
  year: z.number().int().min(2020).max(2100),
  tier: z.string().min(1, "Tier wajib dipilih").max(32),
  notes: z.string().max(300).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = tierUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload tidak valid" },
        { status: 400 }
      );
    }

    await upsertTalentRetentionTierHistory(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed updating talent retention tier history:", error);
    return NextResponse.json({ error: "Gagal menyimpan riwayat tier" }, { status: 500 });
  }
}
