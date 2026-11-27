"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileCheck2,
  GitBranch,
  Loader2,
  Milestone,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableShell } from "@/components/admin/hr-module-ui";
import {
  LearningMonitoringEditor,
  extractBudgetFromActivity,
  cleanSuccessCriteriaOnly,
  type EditableLearningActivity,
} from "@/components/admin/learning-monitoring-editor";
import { learningStatusLabel } from "@/lib/learning-monitoring-status";
import type { LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";
import type { CareerPathSimulationData } from "@/lib/services/career-path-idp.service";
import type { EmployeeTrainingRequest } from "@/lib/services/training-catalog.service";
import { cn } from "@/lib/utils";

export interface IdpActivityWithAlignment extends EditableLearningActivity {
  aiBaselineProgram?: string;
  aiBaselineProvider?: string;
  alignment: {
    aiBaseline: {
      label: string;
      badgeClass: string;
      originalProgram?: string;
    };
    leadReview: {
      status: string;
      label: string;
      badgeClass: string;
      isModified?: boolean;
      leaderNotes?: string;
    };
    employeeTraining: {
      status: string;
      label: string;
      badgeClass: string;
      matchedRequestTitle?: string;
      matchedRequestStatus?: string;
      isMismatch?: boolean;
      detail?: string;
    };
  };
}

export interface IdpCandidateTarget {
  key: string;
  rawPositionTitle: string;
  targetPositionTitle: string;
  targetIncumbentName: string;
  targetDivision?: string;
  targetDirectorate?: string;
  readiness: string;
  source: string;
  gap: string;
  priority: string;
  hasAiDefault?: boolean;
  activities: IdpActivityWithAlignment[];
}

export interface IdpEmployeeSection {
  id: string;
  profileId: string;
  employeeName: string;
  currentPosition: string;
  department: string;
  division: string;
  directorate: string;
  isCandidate: boolean;
  candidateTarget?: IdpCandidateTarget;
  candidateTargets?: IdpCandidateTarget[];
  currentGapTarget: {
    targetPositionTitle: string;
    gap: string;
    priority: string;
    hasAiDefault?: boolean;
    activities: IdpActivityWithAlignment[];
  };
  careerPathTarget: CareerPathSimulationData & {
    activities: IdpActivityWithAlignment[];
  };
}

export type IdpDetailMode = "succession" | "current_gap" | "career_path";

interface IdpDetailDialogProps {
  selectedEmployee: IdpEmployeeSection | null;
  detailMode: IdpDetailMode;
  onChangeDetailMode: (mode: IdpDetailMode) => void;
  onClose: () => void;
  trainingRequests?: EmployeeTrainingRequest[];
  canEdit?: boolean;
  canApprove?: boolean;
  onActivityUpdated?: (updated: EditableLearningActivity) => void;
  onOpenReviewModal?: (
    req: EmployeeTrainingRequest,
    decision: "APPROVED_BY_LEADER" | "REJECTED_BY_LEADER"
  ) => void;
}

export function IdpDetailDialog({
  selectedEmployee,
  detailMode,
  onChangeDetailMode,
  onClose,
  trainingRequests = [],
  canEdit = false,
  canApprove = false,
  onActivityUpdated,
  onOpenReviewModal,
}: IdpDetailDialogProps) {
  const router = useRouter();
  const [generatingSuccAi, setGeneratingSuccAi] = useState(false);
  const [selectedSuccIdx, setSelectedSuccIdx] = useState(0);

  useEffect(() => {
    setSelectedSuccIdx(0);
  }, [selectedEmployee?.id]);

  async function handleGenerateSuccessionAi(emp: IdpEmployeeSection, target?: IdpCandidateTarget) {
    const active = target ?? emp.candidateTargets?.[0] ?? emp.candidateTarget;
    if (!active) return;
    setGeneratingSuccAi(true);
    try {
      const cleanTarget =
        active.rawPositionTitle || active.targetPositionTitle.replace(/\s*\(Suksesor.*\)$/i, "").trim();
      const res = await fetch("/api/admin/talent-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisType: "SUCCESSION_IDP",
          employeeId: emp.profileId,
          targetPosition: cleanTarget,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Gagal generate AI Succession IDP.");
      }
      toast.success(`AI Succession IDP untuk ${cleanTarget} berhasil dibuat & disimpan ke database!`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal generate AI Succession IDP.");
    } finally {
      setGeneratingSuccAi(false);
    }
  }

  function requestsFor(section: IdpEmployeeSection) {
    return trainingRequests.filter(
      (r) =>
        r.employeePersonnelNumber === section.profileId ||
        r.employeeName.toLowerCase().trim() === section.employeeName.toLowerCase().trim()
    );
  }

  return (
    <Dialog open={Boolean(selectedEmployee)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {selectedEmployee && (() => {
          const candidateTargets =
            selectedEmployee.candidateTargets && selectedEmployee.candidateTargets.length > 0
              ? selectedEmployee.candidateTargets
              : selectedEmployee.candidateTarget
                ? [selectedEmployee.candidateTarget]
                : [];
          const activeCandidateTarget =
            candidateTargets[selectedSuccIdx] ?? candidateTargets[0];
          const hasSuccessionPlan = Boolean(selectedEmployee.isCandidate && activeCandidateTarget);
          const effectiveMode: IdpDetailMode =
            detailMode === "succession" && !hasSuccessionPlan ? "current_gap" : detailMode;
          const isSucc = effectiveMode === "succession" && hasSuccessionPlan;
          const targetTitle =
            isSucc && activeCandidateTarget
              ? activeCandidateTarget.targetPositionTitle
              : effectiveMode === "career_path"
                ? selectedEmployee.careerPathTarget.targetPositionTitle
                : selectedEmployee.currentGapTarget.targetPositionTitle;
          const gapText =
            isSucc && activeCandidateTarget
              ? activeCandidateTarget.gap
              : effectiveMode === "career_path"
                ? selectedEmployee.careerPathTarget.crossFunctionalGaps.join(" • ")
                : selectedEmployee.currentGapTarget.gap;
          const targetLabel = isSucc
            ? "Target Posisi Suksesi"
            : effectiveMode === "career_path"
              ? "Target Jalur Karier (Rotasi)"
              : "Target Posisi Pengembangan";
          const gapLabel = isSucc
            ? "Kebutuhan Kesiapan Suksesor"
            : effectiveMode === "career_path"
              ? "Gap Pengalaman Lintas Fungsi"
              : "Gap Kompetensi (AI)";
          const activitiesToDisplay =
            isSucc && activeCandidateTarget
              ? activeCandidateTarget.activities
              : effectiveMode === "career_path"
                ? selectedEmployee.careerPathTarget.activities
                : selectedEmployee.currentGapTarget.activities;
          const leadModifiedCount = activitiesToDisplay.filter(
            (a) => a.alignment.leadReview.status === "MODIFIED"
          ).length;
          const registeredCount = activitiesToDisplay.filter((a) =>
            ["APPROVED", "REGISTERED", "PENDING_APPROVAL", "COMPLETED"].includes(
              a.alignment.employeeTraining.status
            )
          ).length;
          const mismatchCount = activitiesToDisplay.filter(
            (a) => a.alignment.employeeTraining.isMismatch
          ).length;
          const initials = selectedEmployee.employeeName
            .split(" ")
            .slice(0, 2)
            .map((p) => p[0])
            .join("");
          const tabs = [
            ...(hasSuccessionPlan
              ? [{ key: "succession" as const, label: "Succession Plan", icon: Sparkles }]
              : []),
            { key: "current_gap" as const, label: "Current Gap", icon: Target },
            { key: "career_path" as const, label: "Career Path", icon: Milestone },
          ];

          return (
            <>
              {/* HEADER */}
              <DialogHeader className="space-y-0 border-b border-slate-200 bg-white px-6 pb-0 pt-5 text-left">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-lg font-semibold text-slate-900">
                          {selectedEmployee.employeeName}
                        </DialogTitle>
                        {selectedEmployee.isCandidate && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
                            <Sparkles className="h-3 w-3" /> Kandidat Suksesi
                          </span>
                        )}
                      </div>
                      <DialogDescription className="mt-0.5 text-xs text-slate-500">
                        {selectedEmployee.currentPosition} · {selectedEmployee.department} · NIK{" "}
                        {selectedEmployee.profileId}
                      </DialogDescription>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Masa jabatan:{" "}
                        <span className="font-medium text-slate-700">
                          {selectedEmployee.careerPathTarget.currentPositionDuration}
                        </span>
                        {" · "}
                        <span className="font-medium text-slate-700">
                          {selectedEmployee.careerPathTarget.rotationNeedLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                  {canEdit && onActivityUpdated && (
                    <div className="shrink-0">
                      <LearningMonitoringEditor
                        activity={newManualActivity(
                          selectedEmployee,
                          targetTitle,
                          gapText,
                          effectiveMode,
                          candidateTargets.length > 1 ? activeCandidateTarget?.key : undefined
                        )}
                        mode="create"
                        onSaved={onActivityUpdated}
                      />
                    </div>
                  )}
                </div>

                {/* TABS */}
                <div className="-mb-px mt-4 flex gap-1 overflow-x-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => onChangeDetailMode(t.key)}
                      className={cn(
                        "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors",
                        effectiveMode === t.key
                          ? "border-slate-900 text-slate-900"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </DialogHeader>

              {/* BODY */}
              <div className="min-w-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-6">
                {isSucc && candidateTargets.length > 1 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Target Suksesi Terdaftar ({candidateTargets.length})
                      </p>
                      <span className="text-[11px] text-slate-400">Pilih target untuk melihat IDP spesifik</span>
                    </div>
                    <div
                      className={cn(
                        "grid gap-2.5",
                        candidateTargets.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
                      )}
                    >
                      {candidateTargets.map((target, idx) => {
                        const isSelected = idx === selectedSuccIdx;
                        return (
                          <button
                            key={target.key}
                            type="button"
                            onClick={() => setSelectedSuccIdx(idx)}
                            className={cn(
                              "flex h-full flex-col justify-between rounded-lg border p-3 text-left transition-all",
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            <div className="w-full space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                    isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  Target #{idx + 1}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-medium",
                                    isSelected
                                      ? "text-emerald-300"
                                      : target.readiness === "READY_NOW"
                                        ? "text-emerald-700"
                                        : "text-amber-700"
                                  )}
                                >
                                  {target.readiness === "READY_NOW" ? "Ready Now" : "Ready Later"}
                                </span>
                              </div>
                              <p className={cn("text-xs font-semibold leading-snug line-clamp-2", isSelected ? "text-white" : "text-slate-900")}>
                                {target.rawPositionTitle}
                              </p>
                            </div>
                            <p className={cn("mt-2 truncate text-[11px]", isSelected ? "text-slate-300" : "text-slate-500")}>
                              {target.targetIncumbentName}
                              {target.targetDivision ? ` · ${target.targetDivision}` : ""}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TARGET & GAP */}
                <section className="grid min-w-0 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-2">
                  <div className="min-w-0 bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {targetLabel}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">
                      {targetTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      dari {selectedEmployee.currentPosition}
                    </p>
                    {isSucc && activeCandidateTarget && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-indigo-700">
                          Disiapkan untuk suksesi{" "}
                          {activeCandidateTarget.targetIncumbentName}
                          {activeCandidateTarget.targetDivision ? ` (${activeCandidateTarget.targetDivision})` : ""} ·{" "}
                          {activeCandidateTarget.readiness === "READY_NOW"
                            ? "Ready Now"
                            : "Ready Later"}
                        </p>
                        {canEdit && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={generatingSuccAi}
                            onClick={() => handleGenerateSuccessionAi(selectedEmployee, activeCandidateTarget)}
                            className="h-6 px-2 text-[10px] font-semibold gap-1 border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100"
                          >
                            {generatingSuccAi ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            <span>{activeCandidateTarget.hasAiDefault ? "Regenerate AI IDP" : "Generate AI Succession IDP"}</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {gapLabel}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {gapText || "-"}
                    </p>
                  </div>
                </section>

                {/* CAREER PATH (Ringkas & Scannable) */}
                {effectiveMode === "career_path" && (
                  <section className="min-w-0 space-y-3">
                    {/* Header & Rasional Singkat */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                          Rencana Rotasi &amp; Karier (24 Bulan)
                        </h3>
                        {selectedEmployee.careerPathTarget.aiEnriched && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            ✨ AI Career Path
                            {typeof selectedEmployee.careerPathTarget.aiFitScore === "number"
                              ? ` • ${selectedEmployee.careerPathTarget.aiFitScore}% Fit`
                              : ""}
                            {selectedEmployee.careerPathTarget.aiPathType
                              ? ` • ${selectedEmployee.careerPathTarget.aiPathType}`
                              : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {selectedEmployee.careerPathTarget.targetRoleRationale}
                      </p>

                      {/* 2 Kolom Ringkas: Stagnasi & Rekam Jejak */}
                      <div className="mt-3 grid divide-y divide-slate-100 rounded-md border border-slate-100 bg-slate-50/70 md:grid-cols-2 md:divide-x md:divide-y-0">
                        <div className="p-2.5">
                          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            <Clock className="h-3 w-3" /> Status Masa Jabatan
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                            {selectedEmployee.careerPathTarget.stagnationAnalysis}
                          </p>
                        </div>
                        <div className="p-2.5">
                          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            <GitBranch className="h-3 w-3" /> Rekam Jejak Terakhir
                          </p>
                          <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                            {selectedEmployee.careerPathTarget.careerHistorySummary
                              .slice(0, 3)
                              .map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                                  <span className="line-clamp-1" title={item}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Roadmap 3 Tahap Rotasi (Hanya jika sudah digenerate AI Career Path) */}
                    {selectedEmployee.careerPathTarget.phases.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                        {selectedEmployee.careerPathTarget.phases.map((phase) => (
                          <div
                            key={phase.phaseNumber}
                            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                {phase.phaseNumber}
                              </span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-900">
                                    {phase.targetDepartment}
                                  </span>
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    {phase.duration}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-700 leading-snug">
                                  <span className="font-semibold text-slate-800">Proyek:</span>{" "}
                                  {phase.projectAssignment}
                                </p>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  <span className="font-medium text-slate-600">Output:</span>{" "}
                                  {phase.expectedDeliverable}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 pl-7 text-[10px] text-slate-500 sm:pl-3 sm:text-right">
                              <span className="block uppercase tracking-wide text-slate-400">
                                Mentor
                              </span>
                              <span className="font-medium text-slate-700">{phase.mentorRole}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* RINGKASAN KESELARASAN */}
                <section className="grid min-w-0 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs md:grid-cols-3">
                  <div className="bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Rekomendasi AI
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activitiesToDisplay.length} modul
                    </p>
                    <p className="text-slate-500">Kurikulum 70-20-10 dari gap & kesiapan karier.</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Keputusan Leader
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {leadModifiedCount > 0 ? `${leadModifiedCount} disesuaikan` : "Sesuai AI"}
                    </p>
                    <p className="text-slate-500">
                      {leadModifiedCount > 0
                        ? "Atasan menyesuaikan modul sesuai prioritas."
                        : "Atasan menyetujui seluruh baseline AI."}
                    </p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Registrasi Karyawan
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {registeredCount > 0 ? `${registeredCount} diajukan` : "Belum mendaftar"}
                    </p>
                    <p className={mismatchCount > 0 ? "text-amber-700" : "text-slate-500"}>
                      {mismatchCount > 0
                        ? `${mismatchCount} usulan berbeda dari arahan Leader/AI.`
                        : "Sesuai kurikulum IDP."}
                    </p>
                  </div>
                </section>

                {/* AKTIVITAS IDP */}
                <section className="min-w-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Aktivitas IDP</h3>
                    <span className="text-xs text-slate-500">
                      {activitiesToDisplay.length} aktivitas
                    </span>
                  </div>
                  {activitiesToDisplay.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center space-y-2.5">
                      <p className="text-xs text-slate-600">
                        {effectiveMode === "current_gap"
                          ? "Belum ada hasil IDP AI untuk Current Gap. Silakan generate terlebih dahulu di menu Talent → Current Gap / Skill Needs."
                          : effectiveMode === "career_path"
                            ? "Belum ada hasil IDP AI untuk Career Path. Silakan generate terlebih dahulu di menu Talent → Career Path."
                            : "Belum ada hasil IDP AI untuk Succession Plan untuk kandidat ini."}
                      </p>
                      {effectiveMode === "current_gap" && (
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link href="/talent/gap?mode=ai">Buka Talent → Current Gap AI</Link>
                        </Button>
                      )}
                      {effectiveMode === "career_path" && (
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link href={`/talent/career-path/${selectedEmployee.profileId}`}>
                            Buka Talent → Career Path AI
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                  {activitiesToDisplay.map((activity) => {
                    const et = activity.alignment.employeeTraining;
                    return (
                      <article
                        key={`${activity.employeePersonnelNumber}-${activity.activityKey}`}
                        className="min-w-0 rounded-lg border border-slate-200 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <LearningTypeBadge type={activity.learningType} />
                              <StatusBadge status={activity.status} />
                            </div>
                            <p className="text-sm font-semibold leading-snug text-slate-900">
                              {activity.programName}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px]",
                                activity.alignment.leadReview.badgeClass
                              )}
                            >
                              {activity.alignment.leadReview.label.replace(/^[^A-Za-z]+/, "")}
                            </span>
                            {canEdit && onActivityUpdated && (
                              <LearningMonitoringEditor
                                activity={activity}
                                mode="edit"
                                onSaved={onActivityUpdated}
                              />
                            )}
                          </div>
                        </div>
                        <dl className="grid gap-x-6 gap-y-3 px-4 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Skill
                            </dt>
                            <dd className="mt-0.5 font-medium text-slate-800">
                              {activity.skillImprovement}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Provider
                            </dt>
                            <dd className="mt-0.5 text-slate-700">{activity.provider || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Timeline
                            </dt>
                            <dd className="mt-0.5 text-slate-700">{activity.timeline}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Budget
                            </dt>
                            <dd className="mt-0.5 font-medium text-slate-800">
                              {extractBudgetFromActivity(activity)}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Success criteria
                            </dt>
                            <dd className="mt-0.5 leading-relaxed text-slate-700">
                              {cleanSuccessCriteriaOnly(activity.successCriteria)}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] uppercase tracking-wide text-slate-400">
                              Catatan Lead
                            </dt>
                            <dd className="mt-0.5 leading-relaxed text-slate-700">
                              {activity.notes ? (
                                activity.notes
                              ) : (
                                <span className="text-slate-400">Belum ada catatan</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px]">
                          <span className="text-slate-500">Registrasi karyawan:</span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5",
                              et.badgeClass
                            )}
                          >
                            {et.label}
                          </span>
                          {et.matchedRequestTitle && et.isMismatch && (
                            <span className="text-amber-700" title={et.detail}>
                              Usulan karyawan: {et.matchedRequestTitle}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </section>

                {/* PENGAJUAN TRAINING KARYAWAN INI */}
                {(() => {
                  const empReqs = requestsFor(selectedEmployee);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                          Pengajuan Training Karyawan ({empReqs.length})
                        </h4>
                        {!canApprove && (
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                            <ShieldCheck className="h-3 w-3" /> Monitoring saja · approval oleh
                            atasan langsung
                          </span>
                        )}
                      </div>
                      {empReqs.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                          Belum ada pengajuan training dari karyawan ini.
                        </p>
                      ) : (
                        <TableShell>
                          <table className="w-full min-w-[820px] text-xs">
                            <thead className="border-b bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="p-3 font-semibold">Training</th>
                                <th className="p-3 font-semibold">Penyelenggara</th>
                                <th className="p-3 font-semibold">Jadwal</th>
                                <th className="p-3 font-semibold">Biaya</th>
                                <th className="p-3 font-semibold">Status</th>
                                {canApprove && (
                                  <th className="p-3 text-right font-semibold">Aksi</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {empReqs.map((req) => (
                                <tr key={req.id} className="align-top">
                                  <td className="p-3">
                                    <p className="font-semibold text-slate-900">
                                      {req.trainingTitle}
                                    </p>
                                    <p className="text-slate-500">
                                      {req.skill} · {req.trainingType}
                                    </p>
                                    {req.leaderNotes && (
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        Catatan atasan: &quot;{req.leaderNotes}&quot;
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-700">{req.vendor}</td>
                                  <td className="p-3 text-slate-700">{req.scheduleDate}</td>
                                  <td className="p-3 font-medium text-slate-800">
                                    Rp {req.totalCost.toLocaleString("id-ID")}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={cn(
                                        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium",
                                        req.status === "APPROVED_BY_LEADER"
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          : req.status === "REJECTED_BY_LEADER"
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-amber-200 bg-amber-50 text-amber-700"
                                      )}
                                    >
                                      {req.status === "APPROVED_BY_LEADER"
                                        ? "Disetujui"
                                        : req.status === "REJECTED_BY_LEADER"
                                          ? "Ditolak / Revisi"
                                          : "Menunggu Approval"}
                                    </span>
                                  </td>
                                  {canApprove && onOpenReviewModal && (
                                    <td className="p-3 text-right whitespace-nowrap">
                                      {req.status === "PENDING_LEADER_APPROVAL" ? (
                                        <div className="flex justify-end gap-1.5">
                                          <Button
                                            size="sm"
                                            className="h-7 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-700"
                                            onClick={() =>
                                              onOpenReviewModal(req, "APPROVED_BY_LEADER")
                                            }
                                          >
                                            Setujui
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 border-red-200 px-2.5 text-xs text-red-700 hover:bg-red-50"
                                            onClick={() =>
                                              onOpenReviewModal(req, "REJECTED_BY_LEADER")
                                            }
                                          >
                                            Tolak
                                          </Button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </TableShell>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: LearningMonitoringStatus }) {
  if (status === "COMPLETED") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold whitespace-nowrap text-[10px]">
        {learningStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 font-semibold whitespace-nowrap text-[10px]">
        {learningStatusLabel(status)}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-slate-600 border-slate-200 bg-slate-50 font-medium whitespace-nowrap text-[10px]"
    >
      {learningStatusLabel(status)}
    </Badge>
  );
}

function LearningTypeBadge({ type }: { type: string }) {
  if (type.startsWith("70%")) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 shadow-2xs">
        <span className="flex h-5 w-8 shrink-0 items-center justify-center rounded bg-emerald-600 text-[10px] font-black text-white">
          70%
        </span>
        <span className="text-[10px] font-bold text-emerald-950 whitespace-nowrap">Experience</span>
      </div>
    );
  }
  if (type.startsWith("20%")) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 shadow-2xs">
        <span className="flex h-5 w-8 shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-black text-white">
          20%
        </span>
        <span className="text-[10px] font-bold text-blue-950 whitespace-nowrap">Social</span>
      </div>
    );
  }
  if (type.startsWith("10%")) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 shadow-2xs">
        <span className="flex h-5 w-8 shrink-0 items-center justify-center rounded bg-violet-600 text-[10px] font-black text-white">
          10%
        </span>
        <span className="text-[10px] font-bold text-violet-950 whitespace-nowrap">Formal</span>
      </div>
    );
  }
  return (
    <Badge variant="outline" className="whitespace-nowrap text-[10px]">
      {type}
    </Badge>
  );
}

function newManualActivity(
  section: IdpEmployeeSection,
  targetPosition: string,
  gap: string,
  detailMode: IdpDetailMode,
  successionScopeKey?: string
): EditableLearningActivity {
  const prefix =
    detailMode === "succession"
      ? successionScopeKey
        ? `CUSTOM:SUCCESSION:${successionScopeKey}:${Date.now()}`
        : `CUSTOM:SUCCESSION:${Date.now()}`
      : detailMode === "career_path"
        ? `CUSTOM:CAREER:${Date.now()}`
        : `CUSTOM:GAP:${Date.now()}`;
  return {
    employeePersonnelNumber: section.profileId,
    employeeName: section.employeeName,
    activityKey: prefix,
    activityType: "EXPERIENCE_70",
    learningType: "70% Experience Learning",
    targetPosition,
    skillImprovement: gap.split(",")[0]?.trim() || "Development need",
    programName: "",
    provider: "Internal Berau Coal",
    timeline: "90 hari",
    status: "NOT_STARTED",
    successCriteria: "",
    notes: "",
    version: 0,
  };
}
