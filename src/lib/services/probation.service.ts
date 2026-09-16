import { prisma } from "@/lib/prisma";
import { PROBATION_DURATION_DAYS, TASK_STATUS, PROBATION_STATUS } from "@/lib/constants";
import { getCurrentProbationDay, daysBetween } from "@/lib/utils";
import { getTaskPicContact } from "./task.service";
import { listBigQueryEmployees } from "./bq-employee.service";
import type { Profile, ProbationTask, Presentation } from "@prisma/client";

/**
 * Probation business logic service.
 *
 * This layer isolates all probation-related rules so they can be reused across
 * routes, API handlers, and future integrations (SAP, Looker Studio) without
 * hardcoding business logic in components.
 */

export interface ProbationProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  progressPercentage: number;
}

export interface ProbationSummary {
  startDate: Date | null;
  endDate: Date | null;
  currentDay: number;
  totalDays: number;
  remainingDays: number;
  status: string;
}

export type ProbationMonitoringRow = {
  profileId: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: Date | null;
  probationEndDate: Date | null;
  probationStatus: string;
  presentationDate: Date | null;
  presentationReminderDate: Date | null;
  reminderStatus: "Overdue" | "Due Soon" | "Scheduled" | "Waiting Schedule" | "Completed";
  reminderChannels: string[];
  presentationReminderSummary: string;
  presentationReminderRecipients: string[];
  picReminderRecipients: string[];
  canSendPresentationReminder: boolean;
  canSendPicReminder: boolean;
  taskReminderSummary: string;
  picReminderSummary: string;
};

export function getProbationEndDate(joinDate: Date): Date {
  const end = new Date(joinDate);
  end.setDate(end.getDate() + PROBATION_DURATION_DAYS);
  return end;
}

export function computeProbationSummary(profile: Pick<Profile, "probationStartDate" | "probationEndDate" | "probationStatus">): ProbationSummary {
  const start = profile.probationStartDate;
  const end = profile.probationEndDate;
  const currentDay = start ? getCurrentProbationDay(start) : 0;
  const remainingDays = start && end ? Math.max(0, daysBetween(new Date(), end)) : 0;
  return {
    startDate: start,
    endDate: end,
    currentDay,
    totalDays: PROBATION_DURATION_DAYS,
    remainingDays,
    status: profile.probationStatus,
  };
}

export function computeTaskProgress(tasks: Pick<ProbationTask, "status">[]): ProbationProgress {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
  const inProgressTasks = tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length;
  const notStartedTasks = tasks.filter((t) => t.status === TASK_STATUS.NOT_STARTED).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return { totalTasks, completedTasks, inProgressTasks, notStartedTasks, progressPercentage };
}

/**
 * Resolve the final probation result from presentation + recommendation.
 * This is the single source of truth for how a recommendation maps to a status.
 */
export function resolveProbationResult(recommendation: string): string {
  switch (recommendation) {
    case "PASSED":
      return PROBATION_STATUS.PASSED;
    case "FAILED":
      return PROBATION_STATUS.FAILED;
    case "EXTENDED":
      return PROBATION_STATUS.EXTENDED;
    default:
      return PROBATION_STATUS.ACTIVE;
  }
}

export async function getEmployeeDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          presentations: { include: { panelists: true }, orderBy: { presentationDate: "asc" } },
          coachings: { orderBy: { coachingDate: "asc" } },
        },
      },
    },
  });

  if (!user || !user.profile) return null;

  const profile = user.profile;
  const summary = computeProbationSummary(profile);
  const progress = computeTaskProgress(profile.tasks);
  const upcomingPresentation = profile.presentations.find(
    (p) => p.resultStatus === "SCHEDULED"
  ) ?? profile.presentations[0] ?? null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcomingCoaching = profile.coachings.find(
    (coaching) => coaching.coachingDate >= startOfToday
  ) ?? profile.coachings[0] ?? null;

  return {
    user,
    profile,
    summary,
    progress,
    recentTasks: profile.tasks.slice(0, 5),
    presentation: upcomingPresentation,
    coaching: upcomingCoaching,
  };
}

export async function getAdminDashboardData() {
  // BQ work_contract is the population source of truth. Internal Profile rows
  // only enrich status/tasks/presentations when the same personnel number is
  // provisioned in the application.
  const probationEmployees = await listProbationMonitoringRows();
  const totalEmployees = probationEmployees.length;
  const activeProbation = probationEmployees.filter((row) => row.probationStatus === PROBATION_STATUS.ACTIVE).length;
  const passed = probationEmployees.filter((row) => row.probationStatus === PROBATION_STATUS.PASSED).length;
  const failed = probationEmployees.filter((row) => row.probationStatus === PROBATION_STATUS.FAILED).length;
  const extended = probationEmployees.filter((row) => row.probationStatus === PROBATION_STATUS.EXTENDED).length;
  const upcomingPresentations = probationEmployees.filter((row) =>
    row.presentationDate && row.presentationDate >= new Date() && row.reminderStatus === "Scheduled"
  ).length;

  // Monthly new hire trend (last 6 months)
  const now = new Date();
  const months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = probationEmployees.filter((employee) => {
      if (!employee.joinDate) return false;
      return employee.joinDate >= d && employee.joinDate < next;
    }).length;
    months.push({ month: d.toLocaleDateString("en-US", { month: "short" }), count });
  }

  const statusDistribution = [
    { name: "Active", value: activeProbation, fill: "#3b82f6" },
    { name: "Passed", value: passed, fill: "#22c55e" },
    { name: "Failed", value: failed, fill: "#ef4444" },
    { name: "Extended", value: extended, fill: "#eab308" },
  ];

  return {
    cards: { totalEmployees, activeProbation, passed, failed, extended, upcomingPresentations },
    statusDistribution,
    monthlyTrend: months,
  };
}

export async function listProbationMonitoringRows(): Promise<ProbationMonitoringRow[]> {
  const today = startOfDay(new Date());
  const employees = (await listBigQueryEmployees())
    .filter((employee) => employee.track.workContract?.trim().toLocaleLowerCase("id-ID") === "probation");
  const employeeNumbers = employees.map((employee) => employee.nik ?? employee.id);
  const internalProfiles = employeeNumbers.length
    ? await prisma.profile.findMany({
        where: { nik: { in: employeeNumbers } },
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          presentations: { orderBy: { presentationDate: "asc" } },
        },
      })
    : [];
  const internalProfileByNik = new Map(internalProfiles.map((profile) => [profile.nik, profile]));

  return employees.map((employee) => {
    const internalProfile = internalProfileByNik.get(employee.nik ?? employee.id);
    const joinDate = employee.joinDate.getTime() > 0 ? employee.joinDate : null;
    const probationEndDate = joinDate ? getProbationEndDate(joinDate) : null;
    const presentationReminderDate = joinDate ? addMonths(joinDate, 2) : null;
    const presentation = internalProfile?.presentations.find((item) => item.resultStatus === "SCHEDULED")
      ?? internalProfile?.presentations[0]
      ?? null;
    const pendingTasks = internalProfile?.tasks.filter((task) => task.status !== TASK_STATUS.COMPLETED) ?? [];
    const dueTaskCount = pendingTasks.filter((task) => task.dueDate && startOfDay(task.dueDate) <= today).length;
    const assetTasks = pendingTasks.filter((task) => /laptop|asset|email|akun|account|akses|access/i.test(`${task.title} ${task.description ?? ""}`));
    const probationStatus = internalProfile?.probationStatus ?? PROBATION_STATUS.ACTIVE;
    const reminderStatus = getPresentationReminderStatus(probationStatus, presentation?.presentationDate ?? null, presentationReminderDate, today);
    const presentationReminderRecipients = [
      employee.email,
      employee.supervisorName ? `${employee.supervisorName} (atasan/PIC)` : null,
      "HR Probation",
    ].filter((item): item is string => Boolean(item));
    const picReminderRecipients = [
      employee.email,
      ...assetTasks
        .map((task) => getTaskPicContact(task.title, task.description ?? "", task))
        .filter((pic): pic is NonNullable<typeof pic> => Boolean(pic))
        .map((pic) => `${pic.name} <${pic.email}>`),
    ];

    return {
      profileId: internalProfile?.id ?? employee.id,
      employeeId: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department ?? "Belum diisi",
      position: employee.currentPosition ?? "Belum diisi",
      joinDate,
      probationEndDate,
      probationStatus,
      presentationDate: presentation?.presentationDate ?? null,
      presentationReminderDate,
      reminderStatus,
      reminderChannels: ["Email", "App account"],
      presentationReminderSummary: presentationReminderDate
        ? `Trigger H-14 dari ${formatShortDate(presentationReminderDate)} untuk jadwal presentasi probation.`
        : "Join date belum ada, reminder presentasi belum bisa dihitung.",
      presentationReminderRecipients,
      picReminderRecipients,
      // BQ selects the employees; operational task/presentation records remain
      // in the internal app and are used only when they match the same NIK.
      canSendPresentationReminder: Boolean(internalProfile) && (reminderStatus === "Due Soon" || reminderStatus === "Overdue" || reminderStatus === "Waiting Schedule"),
      canSendPicReminder: Boolean(internalProfile) && assetTasks.length > 0,
      taskReminderSummary: pendingTasks.length
        ? `${pendingTasks.length} task pending, ${dueTaskCount} sudah due`
        : "Belum ada task internal",
      picReminderSummary: assetTasks.length
        ? `${assetTasks.length} PIC asset/account perlu reminder`
        : "Belum ada PIC task internal",
    };
  });
}

function getPresentationReminderStatus(
  probationStatus: string,
  presentationDate: Date | null,
  reminderDate: Date | null,
  today: Date
): ProbationMonitoringRow["reminderStatus"] {
  if (probationStatus === PROBATION_STATUS.PASSED || probationStatus === PROBATION_STATUS.FAILED) return "Completed";
  if (presentationDate) return "Scheduled";
  if (!reminderDate) return "Waiting Schedule";
  const daysToReminder = daysBetween(today, reminderDate);
  if (daysToReminder < 0) return "Overdue";
  if (daysToReminder <= 14) return "Due Soon";
  return "Waiting Schedule";
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
