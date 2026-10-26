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
  retirementNewNik,
  retirementNewBusinessUnit,
  trigger,
}: {
  profileId: string;
  name: string;
  retirementAge: number;
  retirementExtendedUntil: string | null;
  retirementNotes: string | null;
  retirementNewNik?: string | null;
  retirementNewBusinessUnit?: string | null;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(String(retirementAge));
  const [extendedUntil, setExtendedUntil] = useState(retirementExtendedUntil ? retirementExtendedUntil.split("T")[0] : "");
  const [notes, setNotes] = useState(retirementNotes ?? "");
  const [newNik, setNewNik] = useState(retirementNewNik ?? "");
  const [newBusinessUnit, setNewBusinessUnit] = useState(retirementNewBusinessUnit ?? "");

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
          retirementNewNik: newNik,
          retirementNewBusinessUnit: newBusinessUnit,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Gagal update data pensiun");
        return;
      }

      toast.success("Data pensiun & kontrak berhasil diperbarui");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Gagal update data pensiun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="outline" className="mt-2">
            <Pencil className="h-4 w-4" />
            Edit kontrak
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pensiun &amp; Kontrak Baru</DialogTitle>
          <DialogDescription className="font-medium text-slate-800">{name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Usia Pensiun</Label>
              <Input type="number" min={45} max={70} value={age} onChange={(event) => setAge(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Perpanjangan Hingga</Label>
              <Input type="date" value={extendedUntil} onChange={(event) => setExtendedUntil(event.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Catatan / Referensi Kontrak</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Alasan perpanjangan atau referensi SK/kontrak"
              rows={2}
            />
          </div>

          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Informasi Kontrak Baru / Rehire
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">NIK Baru</Label>
              <Input
                type="text"
                value={newNik}
                onChange={(event) => setNewNik(event.target.value)}
                placeholder="Contoh: 11009876 (diisi manual oleh PIC)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Business Unit Baru</Label>
              <Input
                type="text"
                list="bu-suggestions"
                value={newBusinessUnit}
                onChange={(event) => setNewBusinessUnit(event.target.value)}
                placeholder="Pilih atau ketik Business Unit baru"
              />
              <datalist id="bu-suggestions">
                <option value="PT Berau Coal - Site Lati" />
                <option value="PT Berau Coal - Site Binungan" />
                <option value="PT Berau Coal - Site Sambarata" />
                <option value="PT Berau Coal - Head Office" />
                <option value="PT Berau Coal - HO Jakarta" />
              </datalist>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
