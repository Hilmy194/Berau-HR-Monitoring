"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Loader2,
  Milestone,
  Pencil,
  RefreshCw,
  Sparkles,
  UsersRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  extractBudgetFromActivity,
  cleanSuccessCriteriaOnly,
  type EditableLearningActivity,
} from "@/components/admin/learning-monitoring-editor";
import {
  IdpDetailDialog,
  type IdpActivityWithAlignment,
  type IdpDetailMode,
  type IdpEmployeeSection,
} from "@/components/learning/idp-detail-dialog";
import type { EmployeeTrainingRequest } from "@/lib/services/training-catalog.service";
import { cn } from "@/lib/utils";

export type { IdpActivityWithAlignment, IdpDetailMode, IdpEmployeeSection };

interface IdpDirectoryProps {
  employeeSections: IdpEmployeeSection[];
  canEdit: boolean;
  canApprove?: boolean;
  trainingRequests?: EmployeeTrainingRequest[];
  initialSelectedDetail?: string;
}

const PAGE_SIZE = 15;

export function IdpDirectory({
  employeeSections,
  canEdit,
  canApprove = false,
  trainingRequests = [],
  initialSelectedDetail,
}: IdpDirectoryProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeTrainingRequest[]>(trainingRequests);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReqForReview, setSelectedReqForReview] = useState<EmployeeTrainingRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED_BY_LEADER" | "REJECTED_BY_LEADER">("APPROVED_BY_LEADER");
  const [leaderReviewNotes, setLeaderReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rowFilter, setRowFilter] = useState<"ALL" | "CANDIDATE" | "ROTATION" | "PENDING">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setRequests(trainingRequests);
  }, [trainingRequests]);

  const [sections, setSections] = useState<IdpEmployeeSection[]>(employeeSections);
  useEffect(() => {
    setSections(employeeSections);
    setSelectedEmployee((prev) =>
      prev ? employeeSections.find((s) => s.id === prev.id) ?? prev : null
    );
  }, [employeeSections]);

  const handleActivityUpdated = (updated: EditableLearningActivity) => {
    const key = updated.activityKey || "";
    const targetBucket: "succession" | "career_path" | "current_gap" =
      key.startsWith("SUCCESSION_") || key.startsWith("SUCCESSION:") || key.startsWith("CUSTOM:SUCCESSION:")
        ? "succession"
        : key.startsWith("CAREER_ROTATION_") || key.startsWith("CUSTOM:CAREER:")
          ? "career_path"
          : "current_gap";
    const scopedMatch = key.match(/^(?:CUSTOM:)?SUCCESSION:([^:]+):/);
    const updatedScopeKey = scopedMatch?.[1] ?? null;

    const updateList = (list: IdpActivityWithAlignment[]) => {
      let found = false;
      const updatedList = list.map((act) => {
        if (act.activityKey === updated.activityKey) {
          found = true;
          return {
            ...act,
            ...updated,
            aiBaselineProgram: act.aiBaselineProgram || act.programName,
            budget: updated.budget || extractBudgetFromActivity(updated),
            successCriteria: cleanSuccessCriteriaOnly(updated.successCriteria),
            alignment: {
              ...act.alignment,
              leadReview: {
                status: "MODIFIED",
                label: "✏️ Disesuaikan Lead",
                badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
                isModified: true,
                leaderNotes: updated.notes || undefined,
              },
            },
          };
        }
        return act;
      });

      if (!found) {
        const newAct: IdpActivityWithAlignment = {
          ...updated,
          budget: updated.budget || extractBudgetFromActivity(updated),
          successCriteria: cleanSuccessCriteriaOnly(updated.successCriteria),
          alignment: {
            aiBaseline: {
              label: "Manual Added",
              badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
            },
            leadReview: {
              status: "MODIFIED",
              label: "✏️ Disesuaikan Lead",
              badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
              isModified: true,
              leaderNotes: updated.notes || undefined,
            },
            employeeTraining: {
              status: "NOT_REGISTERED",
              label: "Belum Mengajukan",
              badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
            },
          },
        };
        return [...updatedList, newAct];
      }

      return updatedList;
    };

    const updateSuccessionTargets = (targets: IdpEmployeeSection["candidateTargets"]) => {
      if (!targets?.length) return targets;
      return targets.map((t, idx) => {
        const matchesTarget = updatedScopeKey ? t.key === updatedScopeKey : idx === 0;
        return matchesTarget ? { ...t, activities: updateList(t.activities) } : t;
      });
    };

    // 1. Update ONLY the matching tab in selectedEmployee so tabs never cross-contaminate
    setSelectedEmployee((prev) => {
      if (!prev) return null;
      const updatedTargets =
        targetBucket === "succession" ? updateSuccessionTargets(prev.candidateTargets) : prev.candidateTargets;
      const shouldUpdatePrimary =
        targetBucket === "succession" &&
        (!updatedScopeKey || !prev.candidateTargets?.length || prev.candidateTargets[0]?.key === updatedScopeKey);
      return {
        ...prev,
        candidateTargets: updatedTargets,
        candidateTarget:
          shouldUpdatePrimary && prev.candidateTarget
            ? {
                ...prev.candidateTarget,
                activities: updateList(prev.candidateTarget.activities),
              }
            : prev.candidateTarget,
        currentGapTarget:
          targetBucket === "current_gap"
            ? {
                ...prev.currentGapTarget,
                activities: updateList(prev.currentGapTarget.activities),
              }
            : prev.currentGapTarget,
        careerPathTarget:
          targetBucket === "career_path"
            ? {
                ...prev.careerPathTarget,
                activities: updateList(prev.careerPathTarget.activities),
              }
            : prev.careerPathTarget,
      };
    });

    // 2. Update ONLY the matching tab in sections state
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.profileId !== updated.employeePersonnelNumber) return sec;
        const updatedTargets =
          targetBucket === "succession" ? updateSuccessionTargets(sec.candidateTargets) : sec.candidateTargets;
        const shouldUpdatePrimary =
          targetBucket === "succession" &&
          (!updatedScopeKey || !sec.candidateTargets?.length || sec.candidateTargets[0]?.key === updatedScopeKey);
        return {
          ...sec,
          candidateTargets: updatedTargets,
          candidateTarget:
            shouldUpdatePrimary && sec.candidateTarget
              ? {
                  ...sec.candidateTarget,
                  activities: updateList(sec.candidateTarget.activities),
                }
              : sec.candidateTarget,
          currentGapTarget:
            targetBucket === "current_gap"
              ? {
                  ...sec.currentGapTarget,
                  activities: updateList(sec.currentGapTarget.activities),
                }
              : sec.currentGapTarget,
          careerPathTarget:
            targetBucket === "career_path"
              ? {
                  ...sec.careerPathTarget,
                  activities: updateList(sec.careerPathTarget.activities),
                }
              : sec.careerPathTarget,
        };
      })
    );
  };

  const openReviewModal = (req: EmployeeTrainingRequest, decision: "APPROVED_BY_LEADER" | "REJECTED_BY_LEADER") => {
    if (!canApprove) {
      toast.error("Akses ditolak: Persetujuan pengajuan training hanya dapat dilakukan oleh Leader / Atasan Langsung. Dari sisi HR hanya memiliki akses monitoring.");
      return;
    }
    setSelectedReqForReview(req);
    setReviewDecision(decision);
    setLeaderReviewNotes(
      decision === "APPROVED_BY_LEADER"
        ? "Disetujui. Sesuai prioritas rencana pengembangan kompetensi dan suksesi operasional."
        : ""
    );
    setReviewModalOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReqForReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/learning/training-requests/${selectedReqForReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewDecision,
          leaderNotes: leaderReviewNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses approval");

      toast.success(
        reviewDecision === "APPROVED_BY_LEADER"
          ? `Pengajuan training ${selectedReqForReview.trainingTitle} berhasil disetujui!`
          : `Pengajuan training ditolak dengan catatan evaluasi.`
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedReqForReview.id ? data.request : r))
      );
      setReviewModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan approval.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const [selectedEmployee, setSelectedEmployee] = useState<IdpEmployeeSection | null>(() => {
    if (initialSelectedDetail) {
      const target = initialSelectedDetail.toLowerCase().trim();
      return (
        employeeSections.find(
          (s) =>
            s.employeeName.toLowerCase() === target ||
            s.profileId.toLowerCase() === target ||
            s.employeeName.toLowerCase().includes(target)
        ) || null
      );
    }
    return null;
  });

  const [detailMode, setDetailMode] = useState<"succession" | "current_gap" | "career_path">(() => {
    if (initialSelectedDetail) {
      const target = initialSelectedDetail.toLowerCase().trim();
      const match = employeeSections.find(
        (s) =>
          s.employeeName.toLowerCase() === target ||
          s.profileId.toLowerCase() === target ||
          s.employeeName.toLowerCase().includes(target)
      );
      return match?.isCandidate && match.candidateTarget ? "succession" : "current_gap";
    }
    return "current_gap";
  });

  // Sinkronisasi jika prop initialSelectedDetail berubah
  useEffect(() => {
    if (initialSelectedDetail) {
      const target = initialSelectedDetail.toLowerCase().trim();
      const match = employeeSections.find(
        (s) =>
          s.employeeName.toLowerCase() === target ||
          s.profileId.toLowerCase() === target ||
          s.employeeName.toLowerCase().includes(target)
      );
      if (match) {
        setSelectedEmployee(match);
        setDetailMode(match.isCandidate && match.candidateTarget ? "succession" : "current_gap");
      }
    }
  }, [initialSelectedDetail, employeeSections]);

  const openDetail = (
    employee: IdpEmployeeSection,
    mode?: "succession" | "current_gap" | "career_path"
  ) => {
    setSelectedEmployee(employee);
    if (mode) {
      setDetailMode(mode);
    } else {
      setDetailMode(employee.isCandidate && employee.candidateTarget ? "succession" : "current_gap");
    }
  };

  // Metrik keselarasan 3 pihak
  const totalEmployees = sections.length;
  const candidateCount = sections.filter((e) => e.isCandidate).length;
  const highStagnationCount = useMemo(() => {
    return sections.filter(
      (e) => e.careerPathTarget.rotationNeedLevel === "HIGH"
    ).length;
  }, [sections]);

  const allActiveActivities = useMemo(() => {
    return sections.flatMap((e) =>
      e.isCandidate && e.candidateTarget
        ? e.candidateTarget.activities
        : e.currentGapTarget.activities
    );
  }, [sections]);

  const totalActivitiesCount = allActiveActivities.length;
  const leadModifiedCount = allActiveActivities.filter(
    (a) => a.alignment.leadReview.status === "MODIFIED"
  ).length;
  const aiBaselineCount = allActiveActivities.filter(
    (a) => a.alignment.leadReview.status !== "MODIFIED"
  ).length;
  const employeeEnrolledCount = allActiveActivities.filter(
    (a) =>
      a.alignment.employeeTraining.status === "IN_PROGRESS" ||
      a.alignment.employeeTraining.status === "COMPLETED"
  ).length;
  const employeePendingCount = allActiveActivities.filter(
    (a) => a.alignment.employeeTraining.status === "PENDING"
  ).length;


  const requestsFor = (sec: IdpEmployeeSection) =>
    requests.filter(
      (r) =>
        r.employeePersonnelNumber === sec.profileId ||
        r.employeeName.toLowerCase().trim() === sec.employeeName.toLowerCase().trim()
    );
  const pendingFor = (sec: IdpEmployeeSection) =>
    requestsFor(sec).filter((r) => r.status === "PENDING_LEADER_APPROVAL").length;
  const pendingRequestCount = requests.filter((r) => r.status === "PENDING_LEADER_APPROVAL").length;
  const sectionsWithPending = sections.filter((s) => pendingFor(s) > 0).length;

  const filteredSections = useMemo(() => {
    if (rowFilter === "CANDIDATE") return sections.filter((s) => s.isCandidate);
    if (rowFilter === "ROTATION") return sections.filter((s) => s.careerPathTarget.rotationNeedLevel === "HIGH");
    if (rowFilter === "PENDING") return sections.filter((s) => pendingFor(s) > 0);
    return sections;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, rowFilter, requests]);
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSections = filteredSections.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* KPI STRIP */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 divide-slate-200 lg:grid-cols-4 lg:divide-x">
          {[
            { label: "Total Karyawan IDP", value: totalEmployees, sub: `${highStagnationCount} perlu rotasi (>3 thn)`, icon: UsersRound },
            { label: "Kandidat Suksesi", value: candidateCount, sub: "Terpetakan suksesi & rotasi", icon: Sparkles },
            { label: "Disesuaikan Lead", value: leadModifiedCount, sub: `dari ${totalActivitiesCount} aktivitas IDP`, icon: Pencil },
            { label: "Menunggu Approval", value: pendingRequestCount, sub: `${employeeEnrolledCount} aktivitas sudah terdaftar`, icon: FileCheck2 },
          ].map((k) => (
            <div key={k.label} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{k.value}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{k.sub}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <k.icon className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SINGLE TABLE */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Daftar IDP Karyawan</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredSections.length} dari {totalEmployees} karyawan
              {canApprove ? " · Anda dapat mengelola IDP dan menyetujui pengajuan training bawahan." : " · Mode monitoring (hanya lihat)."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["ALL", "Semua", totalEmployees],
                ["CANDIDATE", "Kandidat", candidateCount],
                ["ROTATION", "Perlu Rotasi", highStagnationCount],
                ["PENDING", "Menunggu Approval", sectionsWithPending],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRowFilter(key);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  rowFilter === key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {label} <span className="ml-1 tabular-nums opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-3 pl-5 pr-3">Karyawan</th>
                <th className="px-3 py-3">Jabatan Saat Ini</th>
                <th className="px-3 py-3">Target Posisi</th>
                <th className="px-3 py-3">Kesiapan</th>
                <th className="px-3 py-3">Review Lead</th>
                <th className="py-3 pl-3 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Belum ada data karyawan di IDP Monitoring</p>
                    <p className="mx-auto mt-1 max-w-lg text-xs text-slate-400">
                      Karyawan otomatis masuk saat dinominasikan ke Succession Planning, atau setelah dilakukan generate AI Current Gap / Career Path pada menu Talent.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedSections.map((section) => {
                  const acts =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.activities
                      : section.currentGapTarget.activities;
                  const hasLeadModified = acts.some((a) => a.alignment.leadReview.status === "MODIFIED");
                  const target =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.targetPositionTitle
                      : section.currentGapTarget.targetPositionTitle;
                  const priority =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.priority
                      : section.currentGapTarget.priority;
                  const initials = section.employeeName
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("");
                  const rot = section.careerPathTarget.rotationNeedLevel;

                  return (
                    <tr key={section.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3.5 pl-5 pr-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900" title={section.employeeName}>
                              {section.employeeName}
                            </p>
                            <p className="truncate text-xs text-slate-500">{section.department}</p>
                            {section.isCandidate && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                <Sparkles className="h-2.5 w-2.5" /> Kandidat Suksesi
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 align-middle text-xs">
                        <p className="line-clamp-2 font-medium text-slate-800">{section.currentPosition || "-"}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-slate-500">
                          {section.careerPathTarget.currentPositionDuration}
                          {rot === "HIGH" ? (
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Perlu rotasi</span>
                          ) : rot === "MEDIUM" ? (
                            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">Siap rotasi</span>
                          ) : null}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 align-middle text-xs">
                        <p className="line-clamp-2 font-medium text-slate-800">{target}</p>
                        {section.candidateTargets && section.candidateTargets.length > 1 && (
                          <span
                            className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                            title={section.candidateTargets.map((t) => t.targetPositionTitle).join(" | ")}
                          >
                            +{section.candidateTargets.length - 1} target suksesi lain
                          </span>
                        )}
                        {section.careerPathTarget.aiEnriched && (
                          <p className="mt-0.5 flex items-center gap-1 text-slate-500">
                            <Milestone className="h-3 w-3" />
                            <span className="line-clamp-1">{section.careerPathTarget.targetPositionTitle}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        {section.isCandidate && section.candidateTarget?.readiness === "READY_NOW" ? (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700">Ready Now</Badge>
                        ) : section.isCandidate && section.candidateTarget?.readiness === "READY_LATER" ? (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700">Ready Later</Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600">{priority}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        {hasLeadModified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Disesuaikan Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Sesuai AI Baseline
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right align-middle">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetail(section)}
                          className="h-8 gap-1.5 border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-900 hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>
            Menampilkan {filteredSections.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredSections.length)} dari {filteredSections.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              Sebelumnya
            </Button>
            <span className="tabular-nums">
              {safePage} / {totalPages}
            </span>
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOG DETAIL IDP PER KARYAWAN (3 Mode: Succession, Gap, Career) */}
      {/* ========================================================================= */}
      <IdpDetailDialog
        selectedEmployee={selectedEmployee}
        detailMode={detailMode}
        onChangeDetailMode={setDetailMode}
        onClose={() => setSelectedEmployee(null)}
        trainingRequests={requests}
        canEdit={canEdit}
        canApprove={canApprove}
        onActivityUpdated={handleActivityUpdated}
        onOpenReviewModal={openReviewModal}
      />


      {/* ========================================================================= */}
      {/* DIALOG KONFIRMASI APPROVAL / REJECTION OLEH LEADER                        */}
      {/* ========================================================================= */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              {reviewDecision === "APPROVED_BY_LEADER" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Persetujuan Pelatihan Bawahan
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Penolakan / Permintaan Revisi Pelatihan
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedReqForReview && (
                <>
                  {selectedReqForReview.employeeName} · {selectedReqForReview.trainingTitle}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1 text-xs">
            {selectedReqForReview && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <span className="text-slate-400">Total Biaya:</span>{" "}
                  <strong className="text-emerald-700">Rp {selectedReqForReview.totalCost.toLocaleString("id-ID")}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Budget WBS:</span>{" "}
                  <span className="font-mono text-slate-800">{selectedReqForReview.budgetCode}</span>
                </div>
                <div>
                  <span className="text-slate-400">Penyelenggara:</span>{" "}
                  <span className="text-slate-800">{selectedReqForReview.vendor} ({selectedReqForReview.scheduleDate})</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">
                {reviewDecision === "APPROVED_BY_LEADER"
                  ? "Catatan / Arahan Atasan (Opsional):"
                  : "Alasan Penolakan / Arahan Revisi (Wajib):"}
              </label>
              <Textarea
                rows={3}
                value={leaderReviewNotes}
                onChange={(e) => setLeaderReviewNotes(e.target.value)}
                placeholder={
                  reviewDecision === "APPROVED_BY_LEADER"
                    ? "Berikan catatan harapan kompetensi atau tindak lanjut setelah pelatihan..."
                    : "Jelaskan alasan penolakan, penyesuaian jadwal, atau rekomendasi modul alternatif..."
                }
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              disabled={submittingReview}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveReview}
              disabled={submittingReview || (reviewDecision === "REJECTED_BY_LEADER" && !leaderReviewNotes.trim())}
              className={
                reviewDecision === "APPROVED_BY_LEADER"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  : "bg-red-600 hover:bg-red-700 text-white font-bold"
              }
            >
              {submittingReview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : reviewDecision === "APPROVED_BY_LEADER" ? (
                "Konfirmasi Setujui"
              ) : (
                "Konfirmasi Tolak"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
