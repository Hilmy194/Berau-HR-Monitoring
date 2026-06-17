import { prisma } from "@/lib/prisma";
import { getProbationEndDate, resolveProbationResult } from "./probation.service";
import { logAudit } from "./audit.service";
import bcrypt from "bcryptjs";
import { PROBATION_STATUS, RESULT_STATUS, PROBATION_EXTENSION_DAYS } from "@/lib/constants";

/**
 * Employee management service — HR Admin operations.
 *
 * Every mutating function takes an `actorId` (the HR admin's user id) so the
 * audit log records who performed the action. Without it the AuditLog.userId
 * column would always be NULL and the audit trail would be useless.
 */

export async function listProfiles(filters?: { search?: string; status?: string; department?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.probationStatus = filters.status;
  if (filters?.department) where.department = filters.department;
  if (filters?.search) {
    where.OR = [
      { user: { name: { contains: filters.search } } },
      { user: { email: { contains: filters.search } } },
      { department: { contains: filters.search } },
      { position: { contains: filters.search } },
    ];
  }
  return prisma.profile.findMany({
    where,
    include: { user: true, tasks: true, presentations: { include: { panelists: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

export async function getProfileDetail(profileId: string) {
  return prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: true,
      tasks: { orderBy: { dueDate: "asc" } },
      presentations: { include: { panelists: true } },
    },
  });
}

export async function createEmployee(
  actorId: string,
  input: {
    name: string;
    email: string;
    password: string;
    department?: string;
    position?: string;
    joinDate: string;
  }
) {
  const hashedPassword = await bcrypt.hash(input.password, 10);
  const joinDate = new Date(input.joinDate);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: "NEW_HIRE",
      profile: {
        create: {
          department: input.department || null,
          position: input.position || null,
          joinDate,
          probationStartDate: joinDate,
          probationEndDate: getProbationEndDate(joinDate),
        },
      },
    },
    include: { profile: true },
  });

  await logAudit({ action: "CREATE", entity: "Employee", entityId: user.id, userId: actorId, details: `Created employee ${input.email}` });
  return user;
}

export async function updateProfile(
  actorId: string,
  profileId: string,
  input: Partial<{
    nik: string;
    phone: string;
    address: string;
    birthDate: string;
    gender: string;
    department: string;
    position: string;
    joinDate: string;
    supervisorName: string;
    cvUrl: string;
    photoUrl: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    probationStatus: string;
    name: string;
    email: string;
  }>
) {
  const existing = await prisma.profile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!existing) throw new Error("Profile not found");

  let joinDate = existing.joinDate;
  let probationStart = existing.probationStartDate;
  let probationEnd = existing.probationEndDate;

  if (input.joinDate) {
    joinDate = new Date(input.joinDate);
    probationStart = joinDate;
    probationEnd = getProbationEndDate(joinDate);
  }

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      nik: input.nik ?? existing.nik,
      phone: input.phone ?? existing.phone,
      address: input.address ?? existing.address,
      birthDate: input.birthDate ? new Date(input.birthDate) : existing.birthDate,
      gender: input.gender ?? existing.gender,
      department: input.department ?? existing.department,
      position: input.position ?? existing.position,
      joinDate,
      probationStartDate: probationStart,
      probationEndDate: probationEnd,
      supervisorName: input.supervisorName ?? existing.supervisorName,
      cvUrl: input.cvUrl ?? existing.cvUrl,
      photoUrl: input.photoUrl ?? existing.photoUrl,
      emergencyContactName: input.emergencyContactName ?? existing.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone ?? existing.emergencyContactPhone,
      probationStatus: input.probationStatus ?? existing.probationStatus,
    },
    include: { user: true },
  });

  if (input.name || input.email) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
      },
    });
  }

  await logAudit({ action: "UPDATE", entity: "Employee", entityId: profileId, userId: actorId, details: `Updated profile` });
  return updated;
}

export async function deleteProfile(actorId: string, profileId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) throw new Error("Profile not found");
  const userId = profile.user.id;
  // Cascading delete will remove profile, tasks, presentations, panelists
  await prisma.user.delete({ where: { id: userId } });
  await logAudit({ action: "DELETE", entity: "Employee", entityId: profileId, userId: actorId, details: `Deleted employee ${profile.user.email}` });
  return true;
}

/**
 * Applies a final recommendation across the employee record: sets presentation
 * result status, profile probation status, and recomputes end date if extended.
 * Keeps business rules in one place (single source of truth).
 */
export async function applyFinalResult(
  actorId: string,
  profileId: string,
  presentationId: string,
  recommendation: string,
  score: number,
  remarks: string
) {
  const resultStatus =
    recommendation === "PASSED" ? RESULT_STATUS.PASSED :
    recommendation === "FAILED" ? RESULT_STATUS.FAILED :
    RESULT_STATUS.EXTENDED;

  const probationStatus = resolveProbationResult(recommendation);

  return prisma.$transaction(async (tx) => {
    await tx.presentation.update({
      where: { id: presentationId },
      data: { score, remarks, resultStatus },
    });

    const profile = await tx.profile.findUnique({ where: { id: profileId } });
    let probationEndDate = profile?.probationEndDate ?? null;
    if (recommendation === "EXTENDED" && profile?.probationEndDate) {
      const extended = new Date(profile.probationEndDate);
      extended.setDate(extended.getDate() + PROBATION_EXTENSION_DAYS);
      probationEndDate = extended;
    }

    const updated = await tx.profile.update({
      where: { id: profileId },
      data: { probationStatus, probationEndDate },
    });

    await logAudit({ action: "SCORE", entity: "Presentation", entityId: presentationId, userId: actorId, details: `Applied recommendation ${recommendation} (score ${score})` });
    return updated;
  });
}
