"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Award, Save } from "lucide-react";
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
import { panelistSchema, type PanelistInput } from "@/lib/validations";

export function AddPanelistDialog({ presentationId }: { presentationId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PanelistInput>({
    resolver: zodResolver(panelistSchema),
    defaultValues: { name: "", position: "" },
  });

  const onSubmit = async (data: PanelistInput) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presentations/${presentationId}/panelists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to add");
        return;
      }
      toast.success("Panelist added");
      reset();
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
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" /> Add Panelist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Panelist</DialogTitle>
          <DialogDescription>Assign a panelist to evaluate this presentation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Panelist Name</Label>
            <Input {...register("name")} placeholder="Full name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Input {...register("position")} placeholder="e.g. Engineering Manager" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Panelist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemovePanelistButton({ presentationId, panelistId }: { presentationId: string; panelistId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const remove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/presentations/${presentationId}/panelists/${panelistId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to remove");
        return;
      }
      toast.success("Panelist removed");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={remove} disabled={loading} className="h-7 w-7 text-muted-foreground hover:text-destructive">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export function ScoreFormDialog({
  presentationId,
  current,
}: {
  presentationId: string;
  current?: { score?: number | null; remarks?: string | null; resultStatus: string };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Map the persisted resultStatus to a valid recommendation select value.
  // "SCHEDULED" is not a recommendation, so fall back to "PASSED" instead of
  // showing an empty select (which previously happened because the `?? "PASSED"`
  // fallback never triggered on a defined-but-invalid "SCHEDULED" value).
  const validRecs = ["PASSED", "FAILED", "EXTENDED"] as const;
  const initialRec: "PASSED" | "FAILED" | "EXTENDED" =
    current?.resultStatus && (validRecs as readonly string[]).includes(current.resultStatus)
      ? (current.resultStatus as "PASSED" | "FAILED" | "EXTENDED")
      : "PASSED";
  const [recommendation, setRecommendation] = useState<"PASSED" | "FAILED" | "EXTENDED">(initialRec);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const score = Number(formData.get("score"));
    const remarks = String(formData.get("remarks") ?? "");
    try {
      const res = await fetch(`/api/admin/presentations/${presentationId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, remarks, recommendation }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to submit score");
        return;
      }
      toast.success("Score submitted & probation status updated");
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
        <Button>
          <Award className="h-4 w-4" /> {current?.score != null ? "Update Score" : "Input Score"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" /> Final Evaluation
          </DialogTitle>
          <DialogDescription>
            Submitting a score will automatically update the employee&apos;s probation status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Score (0–100)</Label>
            <Input
              type="number"
              name="score"
              min={0}
              max={100}
              required
              defaultValue={current?.score ?? ""}
              placeholder="e.g. 85"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Recommendation</Label>
            <Select value={recommendation} onValueChange={(v) => setRecommendation(v as "PASSED" | "FAILED" | "EXTENDED")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PASSED">Passed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="EXTENDED">Extended ( +30 days )</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea name="remarks" defaultValue={current?.remarks ?? ""} placeholder="Evaluation remarks..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Submit Score
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
