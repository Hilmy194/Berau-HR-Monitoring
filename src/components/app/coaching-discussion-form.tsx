"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { coachingDiscussionSchema, type CoachingDiscussionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoachingDiscussionFormProps {
  coachingId: string;
  defaultValue?: string;
}

export function CoachingDiscussionForm({ coachingId, defaultValue = "" }: CoachingDiscussionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CoachingDiscussionInput>({
    resolver: zodResolver(coachingDiscussionSchema),
    defaultValues: { discussionNotes: defaultValue },
  });

  const onSubmit = async (data: CoachingDiscussionInput) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coaching/${coachingId}/discussion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Gagal menyimpan discussion notes");
        return;
      }

      toast.success("Discussion notes berhasil disimpan");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilLine className="h-4 w-4" />
          {defaultValue ? "Edit Notes" : "Isi Notes"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discussion Notes</DialogTitle>
          <DialogDescription>
            Isi catatan hasil diskusi coaching dari sisi Anda sebagai new hire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              {...register("discussionNotes")}
              rows={6}
              placeholder="Tuliskan poin diskusi, feedback, dan hal yang perlu Anda tindak lanjuti."
            />
            {errors.discussionNotes && (
              <p className="text-xs text-destructive">{errors.discussionNotes.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Notes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
