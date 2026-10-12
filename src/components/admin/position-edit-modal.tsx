"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2,
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

export type PositionData = {
  id: string;
  positionCode: string;
  positionName: string;
  jobLevel: string;
  currentHolder: string | null;
  holderPersonnelNumber: string | null;
  reportsToId: string | null;
  departmentId: string;
  departmentName?: string;
};

export type DepartmentOption = {
  id: string;
  code: string;
  name: string;
  divisionName: string;
  directorateName: string;
};

export type PositionOption = {
  id: string;
  positionCode: string;
  positionName: string;
  jobLevel: string;
  currentHolder: string | null;
  holderPersonnelNumber: string | null;
  reportsToId: string | null;
  departmentId: string;
  departmentName: string;
  divisionName: string;
  directorateName: string;
};

const JOB_LEVELS = [
  "President Director",
  "Director",
  "KATT / Deputy Director",
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

export function PositionEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: PositionData | null;
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
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  // Load lookup options
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingOptions(true);
    fetch("/api/organization/positions")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.positions) setPositionsList(data.positions);
        if (data.departments) setDepartmentsList(data.departments);
      })
      .catch((err) => console.error("Failed to load options", err))
      .finally(() => {
        if (mounted) setLoadingOptions(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Sync initialData into form
  useEffect(() => {
    if (initialData) {
      setPositionName(initialData.positionName || "");
      setCurrentHolder(initialData.currentHolder || "");
      setHolderPersonnelNumber(initialData.holderPersonnelNumber || "");
      setJobLevel(initialData.jobLevel || "Staff");
      setReportsToId(initialData.reportsToId || "");
      setDepartmentId(initialData.departmentId || "");
      setSupervisorSearch("");
      setDeptSearch("");
    }
  }, [initialData]);

  // Filter supervisor options (excluding current node itself)
  const availableSupervisors = useMemo(() => {
    const list = positionsList.filter((p) => p.id !== initialData?.id);
    if (!supervisorSearch.trim()) return list;
    const q = supervisorSearch.toLowerCase();
    return list.filter(
      (p) =>
        (p.currentHolder || "").toLowerCase().includes(q) ||
        p.positionName.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q) ||
        (p.holderPersonnelNumber || "").includes(q),
    );
  }, [positionsList, initialData?.id, supervisorSearch]);

  // Filter department options
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!initialData?.id) return;

    if (!positionName.trim()) {
      toast.error("Nama posisi/jabatan wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/organization/positions/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionName: positionName.trim(),
          currentHolder: currentHolder.trim() || null,
          holderPersonnelNumber: holderPersonnelNumber.trim() || null,
          jobLevel: jobLevel.trim(),
          reportsToId: reportsToId || null,
          departmentId: departmentId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan perubahan posisi.");

      toast.success(json.message || "Data posisi berhasil diperbarui!");
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menonaktifkan posisi "${positionName}" (${currentHolder})? Bawahan dari posisi ini akan dialihkan ke atasannya.`,
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/organization/positions/${initialData.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menonaktifkan posisi.");

      toast.success("Posisi berhasil dinonaktifkan!");
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus posisi.");
    } finally {
      setDeleting(false);
    }
  }

  const selectedSupervisor = positionsList.find((p) => p.id === reportsToId);
  const selectedDepartment = departmentsList.find((d) => d.id === departmentId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-5 w-5 text-emerald-600" />
            Edit Data Posisi & Rantai Pelaporan
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Sesuaikan detail pemegang jabatan, level hierarki, dan atasan langsung secara manual.
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Section 1: Pemegang Jabatan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" /> Informasi Karyawan
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="holderName" className="text-xs font-semibold">Nama Pemegang Jabatan</Label>
                <Input
                  id="holderName"
                  value={currentHolder}
                  onChange={(e) => setCurrentHolder(e.target.value)}
                  placeholder="Contoh: Arief Wiedhartono"
                  className="bg-white text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="holderNik" className="text-xs font-semibold">NIK (Personnel Number)</Label>
                <Input
                  id="holderNik"
                  value={holderPersonnelNumber}
                  onChange={(e) => setHolderPersonnelNumber(e.target.value)}
                  placeholder="Contoh: 11000308"
                  className="bg-white text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Posisi & Tingkatan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" /> Jabatan & Level Organisasi
            </h4>
            <div className="space-y-1">
              <Label htmlFor="posName" className="text-xs font-semibold">Nama Posisi / Jabatan *</Label>
              <Input
                id="posName"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="Contoh: Chief of Technical & Mining"
                required
                className="bg-white text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="jobLevel" className="text-xs font-semibold">Level / Kategori Jabatan</Label>
              <select
                id="jobLevel"
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

          {/* Section 3: Atasan Langsung (Reports To) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" /> Atasan Langsung (Reports To)
              </h4>
              {reportsToId ? (
                <button
                  type="button"
                  onClick={() => setReportsToId("")}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Set sebagai Root (Tanpa Atasan)
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Puncak Pohon (Root)
                </span>
              )}
            </div>

            {selectedSupervisor && (
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">{selectedSupervisor.currentHolder || "Tanpa Nama"}</span>
                  <span className="text-slate-600"> — {selectedSupervisor.positionName}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedSupervisor.departmentName}</p>
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
                  placeholder="Cari nama atasan, jabatan, atau NIK..."
                  className="bg-white text-xs pl-8 h-8.5"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => setReportsToId("")}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    !reportsToId ? "bg-amber-50 font-bold text-amber-900" : "text-slate-600"
                  }`}
                >
                  <span>-- Tidak Ada Atasan (Puncak Pimpinan Utama / Root) --</span>
                  {!reportsToId && <Check className="h-3.5 w-3.5 text-amber-600" />}
                </button>

                {availableSupervisors.slice(0, 40).map((sup) => (
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
                      <p className="text-[10px] text-slate-500 truncate">
                        {sup.positionName} • {sup.departmentName}
                      </p>
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
              <Building className="h-3.5 w-3.5 text-slate-500" /> Penempatan Departemen
            </h4>

            {selectedDepartment && (
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2 text-xs text-blue-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">{selectedDepartment.name}</span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {selectedDepartment.divisionName} • {selectedDepartment.directorateName}
                  </p>
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
                  placeholder="Cari nama departemen atau divisi..."
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
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">{dept.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {dept.divisionName} • {dept.directorateName}
                      </p>
                    </div>
                    {departmentId === dept.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1.5"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Nonaktifkan Posisi
            </Button>

            <div className="flex items-center gap-2 justify-end">
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
                    <Save className="h-3.5 w-3.5" /> Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
