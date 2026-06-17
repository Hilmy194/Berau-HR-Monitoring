import { prisma } from "@/lib/prisma";
import { PROBATION_DURATION_DAYS, TASK_STATUS, PROBATION_STATUS } from "@/lib/constants";
import { getCurrentProbationDay, daysBetween } from "@/lib/utils";
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

  return {
    user,
    profile,
    summary,
    progress,
    recentTasks: profile.tasks.slice(0, 5),
    presentation: upcomingPresentation,
  };
}

export async function getAdminDashboardData() {
  const [totalEmployees, activeProbation, passed, failed, extended, upcomingPresentations, allProfiles] =
    await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { probationStatus: PROBATION_STATUS.ACTIVE } }),
      prisma.profile.count({ where: { probationStatus: PROBATION_STATUS.PASSED } }),
      prisma.profile.count({ where: { probationStatus: PROBATION_STATUS.FAILED } }),
      prisma.profile.count({ where: { probationStatus: PROBATION_STATUS.EXTENDED } }),
      prisma.presentation.count({
        where: { resultStatus: "SCHEDULED", presentationDate: { gte: new Date() } },
      }),
      prisma.profile.findMany({
        select: { joinDate: true, probationStatus: true },
        orderBy: { joinDate: "asc" },
      }),
    ]);

  // Monthly new hire trend (last 6 months)
  const now = new Date();
  const months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = allProfiles.filter((p) => {
      if (!p.joinDate) return false;
      return p.joinDate >= d && p.joinDate < next;
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
