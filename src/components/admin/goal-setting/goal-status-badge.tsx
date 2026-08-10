import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GoalStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = status === "Completed"
    ? "bg-green-800 text-white"
    : status === "On Track"
      ? "bg-emerald-100 text-emerald-800"
      : status === "In Progress"
        ? "bg-blue-100 text-blue-800"
        : status === "At Risk"
          ? "bg-amber-100 text-amber-800"
          : status === "Overdue"
            ? "bg-red-100 text-red-800"
            : "bg-slate-100 text-slate-700";

  return <Badge className={cn(tone, className)}>{status}</Badge>;
}
