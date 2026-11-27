"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, UserCheck, ShieldCheck, Briefcase, ChevronDown, Check } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReadinessLevel, SuccessionSource, SuccessionTarget } from "@/lib/services/succession.service";

export interface SuccessionEmployeeOption {
  name: string;
  nik?: string;
  currentPosition?: string;
  golongan?: string;
  department?: string;
  division?: string;
}

interface SuccessionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  knownTargets: SuccessionTarget[];
  availableEmployees?: SuccessionEmployeeOption[];
  managerEmployees?: SuccessionEmployeeOption[];
  divisions?: string[];
  positions?: string[];
  golongans?: string[];
  onSuccess?: () => void;
}

// Komponen Dropdown Kotak Kecil (Web-based, bukan popup native Mac/Safari yang melayang ke atas)
interface OptionItem {
  value: string;
  label: string;
  header?: boolean;
}

function CompactSelect({
  value,
  onChange,
  options,
  placeholder = "-- Pilih --",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: OptionItem[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selected = options.find((o) => !o.header && o.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 text-left transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-600",
          className
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-lg text-xs">
          {options.map((opt, idx) => {
            if (opt.header) {
              return (
                <div
                  key={idx}
                  className="bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 sticky top-0"
                >
                  {opt.label}
                </div>
              );
            }
            const isSelected = opt.value === value;
            return (
              <div
                key={idx}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "cursor-pointer px-2.5 py-1.5 hover:bg-slate-100 text-slate-800 truncate flex items-center justify-between",
                  isSelected ? "bg-indigo-50 text-indigo-900 font-semibold" : ""
                )}
                title={opt.label}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-1" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SuccessionCreateModal({
  isOpen,
  onClose,
  knownTargets = [],
  availableEmployees = [],
  managerEmployees = [],
  divisions = [],
  positions = [],
  golongans = [],
  onSuccess,
}: SuccessionCreateModalProps) {
  // Section 1: Incumbent & Posisi Target
  const [incumbentChoice, setIncumbentChoice] = useState("");
  const [incumbentName, setIncumbentName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [targetGolongan, setTargetGolongan] = useState("6A");
  const [targetDivision, setTargetDivision] = useState("");

  // Section 2: Suksesor
  const [selectedSuccessor, setSelectedSuccessor] = useState("");
  const [successorName, setSuccessorName] = useState("");
  const [successorNik, setSuccessorNik] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [successorGolongan, setSuccessorGolongan] = useState("5B");
  const [department, setDepartment] = useState("");

  // Section 3: Evaluasi
  const [readiness, setReadiness] = useState<ReadinessLevel>("READY_NOW");
  const [source, setSource] = useState<SuccessionSource>("INTERNAL_SUBDIV");
  const [priorityOrder, setPriorityOrder] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Opsi Incumbent
  const incumbentOptions: OptionItem[] = [
    { value: "", label: "-- Pilih Incumbent Posisi Kunci --" },
    ...(knownTargets.length > 0
      ? [
          { value: "HDR_TARGETS", label: "Posisi Kunci di Pipeline Saat Ini", header: true },
          ...knownTargets.map((t) => ({
            value: `TARGET:${t.id}`,
            label: `${t.incumbentName} — ${t.positionTitle} (${t.golongan})`,
          })),
        ]
      : []),
    ...(managerEmployees.length > 0
      ? [
          { value: "HDR_MANAGERS", label: `Pejabat Manager ke Atas (${managerEmployees.length})`, header: true },
          ...managerEmployees.map((m) => {
            const key = m.nik || m.name;
            return {
              value: key,
              label: `${m.name} — ${m.currentPosition || "Manager"} (${m.golongan || "-"})`,
            };
          }),
        ]
      : []),
  ];

  // Opsi Suksesor
  const successorOptions: OptionItem[] = [
    { value: "", label: "-- Pilih Calon Suksesor dari Database --" },
    ...availableEmployees.map((emp) => {
      const key = emp.nik || emp.name;
      return {
        value: key,
        label: `${emp.name} — ${emp.currentPosition || "Staff"} (${emp.golongan || "-"})`,
      };
    }),
  ];

  // Opsi Jabatan
  const positionOptions: OptionItem[] = [
    { value: "", label: "-- Pilih Jabatan --" },
    ...positions.map((p) => ({ value: p, label: p })),
  ];

  // Opsi Golongan
  const standardGolongans = ["6A", "6B", "5C", "5B", "5A", "6C", "6D", "7", "7A"];
  const allGolongans = [
    ...standardGolongans,
    ...golongans.filter((g) => !standardGolongans.includes(g)),
  ];
  const golonganOptions: OptionItem[] = allGolongans.map((g) => ({ value: g, label: g }));

  // Opsi Divisi
  const divisionOptions: OptionItem[] = [
    { value: "", label: "-- Pilih Divisi / Departemen --" },
    ...divisions.map((d) => ({ value: d, label: d })),
  ];

  function handleIncumbentSelect(val: string) {
    setIncumbentChoice(val);
    if (!val) {
      setIncumbentName("");
      setPositionTitle("");
      setTargetGolongan("6A");
      setTargetDivision("");
      return;
    }

    if (val.startsWith("TARGET:")) {
      const targetId = val.replace("TARGET:", "");
      const foundTarget = knownTargets.find((t) => t.id === targetId);
      if (foundTarget) {
        setIncumbentName(foundTarget.incumbentName);
        setPositionTitle(foundTarget.positionTitle);
        setTargetGolongan(foundTarget.golongan || "6A");
        setTargetDivision(foundTarget.division || "");
        return;
      }
    }

    const foundManager = managerEmployees.find(
      (m) => (m.nik && m.nik === val) || m.name === val
    );
    if (foundManager) {
      setIncumbentName(foundManager.name);
      setPositionTitle(foundManager.currentPosition || "");
      setTargetGolongan(foundManager.golongan || "6A");
      setTargetDivision(foundManager.division || foundManager.department || "");
    }
  }

  function handleSuccessorSelect(val: string) {
    setSelectedSuccessor(val);
    if (!val) {
      setSuccessorName("");
      setSuccessorNik("");
      setCurrentPosition("");
      setSuccessorGolongan("5B");
      setDepartment("");
      return;
    }

    const found = availableEmployees.find(
      (e) => (e.nik && e.nik === val) || e.name === val
    );
    if (found) {
      setSuccessorName(found.name);
      setSuccessorNik(found.nik || "");
      setCurrentPosition(found.currentPosition || "");
      setSuccessorGolongan(found.golongan || "5B");
      setDepartment(found.department || found.division || "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!incumbentName.trim()) {
      toast.error("Pilih Incumbent Posisi Kunci.");
      return;
    }
    if (!positionTitle.trim()) {
      toast.error("Pilih Jabatan Target.");
      return;
    }
    if (!successorName.trim()) {
      toast.error("Pilih Calon Suksesor.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        targetIncumbentName: incumbentName.trim(),
        targetPositionTitle: positionTitle.trim(),
        targetGolongan: targetGolongan.trim() || "6A",
        targetDivision: targetDivision.trim(),
        targetDirectorate: "OPERATION & HSE DIRECTORATE",
        successorName: successorName.trim(),
        successorNik: successorNik.trim() || undefined,
        currentPosition: currentPosition.trim() || "Specialist",
        golongan: successorGolongan.trim() || "5B",
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
        throw new Error(data.error || "Gagal menyimpan data");
      }

      toast.success(data.message || `Suksesor ${successorName} berhasil ditambahkan!`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-5">
        <DialogHeader className="border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold shrink-0">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Tambah Suksesor Manual
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">
                Pilih posisi kunci incumbent dan calon suksesor dari database.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2 text-xs">
          {/* ========================================================================= */}
          {/* 1. INCUMBENT POSISI KUNCI                                                 */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              1. Incumbent Posisi Kunci (Level Manager ke Atas)
            </p>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-600">Pilih Incumbent *</Label>
              <CompactSelect
                value={incumbentChoice}
                onChange={handleIncumbentSelect}
                options={incumbentOptions}
                placeholder="-- Pilih Incumbent Posisi Kunci --"
              />
            </div>

            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-slate-600">Jabatan Target *</Label>
                <CompactSelect
                  value={positionTitle}
                  onChange={setPositionTitle}
                  options={positionOptions}
                  placeholder="-- Pilih Jabatan Target --"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Golongan *</Label>
                <CompactSelect
                  value={targetGolongan}
                  onChange={setTargetGolongan}
                  options={golonganOptions}
                  placeholder="-- Golongan --"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label className="text-[11px] text-slate-600">Divisi / Unit Kerja *</Label>
                <CompactSelect
                  value={targetDivision}
                  onChange={setTargetDivision}
                  options={divisionOptions}
                  placeholder="-- Pilih Divisi / Unit Kerja --"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. CALON SUKSESOR                                                         */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <UserCheck className="h-3.5 w-3.5 text-purple-600" />
              2. Calon Suksesor yang Dinominasikan
            </p>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-600">Pilih Calon Suksesor dari Database *</Label>
              <CompactSelect
                value={selectedSuccessor}
                onChange={handleSuccessorSelect}
                options={successorOptions}
                placeholder="-- Pilih Calon Suksesor dari Database --"
              />
            </div>

            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-slate-600">Jabatan Calon</Label>
                <CompactSelect
                  value={currentPosition}
                  onChange={setCurrentPosition}
                  options={positionOptions}
                  placeholder="-- Pilih Jabatan --"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Golongan Calon</Label>
                <CompactSelect
                  value={successorGolongan}
                  onChange={setSuccessorGolongan}
                  options={golonganOptions}
                  placeholder="-- Golongan --"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label className="text-[11px] text-slate-600">Departemen / Divisi Calon</Label>
                <CompactSelect
                  value={department}
                  onChange={setDepartment}
                  options={divisionOptions}
                  placeholder="-- Pilih Dept / Divisi --"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. EVALUASI KESIAPAN                                                      */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
              3. Evaluasi Kesiapan & Prioritas
            </p>

            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Kesiapan *</Label>
                <select
                  value={readiness}
                  onChange={(e) => setReadiness(e.target.value as ReadinessLevel)}
                  className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="READY_NOW">Ready Now (Siap Sekarang)</option>
                  <option value="READY_LATER">Ready Later (&gt; 1 Thn)</option>
                  <option value="LONG_TERM">Pipeline (&gt; 2 Thn)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Sumber *</Label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as SuccessionSource)}
                  className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="INTERNAL_SUBDIV">Internal Dept</option>
                  <option value="INTERNAL_DIV">Lintas Dept (1 Divisi)</option>
                  <option value="CROSS_DIVISION">Lintas Divisi</option>
                  <option value="EXTERNAL">External Hire</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Prioritas *</Label>
                <select
                  value={priorityOrder}
                  onChange={(e) => setPriorityOrder(Number(e.target.value))}
                  className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value={1}>1 — Prioritas Utama</option>
                  <option value={2}>2 — Cadangan 1</option>
                  <option value={3}>3 — Cadangan 2</option>
                  <option value={4}>4 — Cadangan 3</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label className="text-[11px] text-slate-600">Catatan Khusus (Opsional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan kesiapan / pertimbangan rotasi..."
                  rows={2}
                  className="text-xs bg-white py-1.5"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 px-3.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Simpan Suksesor</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
