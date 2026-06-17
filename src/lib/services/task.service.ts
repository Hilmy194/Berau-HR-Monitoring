import { prisma } from "@/lib/prisma";
import { logAudit } from "./audit.service";
import type { TaskInput, TaskStatusUpdate } from "@/lib/validations";

/**
 * Probation task management service.
 *
 * Every mutating function takes an `actorId` (the HR admin's user id) so the
 * audit log records who performed the action.
 */

export async function listTasks(filters?: { profileId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  // NOTE: ProbationTask.userId actually stores the Profile id (see schema).
  if (filters?.profileId) where.userId = filters.profileId;
  if (filters?.status) where.status = filters.status;
  return prisma.probationTask.findMany({
    where,
    include: { profile: { include: { user: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export async function getTasksForProfile(profileId: string) {
  return prisma.probationTask.findMany({
    where: { userId: profileId },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(actorId: string, profileId: string, input: TaskInput) {
  const task = await prisma.probationTask.create({
    data: {
      userId: profileId,
      title: input.title,
      description: input.description ?? "",
      dueDate: new Date(input.dueDate),
      status: input.status,
      notes: input.notes ?? "",
    },
  });
  await logAudit({ action: "CREATE", entity: "Task", entityId: task.id, userId: actorId, details: `Created task "${input.title}"` });
  return task;
}

export async function updateTask(actorId: string, taskId: string, input: Partial<TaskInput>) {
  const existing = await prisma.probationTask.findUnique({ where: { id: taskId } });
  if (!existing) throw new Error("Task not found");
  const updated = await prisma.probationTask.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  await logAudit({ action: "UPDATE", entity: "Task", entityId: taskId, userId: actorId, details: `Updated task` });
  return updated;
}

export async function deleteTask(actorId: string, taskId: string) {
  await prisma.probationTask.delete({ where: { id: taskId } });
  await logAudit({ action: "DELETE", entity: "Task", entityId: taskId, userId: actorId, details: `Deleted task` });
  return true;
}

export async function updateOwnTaskStatus(actorId: string, taskId: string, input: TaskStatusUpdate) {
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { profile: { select: { id: true } } },
  });

  const profileId = user?.profile?.id;
  if (!profileId) {
    throw new Error("Profile not found");
  }

  const task = await prisma.probationTask.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new Error("Task not found");
  }

  if (task.userId !== profileId) {
    throw new Error("You can only update your own tasks");
  }

  const updated = await prisma.probationTask.update({
    where: { id: taskId },
    data: { status: input.status },
  });

  await logAudit({
    action: "UPDATE",
    entity: "Task",
    entityId: taskId,
    userId: actorId,
    details: `Updated own task status to ${input.status}`,
  });

  return updated;
}
