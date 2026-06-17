import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/utils";

const STATUS_STYLES: Record<string, BadgeProps["variant"]> = {
  // Probation status
  ACTIVE: "default",
  PASSED: "success",
  FAILED: "destructive",
  EXTENDED: "warning",
  // Task status
  NOT_STARTED: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  // Result status
  SCHEDULED: "default",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = STATUS_STYLES[status] ?? "outline";
  return <Badge variant={variant} className={className}>{formatStatusLabel(status)}</Badge>;
}
