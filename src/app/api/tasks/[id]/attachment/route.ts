import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveUpload, removeUpload, UploadValidationError } from "@/lib/upload";
import { logAudit } from "@/lib/services/audit.service";

/**
 * Task attachment upload — lets an employee attach a deliverable file (PDF,
 * Office doc, image, …) to a probation task when HR has flagged
 * `requiresAttachment = true`.
 *
 * Ownership is verified against the authenticated user's profile so an
 * employee can only upload to their own tasks.
 *
 * Re-uploading replaces the previous file on disk to avoid orphans.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: { select: { id: true } } },
    });
    const profileId = user?.profile?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const task = await prisma.probationTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.userId !== profileId) {
      return NextResponse.json({ error: "You can only update your own tasks" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = await saveUpload(file, "task", profileId);

    if (task.attachmentUrl) {
      await removeUpload(task.attachmentUrl);
    }

    const updated = await prisma.probationTask.update({
      where: { id },
      data: {
        attachmentUrl: saved.url,
        attachmentName: saved.originalName,
      },
    });

    await logAudit({
      action: "UPLOAD",
      entity: "Task",
      entityId: id,
      userId: session.user.id,
      details: `Attached file "${saved.originalName}" to task "${task.title}"`,
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      attachmentUrl: updated.attachmentUrl,
      attachmentName: updated.attachmentName,
      originalName: saved.originalName,
      size: saved.size,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[TASK_ATTACHMENT_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Remove an employee-uploaded task attachment.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: { select: { id: true } } },
    });
    const profileId = user?.profile?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const task = await prisma.probationTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.userId !== profileId) {
      return NextResponse.json({ error: "You can only update your own tasks" }, { status: 403 });
    }

    if (task.attachmentUrl) {
      await removeUpload(task.attachmentUrl);
    }

    const updated = await prisma.probationTask.update({
      where: { id },
      data: { attachmentUrl: null, attachmentName: null },
    });

    await logAudit({
      action: "DELETE",
      entity: "Task",
      entityId: id,
      userId: session.user.id,
      details: `Removed attachment from task "${task.title}"`,
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      attachmentUrl: updated.attachmentUrl,
      attachmentName: updated.attachmentName,
    });
  } catch (error) {
    console.error("[TASK_ATTACHMENT_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
