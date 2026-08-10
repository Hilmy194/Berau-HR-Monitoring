import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit.service";

const reviewSchema = z.object({
  reviewStatus: z.enum(["PENDING", "APPROVED_AS_REFERENCE", "REJECTED", "NEEDS_REVISION"]),
  reviewerNotes: z.string().trim().max(1000).optional().default(""),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review AI tidak valid." }, { status: 400 });

  const { id } = await params;
  const rows = await prisma.$queryRaw<Array<{ id: string; reviewStatus: string; reviewerNotes: string | null }>>`
    UPDATE talent_ai_analyses
    SET "reviewStatus" = ${parsed.data.reviewStatus},
      "reviewerId" = ${guard.session.user.id},
      "reviewerNotes" = ${parsed.data.reviewerNotes},
      "updatedAt" = now()
    WHERE id = ${id}
    RETURNING id, "reviewStatus", "reviewerNotes"
  `;

  const analysis = rows[0];
  if (!analysis) return NextResponse.json({ error: "Analisis AI tidak ditemukan." }, { status: 404 });

  await logAudit({
    action: "TALENT_AI_REVIEW_UPDATED",
    entity: "TalentAiAnalysis",
    entityId: analysis.id,
    userId: guard.session.user.id,
    details: parsed.data.reviewStatus,
  });

  return NextResponse.json({
    id: analysis.id,
    reviewStatus: analysis.reviewStatus,
    reviewerNotes: analysis.reviewerNotes,
  });
}
