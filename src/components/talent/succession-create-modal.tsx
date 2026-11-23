"use client";

import { useState } from "react";
import { Plus, Loader2, UserCheck, ShieldCheck, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReadinessLevel, SuccessionSource, SuccessionTarget } from "@/lib/services/succession.service";

interface SuccessionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownTargets: SuccessionTarget[];
  onSuccess?: () => void;
}

export function SuccessionCreateModal({
  isOpen,
  onClose,
  knownTargets,
  onSuccess,
}: SuccessionCreateModalProps) {
  const [selectedTargetChoice, setSelectedTargetChoice] = useState<string>(
    knownTargets[0]?.id || "new"
  );
  const [incumbentName, setIncumbentName] = useState(knownTargets[0]?.incumbentName || "");
  const [positionTitle, setPositionTitle] = useState(knownTargets[0]?.positionTitle || "");
  const [targetGolongan, setTargetGolongan] = useState(knownTargets[0]?.golongan || "6B");
  const [targetDivision, setTargetDivision] = useState(knownTargets[0]?.division || "");

  // Successor Candidate fields
  const [successorName, setSuccessorName] = useState("");
  const [successorNik, setSuccessorNik] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [successorGolongan, setSuccessorGolongan] = useState("5B");
  const [department, setDepartment] = useState("");
  const [readiness, setReadiness] = useState<ReadinessLevel>("READY_NOW");
  const [source, setSource] = useState<SuccessionSource>("INTERNAL_SUBDIV");
  const [priorityOrder, setPriorityOrder] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function handleTargetSelect(targetId: string) {
    setSelectedTargetChoice(targetId);
    if (targetId === "new") {
      setIncumbentName("");
      setPositionTitle("");
      setTargetGolongan("6A");
      setTargetDivision("");
    } else {
      const found = knownTargets.find((t) => t.id === targetId);
      if (found) {
        setIncumbentName(found.incumbentName);
        setPositionTitle(found.positionTitle);
        setTargetGolongan(found.golongan || "6A");
        setTargetDivision(found.division || "");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!incumbentName.trim()) {
      toast.error("Nama pejabat incumbent / posisi target wajib diisi.");
      return;
    }
    if (!successorName.trim()) {
      toast.error("Nama calon suksesor wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        targetIncumbentName: incumbentName.trim(),
        targetPositionTitle: positionTitle.trim() || "Leadership Target",
        targetGolongan: targetGolongan.trim(),
        targetDivision: targetDivision.trim(),
        targetDirectorate: "OPERATION & HSE DIRECTORATE",
        successorName: successorName.trim(),
        successorNik: successorNik.trim() || undefined,
        currentPosition: currentPosition.trim() || "Manager / Specialist",
        golongan: successorGolongan.trim(),
        department: department.trim() || undefined,
        readiness,
        source,
        priorityOrder: Number(priorityOrder) || 1,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/talent/succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan data suksesi");
      }

      toast.success(data.message || `Suksesor ${successorName} berhasil ditambahkan!`);
      // Reset form
      setSuccessorName("");
      setSuccessorNik("");
      setCurrentPosition("");
      setNotes("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Tambah Suksesor Manual (Succession Planning)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Petakan calon suksesor untuk pejabat posisi kunci dan tentukan tingkat kesiapannya.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* SECTION 1: TARGET PEJABAT / INCUMBENT */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              1. Posisi Kunci / Pejabat yang Digantikan (Incumbent)
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="targetSelect" className="text-xs font-semibold text-slate-700">
                  Pilih Pejabat Posisi Kunci
                </Label>
                <select
                  id="targetSelect"
                  value={selectedTargetChoice}
                  onChange={(e) => handleTargetSelect(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  {knownTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.incumbentName} — {t.positionTitle} ({t.golongan})
                    </option>
                  ))}
                  <option value="new">+ Tambah Pejabat / Posisi Kunci Baru...</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incumbentName" className="text-xs font-semibold text-slate-700">
                  Nama Pejabat (Incumbent) *
                </Label>
                <Input
                  id="incumbentName"
                  value={incumbentName}
                  onChange={(e) => setIncumbentName(e.target.value)}
                  placeholder="Misal: Arya Dhamar Nugraha"
                  className="h-8.5 text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="positionTitle" className="text-xs font-semibold text-slate-700">
                  Nama Jabatan Target *
                </Label>
                <Input
                  id="positionTitle"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="Misal: Mine Plan & Technical Services GM"
                  className="h-8.5 text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetGolongan" className="text-xs font-semibold text-slate-700">
                  Golongan Target
                </Label>
                <Input
                  id="targetGolongan"
                  value={targetGolongan}
                  onChange={(e) => setTargetGolongan(e.target.value)}
                  placeholder="Misal: 6A, 6B, 5D"
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetDivision" className="text-xs font-semibold text-slate-700">
                  Divisi / Unit Kerja
                </Label>
                <Input
                  id="targetDivision"
                  value={targetDivision}
                  onChange={(e) => setTargetDivision(e.target.value)}
                  placeholder="Misal: MINE PLANNING & TECH. SERVICES"
                  className="h-8.5 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CALON SUKSESOR */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-purple-600" />
              2. Data Calon Suksesor yang Dinominasikan
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="successorName" className="text-xs font-semibold text-slate-700">
                  Nama Lengkap Calon Suksesor *
                </Label>
                <Input
                  id="successorName"
                  value={successorName}
                  onChange={(e) => setSuccessorName(e.target.value)}
                  placeholder="Misal: Sutami Sitorus / Lukman Hakim"
                  className="h-8.5 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currentPosition" className="text-xs font-semibold text-slate-700">
                  Jabatan Calon Saat Ini
                </Label>
                <Input
                  id="currentPosition"
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  placeholder="Misal: Mine Planning Senior Manager"
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="successorGolongan" className="text-xs font-semibold text-slate-700">
                  Golongan Saat Ini
                </Label>
                <Input
                  id="successorGolongan"
                  value={successorGolongan}
                  onChange={(e) => setSuccessorGolongan(e.target.value)}
                  placeholder="Misal: 5B, 5C, 4F"
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="successorNik" className="text-xs font-semibold text-slate-700">
                  NIK Karyawan (Opsional)
                </Label>
                <Input
                  id="successorNik"
                  value={successorNik}
                  onChange={(e) => setSuccessorNik(e.target.value)}
                  placeholder="Misal: 11000414"
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-semibold text-slate-700">
                  Departemen Saat Ini (Opsional)
                </Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Misal: Mine Planning Dept"
                  className="h-8.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: STRATEGI & KESIAPAN */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              3. Kesiapan & Strategi Suksesi
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="readiness" className="text-xs font-semibold text-slate-700">
                  Tingkat Kesiapan (Readiness)
                </Label>
                <select
                  id="readiness"
                  value={readiness}
                  onChange={(e) => setReadiness(e.target.value as ReadinessLevel)}
                  className="w-full h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="READY_NOW">Ready Now (Siap Sekarang)</option>
                  <option value="READY_LATER">Ready Later (Pengembangan)</option>
                  <option value="GENERAL_CANDIDATE">Kandidat Suksesor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source" className="text-xs font-semibold text-slate-700">
                  Asal Sumber Suksesor
                </Label>
                <select
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as SuccessionSource)}
                  className="w-full h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="INTERNAL_SUBDIV">Internal Sub-Division</option>
                  <option value="OUTSIDE_ORGANIZATION">Outside Org / Lintas Divisi</option>
                  <option value="GENERAL">Umum</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priorityOrder" className="text-xs font-semibold text-slate-700">
                  Urutan Prioritas Pilihan
                </Label>
                <Input
                  id="priorityOrder"
                  type="number"
                  min={1}
                  max={20}
                  value={priorityOrder}
                  onChange={(e) => setPriorityOrder(Number(e.target.value) || 1)}
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                  Catatan / Keterangan (Opsional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Calon Prioritas 1 hasil kesepakatan People Review Q3"
                  className="text-xs bg-white min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Suksesor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
