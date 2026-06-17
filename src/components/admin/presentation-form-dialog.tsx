"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Presentation as PresentationIcon } from "lucide-react";
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
import { presentationSchema, type PresentationInput } from "@/lib/validations";
import { toDateInputValue } from "@/lib/utils";
import { RESULT_STATUS_OPTIONS, STATUS_LABELS } from "@/lib/constants";

interface PresentationFormDialogProps {
  mode: "create" | "edit";
  profileId?: string;
  employees?: { id: string; name: string; department?: string | null }[];
  presentation?: {
    id: string;
    presentationDate?: string | null;
    presentationTime?: string | null;
    location?: string | null;
    meetingLink?: string | null;
    resultStatus: string;
  };
  trigger?: React.ReactNode;
}

export function PresentationFormDialog({ mode, profileId, employees, presentation, trigger }: PresentationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(presentation?.resultStatus ?? "SCHEDULED");
  const [assignTo, setAssignTo] = useState(profileId ?? "");
  const router = useRouter();
  const isEdit = mode === "edit";

  const { register, handleSubmit, formState: { errors } } = useForm<PresentationInput>({
    resolver: zodResolver(presentationSchema),
    defaultValues: {
      presentationDate: presentation?.presentationDate ? toDateInputValue(presentation.presentationDate) : "",
      presentationTime: presentation?.presentationTime ?? "",
      location: presentation?.location ?? "",
      meetingLink: presentation?.meetingLink ?? "",
      remarks: "",
      resultStatus: (presentation?.resultStatus ?? "SCHEDULED") as PresentationInput["resultStatus"],
      score: null,
    },
  });

  const onSubmit = async (data: PresentationInput) => {
    if (!isEdit && !assignTo && !profileId) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...data, resultStatus: status, profileId: assignTo || profileId };
      const url = isEdit ? `/api/admin/presentations/${presentation!.id}` : "/api/admin/presentations";
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
      toast.success(isEdit ? "Presentation updated" : "Presentation scheduled");
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
            {isEdit ? "Edit Presentation" : "Schedule Presentation"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PresentationIcon className="h-5 w-5" />
            {isEdit ? "Edit Presentation" : "Schedule Probation Presentation"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update presentation details." : "Set up a final probation presentation."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!profileId && employees && (
            <div className="space-y-1.5">
              <Label>Employee</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register("presentationDate")} />
              {errors.presentationDate && <p className="text-xs text-destructive">{errors.presentationDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" {...register("presentationTime")} />
              {errors.presentationTime && <p className="text-xs text-destructive">{errors.presentationTime.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input {...register("location")} placeholder="Conference Room A" />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Meeting Link (optional)</Label>
            <Input {...register("meetingLink")} placeholder="https://meet..." />
            {errors.meetingLink && <p className="text-xs text-destructive">{errors.meetingLink.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Result Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESULT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
