"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Plus,
  MessagesSquare,
  ClipboardList,
  Target,
  CheckCircle2,
  ArrowRightCircle,
  User,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TableShell } from "@/components/admin/hr-module-ui";
import { CoachingFormDialog } from "@/components/admin/coaching-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { formatDate } from "@/lib/utils";
import type {
  CoachingCycle,
  CoachingGovernanceRow,
  CoachingGovernanceSession,
} from "@/lib/services/hr-modules.service";

interface CoachingGovernanceTableProps {
  rows: CoachingGovernanceRow[];
  employeesForDialog?: Array<{
    id: string;
    name: string;
    department?: string | null;
    supervisorName?: string | null;
  }>;
}

export function CoachingGovernanceTable({
  rows,
  employeesForDialog = [],
}: CoachingGovernanceTableProps) {
  const [selectedRow, setSelectedRow] = useState<CoachingGovernanceRow | null>(null);

  // Keep selectedRow synced with updated rows if background refresh happens
  const activeRow = selectedRow
    ? rows.find((r) => r.profileId === selectedRow.profileId) ?? selectedRow
    : null;

  return (
    <>
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Position</th>
              <th className="py-3.5 px-4">Organization</th>
              <th className="py-3.5 px-4 text-center">Progress</th>
              <th className="py-3.5 px-4">Coach</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedRow(row)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* 1. Employee */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-200">
                      <AvatarFallback className="bg-emerald-50 text-emerald-700 font-semibold text-xs">
                        {getInitials(row.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {row.employeeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.employeeId ? `NIK: ${row.employeeId}` : row.email || "Employee"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 2. Position */}
                <td className="py-4 px-4 font-medium text-slate-800">
                  {row.currentPosition}
                </td>

                {/* 3. Organization */}
                <td className="py-4 px-4 text-xs leading-relaxed">
                  <span className="font-medium text-slate-900">{row.directorate}</span>
                  <p className="text-muted-foreground">
                    {row.division} &middot; {row.department}
                  </p>
                </td>

                {/* 4. Progress */}
                <td className="py-4 px-4 text-center">
                  {row.progress !== "-" ? (
                    <div className="inline-flex flex-col items-center gap-1">
                      <Badge variant="secondary" className="font-medium px-2.5 py-0.5 text-xs">
                        {row.progress}
                      </Badge>
                      <Badge
                        variant={formatCoachingBadgeVariant(row.status)}
                        className="text-[10px] px-2 py-0"
                      >
                        {formatCoachingStatus(row.status)}
                      </Badge>
                      {row.cycles && row.cycles.length > 1 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200/60 mt-0.5 whitespace-nowrap">
                          {row.cycles.length} Siklus &bull; {row.cycles[0].status === "COMPLETED" ? "Siklus 1 Selesai" : `${row.cycles[0].completedSessions}/${row.cycles[0].totalSessions}`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs">-</span>
                  )}
                </td>

                {/* 5. Coach */}
                <td className="py-4 px-4">
                  {row.coach && row.coach !== "-" ? (
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span>{row.coach}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs">-</span>
                  )}
                </td>

                {/* 6. Action */}
                <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRow(row)}
                      className="h-8 gap-1.5 px-3 text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </Button>
                    <CoachingFormDialog
                      mode="create"
                      profileId={row.profileId}
                      defaultCoachName={row.coach !== "-" ? row.coach : ""}
                      defaultSessionNumber={row.sessions.length + 1}
                      defaultTotalSessions={row.totalSessions > 0 ? row.totalSessions : 3}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                          title="Tambah sesi coaching baru"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {/* DETAIL MODAL - GROUPED SESSIONS BY CYCLE/PROGRAM */}
      <Dialog open={!!activeRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          {activeRow && (
            <div className="space-y-6">
              {/* Employee Summary Card */}
              <DialogHeader className="space-y-3 pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-12 w-12 border border-slate-200 mt-0.5">
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-base">
                        {getInitials(activeRow.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {activeRow.employeeName}
                        <Link
                          href={`/admin/employee-management/${activeRow.profileId}`}
                          className="text-xs text-muted-foreground hover:text-emerald-700 inline-flex items-center gap-0.5 font-normal"
                          title="Buka Profil Lengkap"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </DialogTitle>
                      <DialogDescription className="text-sm font-medium text-slate-700">
                        {activeRow.currentPosition}
                      </DialogDescription>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {activeRow.directorate} &middot; {activeRow.division} &middot; {activeRow.department}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Coach badge in header */}
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs py-1 px-2.5">
                        Coach:{" "}
                        <span className={activeRow.coach !== "-" ? "font-semibold ml-1 text-slate-800" : "font-normal ml-1 text-slate-400"}>
                          {activeRow.coach !== "-" ? activeRow.coach : "-"}
                        </span>
                      </Badge>
                      <Badge
                        variant={formatCoachingBadgeVariant(activeRow.status)}
                        className="text-xs py-1 px-2.5"
                      >
                        {formatCoachingStatus(activeRow.status)}
                      </Badge>
                    </div>
                    <CoachingFormDialog
                      mode="create"
                      profileId={activeRow.profileId}
                      defaultCoachName={activeRow.coach !== "-" ? activeRow.coach : ""}
                      defaultSessionNumber={activeRow.sessions.length + 1}
                      defaultTotalSessions={activeRow.totalSessions > 0 ? activeRow.totalSessions : 3}
                      trigger={
                        <Button size="sm" className="gap-1.5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white">
                          <Plus className="h-3.5 w-3.5" />
                          Tambah Sesi Coaching
                        </Button>
                      }
                    />
                  </div>
                </div>
              </DialogHeader>

              {/* Sessions Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Catatan Sesi Coaching
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeRow.cycles && activeRow.cycles.length > 1
                      ? `Terkelompok dalam ${activeRow.cycles.length} program/siklus (${activeRow.sessions.length} sesi terdaftar).`
                      : `Menampilkan seluruh riwayat pertemuan dari pertemuan 1 sampai terakhir (${activeRow.sessions.length} sesi terdaftar).`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                    {activeRow.progress !== "-" ? activeRow.progress : "Belum ada sesi"}
                  </Badge>
                  {activeRow.progress !== "-" && (
                    <Badge
                      variant={formatCoachingBadgeVariant(activeRow.status)}
                      className="text-xs font-medium px-2 py-0.5"
                    >
                      {formatCoachingStatus(activeRow.status)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Grouped Sessions List (Rendered by Program / Siklus) */}
              {(!activeRow.cycles || activeRow.cycles.length === 0) ? (
                <Card className="border-dashed border-slate-200">
                  <CardContent className="py-12 text-center space-y-2">
                    <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="font-semibold text-sm text-slate-700">
                      Belum ada riwayat coaching di database
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Riwayat coaching untuk karyawan ini masih kosong. Klik tombol &quot;Tambah Sesi Coaching&quot; di atas untuk menjadwalkan sesi pertama dan menentukan coach.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {activeRow.cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 shadow-xs"
                    >
                      {/* Cycle Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-700 hover:bg-emerald-700 text-white font-semibold text-xs px-2.5 py-0.5">
                              Siklus {cycle.cycleNumber}
                            </Badge>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                              {cycle.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            Coach: <span className="font-semibold text-slate-800">{cycle.coachName || "-"}</span>
                            <span className="text-slate-300 mx-1">&bull;</span>
                            <span>{cycle.completedSessions} dari {cycle.totalSessions} sesi selesai</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <Badge
                            variant={formatCoachingBadgeVariant(cycle.status)}
                            className="text-xs py-1 px-2.5 font-medium"
                          >
                            {formatCoachingStatus(cycle.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Sessions within this Cycle */}
                      <div className="space-y-3.5">
                        {cycle.sessions.map((session) => {
                          const cleanGoals = session.goals.replace(/^\[.*?\]\s*/, "");
                          return (
                            <Card key={session.id} className="border border-slate-200 shadow-xs bg-white overflow-hidden">
                              <CardContent className="space-y-4 p-4 sm:p-5">
                                {/* Session Top Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      Pertemuan ke-{session.sessionNumber}{" "}
                                      <span className="text-xs font-normal text-muted-foreground">
                                        dari {session.totalSessions} pertemuan
                                      </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      Coach: <span className="font-medium text-slate-700">{session.coachName}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(session.coachingDate)}
                                    </Badge>
                                    <Badge
                                      variant={formatCoachingBadgeVariant(session.status)}
                                      className="text-xs"
                                    >
                                      {formatCoachingStatus(session.status)}
                                    </Badge>

                                    {/* Edit Session */}
                                    <CoachingFormDialog
                                      mode="edit"
                                      profileId={activeRow.profileId}
                                      coaching={{
                                        id: session.id,
                                        coachName: session.coachName,
                                        coachingDate: session.coachingDate,
                                        sessionNumber: session.sessionNumber,
                                        totalSessions: session.totalSessions,
                                        status: session.status,
                                        goals: session.goals,
                                        discussionNotes: session.discussionNotes,
                                        resultOutcome: session.resultOutcome,
                                        followUpAction: session.followUpAction,
                                      }}
                                      trigger={
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-xs gap-1 hover:bg-slate-100"
                                        >
                                          <Pencil className="h-3 w-3" />
                                          Edit
                                        </Button>
                                      }
                                    />

                                    {/* Delete Session (if DB record) */}
                                    {session.isDbRecord && (
                                      <ConfirmDelete
                                        endpoint={`/api/admin/coaching/${session.id}`}
                                        label="sesi coaching"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* 5 Onboarding-Identical Coaching Sections: Progress, Goals, Discussion, Outcome, Follow Up */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <CoachingSection
                                    icon={ClipboardList}
                                    title="Progress"
                                    value={`Pertemuan ${session.sessionNumber} dari ${session.totalSessions} - ${formatCoachingStatus(session.status)}`}
                                  />
                                  <CoachingSection
                                    icon={Target}
                                    title="Goals"
                                    value={cleanGoals}
                                  />
                                  <CoachingSection
                                    icon={ClipboardList}
                                    title="Discussion / Notes"
                                    value={session.discussionNotes || "Belum diisi employee"}
                                  />
                                  <CoachingSection
                                    icon={CheckCircle2}
                                    title="Result / Outcome"
                                    value={session.resultOutcome || "Belum diisi coach/HR"}
                                  />
                                  <div className="md:col-span-2">
                                    <CoachingSection
                                      icon={ArrowRightCircle}
                                      title="Follow Up Action"
                                      value={session.followUpAction || "Belum ada tindak lanjut"}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CoachingSection({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-600" />
        {title}
      </p>
      <p className="mt-1.5 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
        {value}
      </p>
    </div>
  );
}

function formatCoachingStatus(status: string) {
  if (status === "NOT_STARTED") return "Belum Dimulai";
  if (status === "COMPLETED") return "Selesai";
  return "On Progress";
}

function formatCoachingBadgeVariant(
  status: string
): "default" | "secondary" | "outline" {
  if (status === "COMPLETED") return "default";
  if (status === "NOT_STARTED") return "outline";
  return "secondary";
}

function getInitials(name: string) {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
