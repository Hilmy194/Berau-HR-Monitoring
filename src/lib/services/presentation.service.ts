import { prisma } from "@/lib/prisma";
import { logAudit } from "./audit.service";
import { applyFinalResult } from "./employee.service";
import type { PresentationInput, PanelistInput } from "@/lib/validations";

/**
 * Presentation & panelist management service.
 *
 * Every mutating function takes an `actorId` (the HR admin's user id) so the
 * audit log records who performed the action.
 */

export async function listPresentations(filters?: { profileId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  // NOTE: Presentation.userId actually stores the Profile id (see schema).
  if (filters?.profileId) where.userId = filters.profileId;
  if (filters?.status) where.resultStatus = filters.status;
  return prisma.presentation.findMany({
    where,
    include: { profile: { include: { user: true } }, panelists: true },
    orderBy: { presentationDate: "asc" },
  });
}

export async function getPresentationsForProfile(profileId: string) {
  return prisma.presentation.findMany({
    where: { userId: profileId },
    include: { panelists: true },
    orderBy: { presentationDate: "asc" },
  });
}

export async function createPresentation(actorId: string, profileId: string, input: PresentationInput) {
  // Business rule: one probation presentation per employee. Without this check
  // the schema would happily allow duplicates, but the admin employee-detail
  // page only ever renders the first one (profile.presentations[0]).
  const existing = await prisma.presentation.findFirst({ where: { userId: profileId } });
  if (existing) {
    throw new Error("This employee already has a scheduled presentation. Edit the existing one instead.");
  }

  const presentation = await prisma.presentation.create({
    data: {
      userId: profileId,
      presentationDate: new Date(input.presentationDate),
      presentationTime: input.presentationTime,
      location: input.location,
      meetingLink: input.meetingLink || null,
      score: input.score,
      remarks: input.remarks ?? "",
      resultStatus: input.resultStatus,
    },
    include: { panelists: true },
  });
  await logAudit({ action: "CREATE", entity: "Presentation", entityId: presentation.id, userId: actorId, details: `Created presentation` });
  return presentation;
}

export async function updatePresentation(actorId: string, presentationId: string, input: Partial<PresentationInput>) {
  const existing = await prisma.presentation.findUnique({ where: { id: presentationId } });
  if (!existing) throw new Error("Presentation not found");

  // Intentionally DO NOT accept score/remarks/resultStatus through this path.
  // Those fields must flow through submitScore() so the probation-status side
  // effects (and audit trail) stay consistent. Strip them defensively in case
  // a caller passes a full PresentationInput.
  const updated = await prisma.presentation.update({
    where: { id: presentationId },
    data: {
      ...(input.presentationDate !== undefined ? { presentationDate: new Date(input.presentationDate) } : {}),
      ...(input.presentationTime !== undefined ? { presentationTime: input.presentationTime } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.meetingLink !== undefined ? { meetingLink: input.meetingLink || null } : {}),
    },
    include: { panelists: true, profile: true },
  });
  await logAudit({ action: "UPDATE", entity: "Presentation", entityId: presentationId, userId: actorId, details: `Updated presentation` });
  return updated;
}

export async function deletePresentation(actorId: string, presentationId: string) {
  await prisma.presentation.delete({ where: { id: presentationId } });
  await logAudit({ action: "DELETE", entity: "Presentation", entityId: presentationId, userId: actorId, details: `Deleted presentation` });
  return true;
}

export async function addPanelist(actorId: string, presentationId: string, input: PanelistInput) {
  const panelist = await prisma.panelist.create({
    data: {
      presentationId,
      name: input.name,
      position: input.position ?? "",
    },
  });
  await logAudit({ action: "CREATE", entity: "Panelist", entityId: panelist.id, userId: actorId, details: `Added panelist ${input.name}` });
  return panelist;
}

export async function removePanelist(actorId: string, panelistId: string) {
  await prisma.panelist.delete({ where: { id: panelistId } });
  await logAudit({ action: "DELETE", entity: "Panelist", entityId: panelistId, userId: actorId, details: `Removed panelist` });
  return true;
}

/**
 * Submit a final score + recommendation. Delegates status resolution to the
 * employee service (single source of truth for probation business rules).
 */
export async function submitScore(
  actorId: string,
  presentationId: string,
  data: { score: number; remarks: string; recommendation: string }
) {
  const presentation = await prisma.presentation.findUnique({ where: { id: presentationId } });
  if (!presentation) throw new Error("Presentation not found");
  return applyFinalResult(actorId, presentation.userId, presentationId, data.recommendation, data.score, data.remarks);
}
