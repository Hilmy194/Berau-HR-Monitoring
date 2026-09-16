import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "./audit.service";

export const LEARNING_ACTIVITY_TYPES = ["EXPERIENCE_70", "SOCIAL_20", "FORMAL_10"] as const;
export const LEARNING_MONITORING_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"] as const;

export type LearningActivityType = (typeof LEARNING_ACTIVITY_TYPES)[number];
export type LearningMonitoringStatus = (typeof LEARNING_MONITORING_STATUSES)[number];

export type LearningMonitoringInput = {
  employeePersonnelNumber: string;
  activityType: LearningActivityType;
  targetPosition?: string | null;
  skillImprovement: string;
  programName: string;
  provider: string;
  timeline: string;
  status: LearningMonitoringStatus;
  successCriteria: string;
  notes?: string | null;
  version: number;
};

export async function listLearningMonitoring(employeePersonnelNumbers: string[]) {
  if (!employeePersonnelNumbers.length) return [];
  return prisma.learningMonitoring.findMany({
    where: { employeePersonnelNumber: { in: employeePersonnelNumbers } },
    orderBy: [{ employeePersonnelNumber: "asc" }, { activityType: "asc" }],
  });
}

/**
 * Optimistic locking prevents one Learning user from silently overwriting
 * changes made by another user between opening and saving the form.
 */
export async function saveLearningMonitoring(actorId: string, input: LearningMonitoringInput) {
  const employeePersonnelNumber = input.employeePersonnelNumber.trim();
  if (!employeePersonnelNumber) throw new Error("Personnel number wajib diisi.");

  const existing = await prisma.learningMonitoring.findUnique({
    where: { employeePersonnelNumber_activityType: { employeePersonnelNumber, activityType: input.activityType } },
  });

  const data = {
    targetPosition: cleanNullable(input.targetPosition),
    skillImprovement: input.skillImprovement.trim(),
    programName: input.programName.trim(),
    provider: input.provider.trim(),
    timeline: input.timeline.trim(),
    status: input.status,
    successCriteria: input.successCriteria.trim(),
    notes: cleanNullable(input.notes),
    updatedBy: actorId,
  };

  let saved;
  if (!existing) {
    if (input.version !== 0) throw new LearningMonitoringConflictError();
    try {
      saved = await prisma.learningMonitoring.create({
        data: { employeePersonnelNumber, activityType: input.activityType, ...data, createdBy: actorId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new LearningMonitoringConflictError();
      }
      throw error;
    }
  } else {
    const result = await prisma.learningMonitoring.updateMany({
      where: { id: existing.id, version: input.version },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count !== 1) throw new LearningMonitoringConflictError();
    saved = await prisma.learningMonitoring.findUniqueOrThrow({ where: { id: existing.id } });
  }

  await logAudit({
    action: existing ? "UPDATE_LEARNING_MONITORING" : "CREATE_LEARNING_MONITORING",
    entity: "LearningMonitoring",
    entityId: saved.id,
    userId: actorId,
    details: `${employeePersonnelNumber}:${input.activityType}`,
  });
  return saved;
}

export class LearningMonitoringConflictError extends Error {
  constructor() {
    super("Data monitoring sudah diubah user lain. Muat ulang halaman sebelum menyimpan kembali.");
    this.name = "LearningMonitoringConflictError";
  }
}

function cleanNullable(value: string | null | undefined) {
  const clean = value?.trim();
  return clean || null;
}
