"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Check,
  Loader2,
  Plus,
  Save,
  Search,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentOption, PositionOption } from "./position-edit-modal";

const JOB_LEVELS = [
  "Director",
  "GM / Head",
  "Sr Manager",
  "Manager",
  "Superintendent / Sr Specialist",
  "Supervisor / Specialist",
  "Engineer / Officer",
  "Foreman / Group Leader",
  "Staff",
  "Operator / Technician",
];

export function PositionCreateModal({
  isOpen,
  onClose,
  defaultReportsToId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultReportsToId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [positionName, setPositionName] = useState("");
  const [currentHolder, setCurrentHolder] = useState("");
  const [holderPersonnelNumber, setHolderPersonnelNumber] = useState("");
  const [jobLevel, setJobLevel] = useState("Staff");
  const [reportsToId, setReportsToId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");

  const [positionsList, setPositionsList] = useState<PositionOption[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  // Load lookup options
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/organization/positions")
      .then((res) => res.json())
      .then((data) => {
        if (data.positions) setPositionsList(data.positions);
        if (data.departments) {
          setDepartmentsList(data.departments);
          if (!departmentId && data.departments.length > 0) {
            setDepartmentId(data.departments[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load options", err));
  }, [isOpen]);

  useEffect(() => {
    if (defaultReportsToId) {
      setReportsToId(defaultReportsToId);
    }
  }, [defaultReportsToId]);

  const availableSupervisors = useMemo(() => {
    if (!supervisorSearch.trim()) return positionsList;
    const q = supervisorSearch.toLowerCase();
    return positionsList.filter(
      (p) =>
        (p.currentHolder || "").toLowerCase().includes(q) ||
        p.positionName.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q) ||
        (p.holderPersonnelNumber || "").includes(q),
    );
  }, [positionsList, supervisorSearch]);

  const availableDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departmentsList;
    const q = deptSearch.toLowerCase();
    return departmentsList.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.divisionName.toLowerCase().includes(q) ||
        d.directorateName.toLowerCase().includes(q),
    );
  }, [departmentsList, deptSearch]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!positionName.trim()) {
      toast.error("Nama posisi/jabatan wajib diisi.");
      return;
    }
    if (!departmentId) {
      toast.error("Departemen wajib dipilih.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/organization/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionName: positionName.trim(),
          currentHolder: currentHolder.trim() || null,
          holderPersonnelNumber: holderPersonnelNumber.trim() || null,
          jobLevel: jobLevel.trim(),
          reportsToId: reportsToId || null,
          departmentId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan posisi baru.");

      toast.success(json.message || "Posisi baru berhasil ditambahkan!");
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan posisi.");
    } finally {
      setSaving(false);
    }
  }

  const selectedSupervisor = positionsList.find((p) => p.id === reportsToId);
  const selectedDepartment = departmentsList.find((d) => d.id === departmentId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="h-5 w-5 text-emerald-600" />
            Tambah Posisi / Jabatan Baru
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Daftarkan posisi atau karyawan baru langsung ke dalam struktur organisasi.
          </p>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          {/* Section 1: Pemegang Jabatan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" /> Informasi Karyawan
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="holderNameNew" className="text-xs font-semibold">Nama Pemegang Jabatan</Label>
                <Input
                  id="holderNameNew"
                  value={currentHolder}
                  onChange={(e) => setCurrentHolder(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="bg-white text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="holderNikNew" className="text-xs font-semibold">NIK Karyawan</Label>
                <Input
                  id="holderNikNew"
                  value={holderPersonnelNumber}
                  onChange={(e) => setHolderPersonnelNumber(e.target.value)}
                  placeholder="Contoh: 11002001"
                  className="bg-white text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Posisi & Level */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" /> Posisi & Level Organisasi
            </h4>
            <div className="space-y-1">
              <Label htmlFor="posNameNew" className="text-xs font-semibold">Nama Posisi / Jabatan *</Label>
              <Input
                id="posNameNew"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="Contoh: Mining Operations Superintendent"
                required
                className="bg-white text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="jobLevelNew" className="text-xs font-semibold">Level / Kategori Jabatan</Label>
              <select
                id="jobLevelNew"
                value={jobLevel}
                onChange={(e) => setJobLevel(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {JOB_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Atasan Langsung */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" /> Atasan Langsung (Reports To)
              </h4>
              {reportsToId && (
                <button
                  type="button"
                  onClick={() => setReportsToId("")}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Set Tanpa Atasan (Root)
                </button>
              )}
            </div>

            {selectedSupervisor && (
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">{selectedSupervisor.currentHolder || "Tanpa Nama"}</span>
                  <span className="text-slate-600"> — {selectedSupervisor.positionName}</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                  Terpilih
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={supervisorSearch}
                  onChange={(e) => setSupervisorSearch(e.target.value)}
                  placeholder="Cari nama atasan..."
                  className="bg-white text-xs pl-8 h-8.5"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                {availableSupervisors.slice(0, 30).map((sup) => (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => setReportsToId(sup.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50/50 transition-colors ${
                      reportsToId === sup.id ? "bg-emerald-50 font-bold text-emerald-950" : "text-slate-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">
                        {sup.currentHolder || "Tanpa Nama"} <span className="text-slate-500">({sup.holderPersonnelNumber || sup.positionCode})</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{sup.positionName}</p>
                    </div>
                    {reportsToId === sup.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Departemen */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" /> Penempatan Departemen *
            </h4>

            {selectedDepartment && (
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2 text-xs text-blue-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">{selectedDepartment.name}</span>
                  <p className="text-[10px] text-slate-600 mt-0.5">{selectedDepartment.divisionName}</p>
                </div>
                <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                  Terpilih
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Cari departemen..."
                  className="bg-white text-xs pl-8 h-8.5"
                />
              </div>

              <div className="max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                {availableDepartments.slice(0, 30).map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setDepartmentId(dept.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50/50 transition-colors ${
                      departmentId === dept.id ? "bg-blue-50 font-bold text-blue-950" : "text-slate-800"
                    }`}
                  >
                    <p className="truncate font-medium">{dept.name}</p>
                    {departmentId === dept.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Tambahkan Posisi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
