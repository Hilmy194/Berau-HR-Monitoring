import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload, UploadValidationError } from "@/lib/upload";
import { logAudit } from "@/lib/services/audit.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((file): file is File => Boolean(file) && typeof file !== "string");

    if (files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const records = [];
    for (const file of files) {
      const saved = await saveUpload(file, "competency", "competencies");
      const record = await prisma.competencyShareFile.create({
        data: {
          fileName: saved.fileName,
          originalName: saved.originalName,
          fileUrl: saved.url,
          fileSize: saved.size,
          mimeType: file.type || null,
          uploadedById: session.user.id,
          uploadedBy: session.user.name ?? session.user.email ?? null,
        },
      });

      records.push(record);

      await logAudit({
        action: "UPLOAD",
        entity: "CompetencyShareFile",
        entityId: record.id,
        userId: session.user.id,
        details: `Uploaded competency file (${saved.originalName}, ${saved.size} bytes)`,
      });
    }

    return NextResponse.json({
      success: true,
      files: records.map((record) => ({
        id: record.id,
        url: record.fileUrl,
        originalName: record.originalName,
        size: record.fileSize,
      })),
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[COMPETENCY_FILE_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


