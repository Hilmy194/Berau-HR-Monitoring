import { prisma } from "@/lib/prisma";
import { PROBATION_DURATION_DAYS, RESULT_STATUS } from "@/lib/constants";
import { createNewHireInductionTasks } from "./task.service";

export function probationEndFromJoinDate(joinDate: Date) {
  const endDate = new Date(joinDate);
  endDate.setDate(endDate.getDate() + PROBATION_DURATION_DAYS);
  return endDate;
}

export function defaultPresentationDate(joinDate: Date) {
  const source = new Date(joinDate);
  const targetMonth = source.getMonth() + 3;
  const result = new Date(source);
  result.setDate(1);
  result.setMonth(targetMonth);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(source.getDate(), lastDay));
  return result;
}

export async function ensureDefaultProbationPresentation(profileId: string, joinDate: Date) {
  const existing = await prisma.presentation.findFirst({ where: { userId: profileId } });
  if (existing) return existing;

  return prisma.presentation.create({
    data: {
      userId: profileId,
      presentationDate: defaultPresentationDate(joinDate),
      presentationTime: "09:00",
      location: "TBD",
      remarks: "",
      resultStatus: RESULT_STATUS.SCHEDULED,
    },
  });
}

export async function initializeProbationOnboarding(profileId: string, joinDate: Date, actorId?: string) {
  await Promise.all([
    createNewHireInductionTasks(profileId, joinDate, actorId),
    ensureDefaultProbationPresentation(profileId, joinDate),
  ]);
}
