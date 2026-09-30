import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parsePromotionCsv,
  promotionTemplateCsv,
  PromotionImportValidationError,
} from "@/lib/promotion-import";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.TALENT)) {
    return NextResponse.json({ error: "Akses workspace Talent diperlukan." }, { status: 403 });
  }

  return new Response(promotionTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-promotion.csv"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.TALENT, "EDITOR")) {
    return NextResponse.json({ error: "Akses editor Talent diperlukan untuk upload." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Pilih file CSV yang akan di-upload." }, { status: 400 });
    }
    if (!file.name.toLocaleLowerCase("id-ID").endsWith(".csv")) {
      return NextResponse.json({ error: "Format file harus CSV. Gunakan template yang tersedia." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file harus lebih dari 0 dan maksimal 2 MB." }, { status: 400 });
    }

    const rows = parsePromotionCsv(await file.text());
    const importedAt = new Date();
    const uploader = session.user.name ?? session.user.email ?? session.user.id;
    const result = await prisma.$transaction(async (transaction) => {
      const removed = await transaction.talentPromotionRequest.deleteMany();
      const created = await transaction.talentPromotionRequest.createMany({
        data: rows.map((row) => ({
          ...row,
          sourceFile: file.name,
          sourceSheet: "Manual CSV Upload",
          importedAt,
          changedBy: session.user.id,
          changedByName: uploader,
          changedOn: importedAt,
        })),
      });
      await transaction.auditLog.create({
        data: {
          action: "REPLACE_PROMOTION_DATA",
          entity: "TalentPromotionRequest",
          userId: session.user.id,
          details: `Replaced ${removed.count} promotion rows with ${created.count} rows from ${file.name}`,
        },
      });
      return { removed: removed.count, imported: created.count };
    });

    revalidatePath("/talent/promotion");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof PromotionImportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PROMOTION_IMPORT_ERROR]", error);
    return NextResponse.json({ error: "Gagal mengimpor data promosi ke database." }, { status: 500 });
  }
}
