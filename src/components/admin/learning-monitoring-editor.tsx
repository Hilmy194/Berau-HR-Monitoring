"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { learningStatuses } from "@/lib/learning-monitoring-status";
import type { LearningActivityType, LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";

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
  status: LearningMonitoringStatus;
  successCriteria: string;
  notes: string;
  version: number;
};

export function LearningMonitoringEditor({ activity, mode = "edit" }: { activity: EditableLearningActivity; mode?: "edit" | "create" }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(activity);
  const router = useRouter();

  useEffect(() => setForm(activity), [activity]);

  async function save() {
    setSaving(true);
    try {
      const activityKey = form.activityKey || `CUSTOM:${crypto.randomUUID()}`;
      const response = await fetch("/api/learning/monitoring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, activityKey }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.error ?? "Monitoring gagal disimpan.");
        if (response.status === 409) router.refresh();
        return;
      }
      toast.success(mode === "create" ? "Aktivitas development ditambahkan." : "Monitoring Learning tersimpan.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Monitoring gagal disimpan. Periksa koneksi dan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof EditableLearningActivity, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-2">
          {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {mode === "create" ? "Tambah Aktivitas" : "Edit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah aktivitas development" : `Edit monitoring ${activity.learningType}`}</DialogTitle>
          <DialogDescription>{activity.employeeName} · {activity.employeePersonnelNumber}. Perubahan disimpan terpisah dari master BigQuery.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Target Position"><Input value={form.targetPosition} onChange={(event) => field("targetPosition", event.target.value)} /></FormField>
          {mode === "create" && <FormField label="Learning Type">
            <Select value={form.activityType} onValueChange={(value) => setForm((current) => ({
              ...current,
              activityType: value as LearningActivityType,
              learningType: learningTypeLabel(value as LearningActivityType),
            }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPERIENCE_70">70% Experience Learning</SelectItem>
                <SelectItem value="SOCIAL_20">20% Social Learning</SelectItem>
                <SelectItem value="FORMAL_10">10% Formal Learning</SelectItem>
              </SelectContent>
            </Select>
          </FormField>}
          <FormField label="Status">
            <Select value={form.status} onValueChange={(value) => field("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{learningStatuses.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Skill Improvement"><Input value={form.skillImprovement} onChange={(event) => field("skillImprovement", event.target.value)} /></FormField>
          <FormField label="Provider"><Input value={form.provider} onChange={(event) => field("provider", event.target.value)} /></FormField>
          <FormField label="Program / Training / Project" className="sm:col-span-2"><Textarea value={form.programName} onChange={(event) => field("programName", event.target.value)} /></FormField>
          <FormField label="Timeline"><Input value={form.timeline} onChange={(event) => field("timeline", event.target.value)} placeholder="Contoh: Q4 2026 atau 90 hari" /></FormField>
          <FormField label="Success Criteria" className="sm:col-span-2"><Textarea value={form.successCriteria} onChange={(event) => field("successCriteria", event.target.value)} /></FormField>
          <FormField label="Catatan Monitoring" className="sm:col-span-2"><Textarea value={form.notes} onChange={(event) => field("notes", event.target.value)} placeholder="Progress, kendala, atau tindak lanjut" /></FormField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
          <Button type="button" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "create" ? "Tambah Aktivitas" : "Simpan Monitoring"}</Button>
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

function FormField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
}

