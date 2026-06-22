import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload, removeUpload, UploadValidationError, type UploadKind } from "@/lib/upload";
import { logAudit } from "@/lib/services/audit.service";

/**
 * Employee document upload — replaces the URL-only fields on Profile with
 * real file storage for CV and photo (US-04).
 *
 * Accepts multipart/form-data with:
 *   - file:  the binary file
 *   - kind:  "cv" | "photo"
 *
 * Re-uploading replaces the previous file on disk so we don't accumulate
 * orphaned files when an employee corrects their data.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "");

    if (kind !== "cv" && kind !== "photo") {
      return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = await saveUpload(file, kind as UploadKind, session.user.id);

    // Replace previous file (if any) to avoid orphaned uploads on disk.
    const previousUrl = kind === "cv" ? profile.cvUrl : profile.photoUrl;
    if (previousUrl) {
      await removeUpload(previousUrl);
    }

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data:
        kind === "cv"
          ? { cvUrl: saved.url }
          : { photoUrl: saved.url },
    });

    await logAudit({
      action: "UPLOAD",
      entity: "Profile",
      entityId: profile.id,
      userId: session.user.id,
      details: `Uploaded ${kind} (${saved.originalName}, ${saved.size} bytes)`,
    });

    return NextResponse.json({
      success: true,
      kind,
      url: saved.url,
      originalName: saved.originalName,
      size: saved.size,
      profile: {
        cvUrl: updated.cvUrl,
        photoUrl: updated.photoUrl,
      },
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PROFILE_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Remove an uploaded document. Used when an employee wants to clear a CV or
 * photo without immediately replacing it.
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    if (kind !== "cv" && kind !== "photo") {
      return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const previousUrl = kind === "cv" ? profile.cvUrl : profile.photoUrl;
    if (previousUrl) {
      await removeUpload(previousUrl);
    }

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data:
        kind === "cv"
          ? { cvUrl: null }
          : { photoUrl: null },
    });

    await logAudit({
      action: "DELETE",
      entity: "Profile",
      entityId: profile.id,
      userId: session.user.id,
      details: `Removed ${kind}`,
    });

    return NextResponse.json({
      success: true,
      kind,
      profile: {
        cvUrl: updated.cvUrl,
        photoUrl: updated.photoUrl,
      },
    });
  } catch (error) {
    console.error("[PROFILE_DELETE_DOC_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
