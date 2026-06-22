import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatStatusLabel, cn } from "@/lib/utils";

/**
 * Maps each status value to:
 *   - a `Badge` variant (controls background + text color), and
 *   - a hex dot color chosen to CONTRAST with the badge background so the
 *     leading dot is always visible (the previous version used the same
 *     green for both the "default" badge bg and the dot, making Active
 *     badges look asymmetric because the dot disappeared).
 *
 * Palette rationale:
 *   - green badges (Active/Scheduled/Completed/Passed) → white dot
 *   - amber badges (In Progress/Extended)               → dark brown dot
 *   - red badges (Failed)                               → white dot
 *   - slate/gray badges (Not Started)                   → dark slate dot
 *
 * The dot therefore always reads as a distinct visual marker while the
 * background color carries the semantic meaning — matching the
 * logo-inspired Berau palette without losing scanability.
 */
const STATUS_STYLES: Record<
  string,
  { variant: BadgeProps["variant"]; dot: string; ring: string }
> = {
  // Probation status
  ACTIVE: { variant: "default", dot: "#ffffff", ring: "ring-white/40" },
  PASSED: { variant: "success", dot: "#ffffff", ring: "ring-white/40" },
  FAILED: { variant: "destructive", dot: "#ffffff", ring: "ring-white/40" },
  EXTENDED: { variant: "warning", dot: "#7c2d12", ring: "ring-amber-900/30" },
  // Task status
  NOT_STARTED: { variant: "secondary", dot: "#475569", ring: "ring-slate-600/30" },
  IN_PROGRESS: { variant: "warning", dot: "#7c2d12", ring: "ring-amber-900/30" },
  COMPLETED: { variant: "success", dot: "#ffffff", ring: "ring-white/40" },
  // Result status
  SCHEDULED: { variant: "default", dot: "#ffffff", ring: "ring-white/40" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? {
    variant: "outline" as const,
    dot: "#64748b",
    ring: "ring-slate-500/30",
  };
  return (
    <Badge variant={style.variant} className={cn("gap-1.5", className)}>
      <span
        aria-hidden
        className={cn(
          "inline-block h-2 w-2 rounded-full ring-2",
          style.ring,
        )}
        style={{ backgroundColor: style.dot }}
      />
      {formatStatusLabel(status)}
    </Badge>
  );
}
