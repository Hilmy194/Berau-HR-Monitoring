import { prisma } from "@/lib/prisma";
import { logAudit } from "./audit.service";
import type {
  CoachingAdminUpdateInput,
  CoachingDiscussionInput,
  CoachingInput,
} from "@/lib/validations";

export async function getCoachingsForProfile(profileId: string) {
  return prisma.coachingRecord.findMany({
    where: { profileId },
    orderBy: [{ coachingDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function createCoaching(actorId: string, profileId: string, input: CoachingInput) {
  const coaching = await prisma.coachingRecord.create({
    data: {
      profileId,
      coachName: input.coachName,
      coachingDate: new Date(input.coachingDate),
      goals: input.goals,
      discussionNotes: input.discussionNotes ?? "",
      resultOutcome: input.resultOutcome ?? "",
      followUpAction: input.followUpAction ?? "",
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "Coaching",
    entityId: coaching.id,
    userId: actorId,
    details: `Created coaching record for profile ${profileId}`,
  });

  return coaching;
}

export async function updateCoaching(actorId: string, coachingId: string, input: CoachingAdminUpdateInput) {
  const existing = await prisma.coachingRecord.findUnique({ where: { id: coachingId } });
  if (!existing) throw new Error("Coaching not found");

  const updated = await prisma.coachingRecord.update({
    where: { id: coachingId },
    data: {
      ...(input.coachName !== undefined ? { coachName: input.coachName } : {}),
      ...(input.coachingDate !== undefined ? { coachingDate: new Date(input.coachingDate) } : {}),
      ...(input.goals !== undefined ? { goals: input.goals } : {}),
      ...(input.resultOutcome !== undefined ? { resultOutcome: input.resultOutcome } : {}),
      ...(input.followUpAction !== undefined ? { followUpAction: input.followUpAction } : {}),
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "Coaching",
    entityId: coachingId,
    userId: actorId,
    details: "Updated coaching record",
  });

  return updated;
}

export async function updateCoachingDiscussion(
  actorId: string,
  profileId: string,
  coachingId: string,
  input: CoachingDiscussionInput,
) {
  const existing = await prisma.coachingRecord.findFirst({
    where: { id: coachingId, profileId },
  });
  if (!existing) throw new Error("Coaching not found");

  const updated = await prisma.coachingRecord.update({
    where: { id: coachingId },
    data: {
      discussionNotes: input.discussionNotes,
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "CoachingDiscussion",
    entityId: coachingId,
    userId: actorId,
    details: "Employee updated coaching discussion notes",
  });

  return updated;
}

export async function deleteCoaching(actorId: string, coachingId: string) {
  await prisma.coachingRecord.delete({ where: { id: coachingId } });

  await logAudit({
    action: "DELETE",
    entity: "Coaching",
    entityId: coachingId,
    userId: actorId,
    details: "Deleted coaching record",
  });

  return true;
}
