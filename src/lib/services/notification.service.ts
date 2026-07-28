import { TASK_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/utils";
import { listRetirementMonitoring } from "./hr-modules.service";
import { getTaskPicContact } from "./task.service";

export async function listEmployeeNotifications(profileId: string) {
  const tasks = await prisma.probationTask.findMany({
    where: { userId: profileId, status: { not: TASK_STATUS.COMPLETED } },
    include: { profile: { include: { user: true } } },
    orderBy: { dueDate: "asc" },
  });

  return tasks
    .map((task) => {
      const pic = getTaskPicContact(task.title, task.description ?? "", task);
      const dueDays = task.dueDate ? daysBetween(new Date(), task.dueDate) : null;
      return {
        id: task.id,
        title: task.title,
        message: pic
          ? `Task ini membutuhkan koordinasi dengan ${pic.name} (${pic.email}).`
          : "Task probation masih perlu diselesaikan.",
        dueDate: task.dueDate,
        status: task.status,
        channel: "App account",
        pic,
        urgency: dueDays !== null && dueDays < 0 ? "Overdue" : dueDays !== null && dueDays <= 3 ? "Due Soon" : "Open",
      };
    });
}

export async function listPicTaskNotifications() {
  const tasks = await prisma.probationTask.findMany({
    where: { status: { not: TASK_STATUS.COMPLETED } },
    include: { profile: { include: { user: true } } },
    orderBy: { dueDate: "asc" },
  });

  return tasks
    .map((task) => {
      const pic = getTaskPicContact(task.title, task.description ?? "", task);
      if (!pic) return null;
      const dueDays = task.dueDate ? daysBetween(new Date(), task.dueDate) : null;
      return {
        id: task.id,
        employeeName: task.profile.user.name,
        employeeEmail: task.profile.user.email,
        taskTitle: task.title,
        dueDate: task.dueDate,
        pic,
        channels: ["Email", "App account"],
        message: `${pic.name} perlu membantu ${task.profile.user.name} untuk ${task.title}.`,
        urgency: dueDays !== null && dueDays < 0 ? "Overdue" : dueDays !== null && dueDays <= 3 ? "Due Soon" : "Open",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function listRetirementNotifications() {
  const rows = await listRetirementMonitoring({ window: "all" });
  return rows
    .filter((row) => row.remainingDays >= 0 && row.remainingDays <= 90)
    .map((row) => ({
      id: row.profileId,
      employeeName: row.name,
      position: row.currentPosition,
      department: row.department,
      retirementAge: row.retirementAge,
      retirementDate: row.retirementDate,
      remainingDays: row.remainingDays,
      remainingTime: row.remainingTime,
      status: row.retirementStatus,
      extensionStatus: row.extensionStatus,
      notes: row.retirementNotes,
      message: `${row.name} mendekati masa pensiun dalam 3 bulan lagi. Siapkan konfirmasi kontrak, replacement plan, dan handover knowledge.`,
    }));
}
