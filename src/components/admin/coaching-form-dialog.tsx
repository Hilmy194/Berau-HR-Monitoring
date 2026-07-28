"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, MessagesSquare, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { coachingScheduleSchema, type CoachingInput } from "@/lib/validations";
import { toDateInputValue } from "@/lib/utils";

interface CoachingFormDialogProps {
  mode: "create" | "edit";
  profileId?: string;
  employees?: Array<{
    id: string;
    name: string;
    department?: string | null;
    supervisorName?: string | null;
  }>;
  defaultCoachName?: string | null;
  coaching?: {
    id: string;
    coachName: string;
    coachingDate: string;
    sessionNumber: number;
    totalSessions: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    goals: string;
    discussionNotes: string;
    resultOutcome: string;
    followUpAction: string;
  };
  trigger?: React.ReactNode;
}

export function CoachingFormDialog({
  mode,
  profileId,
  employees = [],
  defaultCoachName,
  coaching,
  trigger,
}: CoachingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(profileId ?? "");
  const router = useRouter();
  const isEdit = mode === "edit";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CoachingInput>({
    resolver: zodResolver(coachingScheduleSchema),
    defaultValues: {
      coachName: coaching?.coachName ?? defaultCoachName ?? "",
      coachingDate: coaching?.coachingDate ? toDateInputValue(coaching.coachingDate) : "",
      sessionNumber: coaching?.sessionNumber ?? 1,
      totalSessions: coaching?.totalSessions ?? 1,
      status: coaching?.status ?? "NOT_STARTED",
      goals: coaching?.goals ?? "",
      discussionNotes: coaching?.discussionNotes ?? "",
      resultOutcome: coaching?.resultOutcome ?? "",
      followUpAction: coaching?.followUpAction ?? "",
    },
  });

  const onSubmit = async (data: CoachingInput) => {
    if (!isEdit && !selectedProfileId) {
      toast.error("Pilih employee terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/coaching/${coaching!.id}` : "/api/admin/coaching";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? data : { ...data, profileId: selectedProfileId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Gagal menyimpan coaching");
        return;
      }

      toast.success(isEdit ? "Coaching berhasil diperbarui" : "Coaching berhasil ditambahkan");
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
        {trigger ?? (
          <Button>
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit Coaching" : "Tambah Coaching"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5" />
            {isEdit ? "Edit Coaching" : "Tambah Coaching"}
          </DialogTitle>
          <DialogDescription>
            Jadwalkan coaching lebih dulu. Catatan diskusi diisi oleh new hire, sedangkan hasil dan tindak lanjut diisi oleh HR/admin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && employees.length > 0 && (
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={selectedProfileId}
                onValueChange={(value) => {
                  setSelectedProfileId(value);
                  const employee = employees.find((item) => item.id === value);
                  if (employee?.supervisorName) {
                    setValue("coachName", employee.supervisorName, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}{employee.department ? ` - ${employee.department}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Coach / Atasan</Label>
              <Input {...register("coachName")} placeholder="Nama coach atau atasan" />
              {errors.coachName && <p className="text-xs text-destructive">{errors.coachName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Coaching</Label>
              <Input type="date" {...register("coachingDate")} />
              {errors.coachingDate && <p className="text-xs text-destructive">{errors.coachingDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Pertemuan Ke</Label>
              <Input type="number" min={1} {...register("sessionNumber")} />
              {errors.sessionNumber && <p className="text-xs text-destructive">{errors.sessionNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Total Pertemuan</Label>
              <Input type="number" min={1} {...register("totalSessions")} />
              {errors.totalSessions && <p className="text-xs text-destructive">{errors.totalSessions.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={coaching?.status ?? "NOT_STARTED"}
                onValueChange={(value) => setValue("status", value as CoachingInput["status"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Belum Dimulai</SelectItem>
                  <SelectItem value="IN_PROGRESS">On Progress</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Goals</Label>
            <Textarea {...register("goals")} placeholder="Tujuan coaching" rows={3} />
            {errors.goals && <p className="text-xs text-destructive">{errors.goals.message}</p>}
          </div>

          {isEdit ? (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Discussion / Notes
              </Label>
              <Textarea
                value={coaching?.discussionNotes ?? ""}
                placeholder="Akan diisi oleh new hire setelah sesi coaching."
                rows={4}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Field ini diisi oleh new hire dari halaman coaching mereka.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Discussion / Notes</Label>
              <Textarea
                {...register("discussionNotes")}
                placeholder="Kosongkan dulu. New hire akan mengisi catatan diskusi nanti."
                rows={4}
              />
              {errors.discussionNotes && <p className="text-xs text-destructive">{errors.discussionNotes.message}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Result / Outcome</Label>
            <Textarea {...register("resultOutcome")} placeholder="Boleh dikosongkan saat penjadwalan awal" rows={3} />
            {errors.resultOutcome && <p className="text-xs text-destructive">{errors.resultOutcome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Follow Up Action</Label>
            <Textarea {...register("followUpAction")} placeholder="Boleh dikosongkan saat penjadwalan awal" rows={3} />
            {errors.followUpAction && <p className="text-xs text-destructive">{errors.followUpAction.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Simpan Coaching"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
