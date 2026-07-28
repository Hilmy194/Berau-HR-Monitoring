"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RetirementContractDialog({
  profileId,
  name,
  retirementAge,
  retirementExtendedUntil,
  retirementNotes,
}: {
  profileId: string;
  name: string;
  retirementAge: number;
  retirementExtendedUntil: string | null;
  retirementNotes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(String(retirementAge));
  const [extendedUntil, setExtendedUntil] = useState(retirementExtendedUntil ? retirementExtendedUntil.split("T")[0] : "");
  const [notes, setNotes] = useState(retirementNotes ?? "");

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/employees/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retirementAge: age,
          retirementExtendedUntil: extendedUntil,
          retirementNotes: notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal update kontrak pensiun");
        return;
      }

      toast.success("Kontrak pensiun diperbarui");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Gagal update kontrak pensiun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="mt-2">
          <Pencil className="h-4 w-4" />
          Edit kontrak
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retirement Contract</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Retirement age</Label>
            <Input type="number" min={45} max={70} value={age} onChange={(event) => setAge(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Extended until</Label>
            <Input type="date" value={extendedUntil} onChange={(event) => setExtendedUntil(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Alasan perpanjangan atau referensi kontrak" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
