"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { learningStatuses } from "@/lib/learning-monitoring-status";
import type { LearningActivityType, LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";
import { DUMMY_TRAINING_CATALOG, type TrainingCatalogItem } from "@/lib/services/training-catalog.service";

export type EditableLearningActivity = {
  employeePersonnelNumber: string;
  employeeName: string;
  activityKey: string;
  activityType: LearningActivityType;
  learningType: string;
  targetPosition: string;
  skillImprovement: string;
  programName: string;
  provider: string;
  timeline: string;
  budget?: string; // Terpisah dari Success Criteria
  status: LearningMonitoringStatus;
  successCriteria: string; // Terpisah dari Budget
  notes: string;
  version: number;
};

export function extractBudgetFromActivity(activity: EditableLearningActivity): string {
  if (activity.budget) return activity.budget;
  const matchNotes = activity.notes?.match(/\[Budget:\s*([^\]]+)\]/i);
  if (matchNotes) return matchNotes[1].trim();
  const matchCriteria = activity.successCriteria?.match(/Biaya:\s*([^·\n]+)/i);
  if (matchCriteria) return matchCriteria[1].trim();
  if (activity.activityType === "EXPERIENCE_70") return "Internal Site (OJT)";
  if (activity.activityType === "SOCIAL_20") return "Internal Mentoring";
  return "Rp 15.600.000 (WBS-OPS-TRN-2026)";
}

export function cleanSuccessCriteriaOnly(criteria: string): string {
  return criteria.replace(/Biaya:\s*[^·\n]+·?\s*/i, "").trim() || criteria;
}

export function LearningMonitoringEditor({
  activity,
  mode = "edit",
  onSaved,
}: {
  activity: EditableLearningActivity;
  mode?: "edit" | "create";
  onSaved?: (updatedActivity: EditableLearningActivity) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditableLearningActivity>(() => ({
    ...activity,
    budget: extractBudgetFromActivity(activity),
    successCriteria: cleanSuccessCriteriaOnly(activity.successCriteria),
  }));
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    setForm({
      ...activity,
      budget: extractBudgetFromActivity(activity),
      successCriteria: cleanSuccessCriteriaOnly(activity.successCriteria),
    });
    setSelectedCatalogId("");
  }, [activity]);

  const handleSelectCatalog = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const item = DUMMY_TRAINING_CATALOG.find((c) => c.id === catalogId);
    if (!item) return;

    setForm((current) => ({
      ...current,
      programName: `[${item.id}] ${item.trainingTitle}`,
      provider: `${item.vendor} (${item.stemType} - ${item.trainingType})`,
      skillImprovement: item.skill,
      timeline: item.date,
      budget: `Rp ${item.totalCost.toLocaleString("id-ID")} (${item.budgetCode})`,
      successCriteria: `Kelulusan sertifikasi evaluasi & pemenuhan pre-assessment: ${item.preAssessmentRequired}`,
      notes: `Disesuaikan oleh Leader dari Katalog Pelatihan (${item.budgetCode}).`,
    }));
    toast.info(`Memuat detail pelatihan: ${item.trainingTitle}`);
  };

  async function save() {
    setSaving(true);
    try {
      const activityKey = form.activityKey || `CUSTOM:${crypto.randomUUID()}`;
      const finalNotes = form.budget && !form.notes.includes(form.budget)
        ? `${form.notes || ""} [Budget: ${form.budget}]`.trim()
        : form.notes;

      const payload = {
        ...form,
        activityKey,
        notes: finalNotes,
      };

      const response = await fetch("/api/learning/monitoring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.error ?? "Monitoring gagal disimpan.");
        if (response.status === 409) router.refresh();
        return;
      }

      const newVersion =
        typeof body?.monitoring?.version === "number"
          ? body.monitoring.version
          : form.version + 1;

      toast.success(
        mode === "create"
          ? "Aktivitas development ditambahkan."
          : "Penyesuaian IDP oleh Leader tersimpan."
      );

      // LANGSUNG UPDATE DETAIL & VERSION DI SISI CLIENT SECARA REAKTIF
      const updatedActivity: EditableLearningActivity = {
        ...form,
        activityKey,
        budget: form.budget,
        notes: finalNotes,
        version: newVersion,
      };
      setForm(updatedActivity);
      onSaved?.(updatedActivity);

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Monitoring gagal disimpan. Periksa koneksi dan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof EditableLearningActivity, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {mode === "create" ? "Tambah Aktivitas" : "Edit IDP"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            {mode === "create" ? "Tambah Aktivitas Development" : `Penyesuaian Leader: ${activity.learningType}`}
          </DialogTitle>
          <DialogDescription>
            {activity.employeeName} ({activity.employeePersonnelNumber}) · Leader dapat menyesuaikan rekomendasi AI dengan memilih dari Katalog Training resmi Berau Coal.
          </DialogDescription>
        </DialogHeader>

        {/* Dropdown Pemilih Katalog Pelatihan Berau Coal */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Sparkles className="h-4 w-4 text-primary" />
            Pilih Cepat dari Katalog Pelatihan &amp; Budget (TNA 2026)
          </div>
          <p className="text-xs text-slate-600">
            Pilih program resmi di bawah ini untuk mengisi judul, vendor, biaya/budget, dan kriteria secara otomatis:
          </p>
          <Select value={selectedCatalogId} onValueChange={handleSelectCatalog}>
            <SelectTrigger className="bg-white border-primary/30 font-medium">
              <SelectValue placeholder="-- Pilih Program dari Katalog Pelatihan --" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {DUMMY_TRAINING_CATALOG.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs py-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">
                      [{c.stemType}] {c.trainingTitle}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.vendor} · Rp {c.totalCost.toLocaleString("id-ID")} · {c.budgetCode}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <FormField label="Target Position">
            <Input
              value={form.targetPosition}
              onChange={(event) => field("targetPosition", event.target.value)}
            />
          </FormField>

          {mode === "create" && (
            <FormField label="Learning Type">
              <Select
                value={form.activityType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    activityType: value as LearningActivityType,
                    learningType: learningTypeLabel(value as LearningActivityType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPERIENCE_70">70% Experience Learning</SelectItem>
                  <SelectItem value="SOCIAL_20">20% Social Learning</SelectItem>
                  <SelectItem value="FORMAL_10">10% Formal Learning</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          <FormField label="Status Pelaksanaan">
            <Select value={form.status} onValueChange={(value) => field("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {learningStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Kompetensi / Skill">
            <Input
              value={form.skillImprovement}
              onChange={(event) => field("skillImprovement", event.target.value)}
            />
          </FormField>

          <FormField label="Vendor Penyelenggara">
            <Input
              value={form.provider}
              onChange={(event) => field("provider", event.target.value)}
            />
          </FormField>

          <FormField label="Nama Pelatihan / Program" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={form.programName}
              onChange={(event) => field("programName", event.target.value)}
            />
          </FormField>

          <FormField label="Jadwal Pelaksanaan / Timeline">
            <Input
              value={form.timeline}
              onChange={(event) => field("timeline", event.target.value)}
              placeholder="Contoh: 15 - 19 Mei 2026 atau Q3 2026"
            />
          </FormField>

          {/* KOLOM TERPISAH: 1. BUDGET & BIAYA */}
          <FormField label="Budget & Estimasi Biaya (WBS / Cost Center)">
            <Input
              value={form.budget || ""}
              onChange={(event) => field("budget", event.target.value)}
              placeholder="Contoh: Rp 15.600.000 (CC-7140-ENGR)"
              className="font-medium text-emerald-800"
            />
          </FormField>

          {/* KOLOM TERPISAH: 2. KRITERIA KEBERHASILAN (SUCCESS CRITERIA) */}
          <FormField label="Kriteria Keberhasilan (Success Criteria)" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={form.successCriteria}
              onChange={(event) => field("successCriteria", event.target.value)}
              placeholder="Target evaluasi, kelulusan sertifikasi, atau bukti implementasi kerja"
            />
          </FormField>

          <FormField label="Catatan Penyesuaian Leader" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(event) => field("notes", event.target.value)}
              placeholder="Justifikasi leader, urgensi suksesi pit/plant, atau arahan khusus"
            />
          </FormField>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={save} disabled={saving} className="gap-2 font-bold bg-primary text-slate-950 hover:bg-primary/90">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Tambah Aktivitas" : "Simpan Penyesuaian Leader"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function learningTypeLabel(type: LearningActivityType) {
  if (type === "EXPERIENCE_70") return "70% Experience Learning";
  if (type === "SOCIAL_20") return "20% Social Learning";
  return "10% Formal Learning";
}

function FormField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
