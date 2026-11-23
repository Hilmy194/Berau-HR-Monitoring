"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  GitBranch,
  Milestone,
  Pencil,
  RefreshCw,
  Sparkles,
  Target,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  type EditableLearningActivity,
} from "@/components/admin/learning-monitoring-editor";
import { learningStatusLabel } from "@/lib/learning-monitoring-status";
import type { LearningMonitoringStatus } from "@/lib/services/learning-monitoring.service";
import type { CareerPathSimulationData } from "@/lib/services/career-path-idp.service";
import { cn } from "@/lib/utils";

export interface IdpActivityWithAlignment extends EditableLearningActivity {
  alignment: {
    aiBaseline: {
      label: string;
      badgeClass: string;
    };
    leadReview: {
      status: string;
      label: string;
      badgeClass: string;
    };
    employeeTraining: {
      status: string;
      label: string;
      badgeClass: string;
    };
  };
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
  candidateTarget?: {
    targetPositionTitle: string;
    targetIncumbentName: string;
    readiness: string;
    source: string;
    gap: string;
    priority: string;
    activities: IdpActivityWithAlignment[];
  };
  currentGapTarget: {
    targetPositionTitle: string;
    gap: string;
    priority: string;
    hasAiDefault: boolean;
    activities: IdpActivityWithAlignment[];
  };
  careerPathTarget: CareerPathSimulationData & {
    activities: IdpActivityWithAlignment[];
  };
}

interface IdpDirectoryProps {
  employeeSections: IdpEmployeeSection[];
  canEdit: boolean;
  initialSelectedDetail?: string;
}

export function IdpDirectory({
  employeeSections,
  canEdit,
  initialSelectedDetail,
}: IdpDirectoryProps) {
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
      return match?.isCandidate ? "succession" : "career_path";
    }
    return "succession";
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
        setDetailMode(match.isCandidate ? "succession" : "career_path");
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
      setDetailMode(employee.isCandidate ? "succession" : "career_path");
    }
  };

  // Metrik keselarasan 3 pihak
  const totalEmployees = employeeSections.length;
  const candidateCount = employeeSections.filter((e) => e.isCandidate).length;
  const highStagnationCount = useMemo(() => {
    return employeeSections.filter(
      (e) => e.careerPathTarget.rotationNeedLevel === "HIGH"
    ).length;
  }, [employeeSections]);

  const allActiveActivities = useMemo(() => {
    return employeeSections.flatMap((e) =>
      e.isCandidate && e.candidateTarget
        ? e.candidateTarget.activities
        : e.currentGapTarget.activities
    );
  }, [employeeSections]);

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

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SUMMARY METRIC CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-2xs bg-linear-to-br from-slate-50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Karyawan IDP
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {totalEmployees} Karyawan
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                ⚠️ {highStagnationCount} karyawan perlu rotasi (&gt;3 thn)
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-linear-to-br from-purple-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">
                Candidate Tagged
              </p>
              <h3 className="text-2xl font-black text-purple-900 mt-0.5">
                {candidateCount} Kandidat
              </h3>
              <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                Terpetakan suksesi &amp; rotasi lintas fungsi
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-linear-to-br from-amber-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                Review by Lead
              </p>
              <h3 className="text-2xl font-black text-amber-950 mt-0.5">
                {aiBaselineCount} Baseline
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                ✏️ {leadModifiedCount} disesuaikan oleh Lead
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Pencil className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-linear-to-br from-blue-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                Karyawan Regis
              </p>
              <h3 className="text-2xl font-black text-blue-900 mt-0.5">
                {employeeEnrolledCount} Terdaftar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ⏳ {employeePendingCount} belum terdaftar mandiri
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 2. KERANGKA 70-20-10                                                      */}
      {/* ========================================================================= */}
      <section className="grid gap-3 md:grid-cols-3">
        <Card className="border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-emerald-700">70%</p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Experience
              </span>
            </div>
            <p className="mt-1 font-semibold text-slate-900">Project / OJT / Rotasi Lintas Fungsi</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Stretch assignment, penugasan rotasi lintas departemen (Accelerated Development), dan executive shadowing/acting.
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-blue-700">20%</p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Social
              </span>
            </div>
            <p className="mt-1 font-semibold text-slate-900">Coaching / Cross-Dept Mentoring</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Pendampingan 1-on-1 bersama pejabat incumbent, mentoring atasan lintas fungsi, dan transfer kapabilitas strategis.
            </p>
          </CardContent>
        </Card>
        <Card className="border-violet-200/80 bg-violet-50/20 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-violet-700">10%</p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                Formal
              </span>
            </div>
            <p className="mt-1 font-semibold text-slate-900">Certification / ECDP Leadership</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Executive Competency Development Program (ECDP), sertifikasi teknis operasional, dan kelas spesifik lintas fungsi.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 3. TABEL UTAMA IDP MONITORING (Ringkas, ada Tagging Candidate & Lihat Detail) */}
      {/* ========================================================================= */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-purple-600" />
              Daftar Monitoring IDP Karyawan (Suksesi, Current Gap &amp; Career Path)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Menampilkan <strong>{totalEmployees}</strong> karyawan. Karyawan kandidat suksesi ditandai dengan badge <strong>Candidate</strong>. Klik <strong>&quot;Lihat Detail&quot;</strong> untuk membuka rincian IDP Succession, Current Gap, maupun Career Path (Rotasi Lintas Fungsi 2 Tahun).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
              <Sparkles className="h-3 w-3 text-purple-600" /> {candidateCount} Candidate Tagged
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              <Clock className="h-3 w-3 text-amber-600" /> {highStagnationCount} Perlu Rotasi (&gt;3 Thn)
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="p-3.5 pl-5 min-w-[240px]">Karyawan</th>
                <th className="p-3.5 min-w-[220px]">Jabatan &amp; Durasi Masa Kerja</th>
                <th className="p-3.5 min-w-[230px]">Target Posisi</th>
                <th className="p-3.5 min-w-[220px]">Fokus Gap / Rotasi</th>
                <th className="p-3.5 text-center min-w-[120px]">Kesiapan / Prioritas</th>
                <th className="p-3.5 text-center min-w-[150px]">Review by Lead</th>
                <th className="p-3.5 text-center min-w-[150px]">Karyawan Regis</th>
                <th className="p-3.5 pr-5 text-right min-w-[130px]">Detail IDP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeSections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UsersRound className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">Data karyawan IDP tidak ditemukan</p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau filter organisasi.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                employeeSections.map((section) => {
                  const activeActivities =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.activities
                      : section.currentGapTarget.activities;

                  const hasLeadModified = activeActivities.some(
                    (a) => a.alignment.leadReview.status === "MODIFIED"
                  );
                  const allCompleted = activeActivities.every(
                    (a) => a.alignment.employeeTraining.status === "COMPLETED"
                  );
                  const hasEnrolled = activeActivities.some(
                    (a) =>
                      a.alignment.employeeTraining.status === "IN_PROGRESS" ||
                      a.alignment.employeeTraining.status === "COMPLETED"
                  );

                  const displayTargetPosition =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.targetPositionTitle
                      : section.currentGapTarget.targetPositionTitle;

                  const displayGap =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.gap
                      : section.currentGapTarget.gap;

                  const displayPriority =
                    section.isCandidate && section.candidateTarget
                      ? section.candidateTarget.priority
                      : section.currentGapTarget.priority;

                  return (
                    <tr
                      key={section.id}
                      className={cn(
                        "hover:bg-purple-50/20 transition-colors",
                        section.isCandidate ? "bg-purple-50/5" : ""
                      )}
                    >
                      {/* Kolom 1: Karyawan dengan Tagging Candidate */}
                      <td className="p-3.5 pl-5 align-middle min-w-[240px]">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full font-bold flex items-center justify-center shrink-0 text-xs border mt-0.5",
                              section.isCandidate
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {section.employeeName
                              .split(" ")
                              .slice(0, 2)
                              .map((p) => p[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate" title={section.employeeName}>
                              {section.employeeName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {section.department}
                            </p>
                            {/* TAGGING JALUR KANDIDAT */}
                            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                              {section.isCandidate ? (
                                <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[9px] font-bold gap-1 px-1.5 py-0 hover:bg-purple-100 shadow-2xs">
                                  <Sparkles className="h-2.5 w-2.5 text-purple-600" />
                                  <span>Candidate</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-medium text-slate-500 bg-slate-50 border-slate-200 px-1.5 py-0">
                                  Reguler
                                </Badge>
                              )}
                              {section.isCandidate && section.candidateTarget?.targetIncumbentName && (
                                <span className="text-[9px] text-purple-700 font-medium truncate max-w-[130px]" title={`Suksesor ${section.candidateTarget.targetIncumbentName}`}>
                                  Suksesor: {section.candidateTarget.targetIncumbentName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Jabatan Saat Ini & Durasi / Deteksi Stagnasi */}
                      <td className="p-3.5 align-middle text-xs font-medium text-slate-800 min-w-[220px]">
                        <span className="line-clamp-2">{section.currentPosition || "-"}</span>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-normal">
                            Masa: <strong>{section.careerPathTarget.currentPositionDuration}</strong>
                          </span>
                          {section.careerPathTarget.rotationNeedLevel === "HIGH" ? (
                            <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-200 font-bold px-1.5 py-0">
                              ⚠️ Perlu Rotasi
                            </Badge>
                          ) : section.careerPathTarget.rotationNeedLevel === "MEDIUM" ? (
                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-800 border-blue-200 font-medium px-1.5 py-0">
                              🔄 Siap Rotasi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200 font-normal px-1.5 py-0">
                              On Track
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Kolom 3: Target Posisi */}
                      <td className="p-3.5 align-middle text-xs min-w-[230px]">
                        <p className={cn("font-semibold leading-snug", section.isCandidate ? "text-purple-950 font-bold" : "text-slate-900")}>
                          {displayTargetPosition}
                        </p>
                        {section.isCandidate && section.candidateTarget && (
                          <p className="text-[10px] text-purple-700 mt-0.5">
                            Suksesor: <strong>{section.candidateTarget.targetIncumbentName}</strong>
                          </p>
                        )}
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                          <Milestone className="h-2.5 w-2.5" />
                          <span>Rotasi: {section.careerPathTarget.targetPositionTitle}</span>
                        </p>
                      </td>

                      {/* Kolom 4: Fokus Gap Utama */}
                      <td className="p-3.5 align-middle text-xs text-slate-600 min-w-[220px]">
                        <span className="line-clamp-2" title={displayGap}>
                          {displayGap}
                        </span>
                      </td>

                      {/* Kolom 5: Kesiapan / Prioritas */}
                      <td className="p-3.5 align-middle text-center min-w-[120px]">
                        {section.isCandidate && section.candidateTarget?.readiness === "READY_NOW" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            Ready Now
                          </Badge>
                        ) : section.isCandidate && section.candidateTarget?.readiness === "READY_LATER" ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
                            Ready Later
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-700 font-medium">
                            {displayPriority}
                          </Badge>
                        )}
                      </td>

                      {/* Kolom 6: Review by Lead */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap min-w-[150px]">
                        {hasLeadModified ? (
                          <Badge className="bg-amber-50 text-amber-900 border-amber-300 font-semibold gap-1 text-[10px] px-2 py-0.5 hover:bg-amber-50">
                            <Pencil className="h-3 w-3 text-amber-600" />
                            <span>Disesuaikan Lead</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-50 text-purple-900 border-purple-200 font-medium gap-1 text-[10px] px-2 py-0.5 hover:bg-purple-50">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            <span>Sesuai AI Baseline</span>
                          </Badge>
                        )}
                      </td>

                      {/* Kolom 7: Karyawan Regis */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap min-w-[150px]">
                        {allCompleted ? (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold gap-1 text-[10px] px-2 py-0.5 hover:bg-emerald-50">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Selesai Divalidasi</span>
                          </Badge>
                        ) : hasEnrolled ? (
                          <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-semibold gap-1 text-[10px] px-2 py-0.5 hover:bg-blue-50">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            <span>Terdaftar (In-Sync)</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50 font-medium gap-1 text-[10px] px-2 py-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>Belum Terdaftar</span>
                          </Badge>
                        )}
                      </td>

                      {/* Kolom 8: Aksi Lihat Detail */}
                      <td className="p-3.5 pr-5 align-middle text-right whitespace-nowrap min-w-[130px]">
                        <Button
                          size="sm"
                          onClick={() => openDetail(section)}
                          className="h-8 px-2.5 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs rounded-lg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Lihat Detail</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOG DETAIL IDP PER KARYAWAN (3 Mode: Succession, Gap, Career) */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(selectedEmployee)} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-6xl w-[96vw] p-6 max-h-[92vh] overflow-y-auto">
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Header Modal */}
              <DialogHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-xl font-bold text-slate-900">
                        {selectedEmployee.employeeName}
                      </DialogTitle>
                      {selectedEmployee.isCandidate ? (
                        <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-xs font-bold gap-1 px-2.5 py-0.5">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          <span>Candidate Successor</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-semibold text-slate-600 bg-slate-50">
                          Current Gap Reguler
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-300">
                        Masa: {selectedEmployee.careerPathTarget.currentPositionDuration}
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                      {selectedEmployee.department} / {selectedEmployee.division} &bull; NIK: {selectedEmployee.profileId}
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <LearningMonitoringEditor
                        activity={newManualActivity(
                          selectedEmployee,
                          detailMode === "succession" && selectedEmployee.candidateTarget
                            ? selectedEmployee.candidateTarget.targetPositionTitle
                            : detailMode === "career_path"
                            ? selectedEmployee.careerPathTarget.targetPositionTitle
                            : selectedEmployee.currentGapTarget.targetPositionTitle,
                          detailMode === "succession" && selectedEmployee.candidateTarget
                            ? selectedEmployee.candidateTarget.gap
                            : detailMode === "career_path"
                            ? selectedEmployee.careerPathTarget.crossFunctionalGaps.join(", ")
                            : selectedEmployee.currentGapTarget.gap
                        )}
                        mode="create"
                      />
                    )}
                  </div>
                </div>

                {/* =============================================================== */}
                {/* PILIHAN MODE IDP: 3 PILIHAN (SUCCESSION, CURRENT GAP, CAREER)    */}
                {/* =============================================================== */}
                <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 mr-1">
                    Pilih Tampilan IDP:
                  </span>
                  {selectedEmployee.isCandidate && (
                    <button
                      type="button"
                      onClick={() => setDetailMode("succession")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs",
                        detailMode === "succession"
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>🎯 IDP Based on Succession Plan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailMode("current_gap")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs",
                      detailMode === "current_gap"
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    )}
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>IDP Based on Current Gap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailMode("career_path")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs",
                      detailMode === "career_path"
                        ? "bg-emerald-700 text-white font-bold shadow-xs"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    )}
                  >
                    <Milestone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>🔄 IDP Based on Career Path (Rotasi Lintas Fungsi)</span>
                  </button>
                </div>

                {/* Sub-info Target Posisi & Gap Berdasarkan Tab yang Dipilih */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                      {detailMode === "succession" && selectedEmployee.isCandidate
                        ? "Target Posisi Suksesi:"
                        : detailMode === "career_path"
                        ? "Target Jalur Karier Strategis (Rotasi):"
                        : "Target Posisi Pengembangan:"}
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedEmployee.currentPosition} <span className="font-normal text-slate-500">&rarr;</span>{" "}
                      <span
                        className={
                          detailMode === "succession"
                            ? "text-purple-900 font-bold"
                            : detailMode === "career_path"
                            ? "text-emerald-900 font-bold"
                            : "text-slate-900 font-bold"
                        }
                      >
                        {detailMode === "succession" && selectedEmployee.candidateTarget
                          ? selectedEmployee.candidateTarget.targetPositionTitle
                          : detailMode === "career_path"
                          ? selectedEmployee.careerPathTarget.targetPositionTitle
                          : selectedEmployee.currentGapTarget.targetPositionTitle}
                      </span>
                    </p>
                    {detailMode === "succession" && selectedEmployee.candidateTarget?.targetIncumbentName && (
                      <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                        Disiapkan untuk suksesi: <strong>{selectedEmployee.candidateTarget.targetIncumbentName}</strong>
                      </p>
                    )}
                    {detailMode === "career_path" && (
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Status Durasi: <strong>{selectedEmployee.careerPathTarget.rotationNeedLabel}</strong>
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                      {detailMode === "succession" && selectedEmployee.isCandidate
                        ? "Kebutuhan Kesiapan Suksesor:"
                        : detailMode === "career_path"
                        ? "Fokus Kesenjangan Pengalaman Lintas Fungsi:"
                        : "Gap Analisis Kompetensi AI:"}
                    </span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {detailMode === "succession" && selectedEmployee.candidateTarget
                        ? selectedEmployee.candidateTarget.gap
                        : detailMode === "career_path"
                        ? selectedEmployee.careerPathTarget.crossFunctionalGaps.join(" • ")
                        : selectedEmployee.currentGapTarget.gap}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* =============================================================== */}
              {/* BANNER VISUAL KHUSUS MODE CAREER PATH: SKENARIO ROTASI 2 TAHUN  */}
              {/* =============================================================== */}
              {detailMode === "career_path" && (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-emerald-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          Simulasi Jalur Rotasi &amp; Penugasan (Accelerated Development)
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-900 font-bold">
                          Total Skenario: 2 Tahun (24 Bulan)
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
                        <span>Target Peran Strategis:</span>
                        <span className="text-emerald-800 underline decoration-emerald-400">
                          {selectedEmployee.careerPathTarget.targetPositionTitle}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-4xl">
                        {selectedEmployee.careerPathTarget.targetRoleRationale}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Durasi di Posisi Saat Ini
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {selectedEmployee.careerPathTarget.currentPositionDuration}
                      </span>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        {selectedEmployee.careerPathTarget.rotationNeedLabel}
                      </span>
                    </div>
                  </div>

                  {/* 3 Kotak Analisis Bukti / Input Riwayat */}
                  <div className="grid gap-3 md:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        1. Analisis Stagnasi Jabatan
                      </span>
                      <p className="mt-1.5 text-slate-700 leading-relaxed font-medium">
                        {selectedEmployee.careerPathTarget.stagnationAnalysis}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-blue-600" />
                        2. Rekam Jejak Penugasan (Career History)
                      </span>
                      <ul className="mt-1.5 space-y-1 text-slate-700">
                        {selectedEmployee.careerPathTarget.careerHistorySummary.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Target className="h-3 w-3 text-purple-600" />
                        3. Gap Lintas Fungsi Teridentifikasi
                      </span>
                      <p className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1 font-semibold">
                        Kandidat sering gagal bukan karena teknis, melainkan kurang pengalaman lintas fungsi.
                      </p>
                      <ul className="mt-1.5 space-y-1 text-slate-700">
                        {selectedEmployee.careerPathTarget.crossFunctionalGaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* ROADMAP 3 TAHAP ROTASI 2 TAHUN (VISUAL STEPPERS) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Milestone className="h-4 w-4 text-emerald-700" />
                        Skenario Rotasi Lintas Fungsi 2 Tahun (Total 24 Bulan)
                      </h4>
                      <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        3 Tahap Penugasan @ 8 Bulan
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {selectedEmployee.careerPathTarget.phases.map((phase) => (
                        <div
                          key={phase.phaseNumber}
                          className="rounded-xl border border-emerald-200/90 bg-white p-3.5 shadow-2xs relative flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 border-b pb-2 mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Tahap {phase.phaseNumber} • {phase.duration}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {phase.targetDivision}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug">
                              {phase.targetDepartment}
                            </h5>
                            <p className="mt-2 text-[11px] font-semibold text-emerald-950 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                              📌 <span className="font-bold">Target Proyek:</span> {phase.projectAssignment}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                              🎯 <span className="font-semibold text-slate-800">Deliverable:</span> {phase.expectedDeliverable}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Mentor Eksekutif:</span>
                            <span className="font-bold text-slate-700">{phase.mentorRole}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rincian Tabel 70-20-10 Sesuai Tab Terpilih */}
              {(() => {
                const activitiesToDisplay =
                  detailMode === "succession" && selectedEmployee.candidateTarget
                    ? selectedEmployee.candidateTarget.activities
                    : detailMode === "career_path"
                    ? selectedEmployee.careerPathTarget.activities
                    : selectedEmployee.currentGapTarget.activities;

                const tableTitle =
                  detailMode === "succession" && selectedEmployee.isCandidate
                    ? "Kurikulum Suksesi Kepemimpinan"
                    : detailMode === "career_path"
                    ? "Kurikulum Rotasi & Penugasan Lintas Fungsi (Accelerated Development)"
                    : "Kurikulum Current Gap";

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <BookOpenCheck className="h-3.5 w-3.5 text-purple-600" />
                        <span>Rincian Aktivitas IDP ({tableTitle})</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {activitiesToDisplay.length} aktivitas
                      </span>
                    </div>

                    <TableShell>
                      <table className="w-full text-sm min-w-[1280px]">
                        <thead className="bg-slate-50/80 border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="p-3.5 text-center w-40 font-semibold whitespace-nowrap">
                              Tipe Learning
                            </th>
                            <th className="p-3.5 font-semibold min-w-40">Skill Improvement</th>
                            <th className="p-3.5 font-semibold min-w-64">
                              Program / Training (AI Baseline)
                            </th>
                            <th className="p-3.5 font-semibold min-w-36">Provider</th>
                            <th className="p-3.5 text-center w-24 font-semibold whitespace-nowrap">
                              Timeline
                            </th>
                            <th className="p-3.5 text-center w-28 font-semibold whitespace-nowrap">
                              Status
                            </th>
                            {/* KOLOM 1: Review by Lead */}
                            <th className="p-3.5 text-center min-w-36 font-semibold whitespace-nowrap">
                              Review by Lead
                            </th>
                            {/* KOLOM 2: Karyawan Regis */}
                            <th className="p-3.5 text-center min-w-36 font-semibold whitespace-nowrap">
                              Karyawan Regis
                            </th>
                            <th className="p-3.5 font-semibold min-w-56">Success Criteria</th>
                            <th className="p-3.5 font-semibold min-w-44">Catatan Lead</th>
                            {canEdit && <th className="p-3.5 text-right font-semibold w-20">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activitiesToDisplay.map((activity) => (
                            <tr
                              key={`${activity.employeePersonnelNumber}-${activity.activityKey}`}
                              className="align-middle hover:bg-slate-50/60 transition-colors"
                            >
                              {/* 1. Tipe Learning */}
                              <td className="p-3.5 text-center align-middle whitespace-nowrap">
                                <LearningTypeBadge type={activity.learningType} />
                              </td>

                              {/* 2. Skill Improvement */}
                              <td className="p-3.5 min-w-40 align-middle font-semibold text-slate-900 text-xs">
                                {activity.skillImprovement}
                              </td>

                              {/* 3. Program / Training Name (AI Baseline) */}
                              <td className="p-3.5 min-w-64 align-middle text-slate-700 text-xs leading-relaxed">
                                <p className="font-medium text-slate-900">{activity.programName}</p>
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="inline-flex items-center gap-1 text-[9px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.2 font-medium">
                                    <Sparkles className="h-2.5 w-2.5 text-purple-600" />
                                    AI Baseline
                                  </span>
                                </div>
                              </td>

                              {/* 4. Provider */}
                              <td className="p-3.5 min-w-36 align-middle text-slate-600 text-xs">
                                {activity.provider}
                              </td>

                              {/* 5. Timeline */}
                              <td className="p-3.5 text-center align-middle whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-slate-600 border-slate-200 font-medium"
                                >
                                  {activity.timeline}
                                </Badge>
                              </td>

                              {/* 6. Status */}
                              <td className="p-3.5 text-center align-middle whitespace-nowrap">
                                <StatusBadge status={activity.status} />
                              </td>

                              {/* KOLOM 1: Review by Lead */}
                              <td className="p-3.5 text-center align-middle whitespace-nowrap">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]",
                                    activity.alignment.leadReview.badgeClass
                                  )}
                                >
                                  {activity.alignment.leadReview.label}
                                </span>
                              </td>

                              {/* KOLOM 2: Karyawan Regis */}
                              <td className="p-3.5 text-center align-middle whitespace-nowrap">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]",
                                    activity.alignment.employeeTraining.badgeClass
                                  )}
                                >
                                  {activity.alignment.employeeTraining.status === "COMPLETED" ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : activity.alignment.employeeTraining.status === "IN_PROGRESS" ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-slate-400" />
                                  )}
                                  <span>{activity.alignment.employeeTraining.label}</span>
                                </span>
                              </td>

                              {/* 7. Success Criteria */}
                              <td className="p-3.5 min-w-56 align-middle text-slate-600 text-xs leading-relaxed">
                                {activity.successCriteria}
                              </td>

                              {/* 8. Catatan Lead */}
                              <td className="p-3.5 min-w-44 align-middle text-slate-500 text-xs italic">
                                {activity.notes ? (
                                  <span className="not-italic text-slate-700 bg-amber-50/70 p-1.5 rounded border border-amber-200 block text-[11px]">
                                    ✏️ &quot;{activity.notes}&quot;
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Belum ada catatan</span>
                                )}
                              </td>

                              {/* 9. Aksi Edit */}
                              {canEdit && (
                                <td className="p-3.5 text-right align-middle whitespace-nowrap w-20">
                                  <LearningMonitoringEditor activity={activity} mode="edit" />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableShell>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// HELPER BADGES & FUNCTIONS
// =============================================================================

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
  return <Badge variant="outline" className="whitespace-nowrap text-[10px]">{type}</Badge>;
}

function newManualActivity(
  section: IdpEmployeeSection,
  targetPosition: string,
  gap: string
): EditableLearningActivity {
  return {
    employeePersonnelNumber: section.profileId,
    employeeName: section.employeeName,
    activityKey: "",
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
