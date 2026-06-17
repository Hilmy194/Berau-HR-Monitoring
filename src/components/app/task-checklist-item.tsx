"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { TASK_STATUS_OPTIONS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type TaskChecklistItemProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    notes?: string | null;
    status: string;
  };
};

export function TaskChecklistItem({ task }: TaskChecklistItemProps) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  useEffect(() => {
    setStatus(task.status);
  }, [task.status]);

  const updateStatus = async (nextStatus: string) => {
    setLoadingStatus(nextStatus);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update task");
        return;
      }

      setStatus(nextStatus);
      toast.success("Task status updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-base">{task.title}</h3>
                <StatusBadge status={status} />
              </div>
              {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {task.dueDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Due {formatDate(task.dueDate)}
                  </span>
                )}
                <Badge variant="secondary" className="gap-1">
                  Current: {STATUS_LABELS[status] ?? status}
                </Badge>
              </div>
            </div>
          </div>

          {(task.notes || task.dueDate) && <Separator />}

          {task.notes && (
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-0.5 text-sm">{task.notes}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Update checklist status</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TASK_STATUS_OPTIONS.map((option) => {
                const active = status === option;
                const disabled = loadingStatus !== null;
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => updateStatus(option)}
                    disabled={disabled}
                  >
                    {loadingStatus === option ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>{STATUS_LABELS[option] ?? option}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}