"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskSchema, type TaskInput } from "@/lib/validations";
import { toDateInputValue } from "@/lib/utils";
import { TASK_STATUS_OPTIONS, STATUS_LABELS } from "@/lib/constants";

interface TaskFormDialogProps {
  mode: "create" | "edit";
  profileId?: string;
  employees?: { id: string; name: string; department?: string | null }[];
  task?: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    status: string;
    notes?: string | null;
  };
  trigger?: React.ReactNode;
  defaultProfileId?: string;
}

export function TaskFormDialog({ mode, profileId, employees, task, trigger, defaultProfileId }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(task?.status ?? "NOT_STARTED");
  const [assignTo, setAssignTo] = useState(profileId ?? defaultProfileId ?? "");
  const router = useRouter();
  const isEdit = mode === "edit";

  const { register, handleSubmit, formState: { errors } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      dueDate: task?.dueDate ? toDateInputValue(task.dueDate) : "",
      notes: task?.notes ?? "",
      status: (task?.status ?? "NOT_STARTED") as TaskInput["status"],
    },
  });

  const onSubmit = async (data: TaskInput) => {
    if (!isEdit && !assignTo && !profileId) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...data, status, profileId: assignTo || profileId };
      const url = isEdit ? `/api/admin/tasks/${task!.id}` : "/api/admin/tasks";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save");
        return;
      }
      toast.success(isEdit ? "Task updated" : "Task created");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit Task" : "Add Task"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            {isEdit ? "Edit Task" : "Create Probation Task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the task details." : "Assign a new probation activity to an employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!profileId && employees && (
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} {e.department ? `· ${e.department}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Task Title</Label>
            <Input {...register("title")} placeholder="e.g. Complete onboarding" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="What does this task involve?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Optional notes" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
