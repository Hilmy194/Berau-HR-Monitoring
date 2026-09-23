import type { LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";

export const learningStatuses: Array<{ value: LearningMonitoringStatus; label: string }> = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function learningStatusLabel(status: LearningMonitoringStatus) {
  return learningStatuses.find((item) => item.value === status)?.label ?? status;
}
