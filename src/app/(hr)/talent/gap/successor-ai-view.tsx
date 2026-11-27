import Link from "next/link";
import {
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableShell } from "@/components/admin/hr-module-ui";
import { TalentAiPanel } from "@/components/admin/talent-ai-panel";
import {
  getSuccessionPipeline,
  type SuccessionTarget,
  type SuccessorCandidate,
} from "@/lib/services/succession.service";
import {
  getTalentPositionAiProfile,
  type TalentPositionAiProfile,
} from "@/lib/services/od-talent-matching.service";
import { listEmployeeMaster, type EmployeeMaster } from "@/lib/services/hr-modules.service";
import { cn } from "@/lib/utils";

interface SuccessorAiViewProps {
  filters: Record<string, string | undefined>;
  isSuper: boolean;
}

export async function SuccessorAiView({ filters, isSuper }: SuccessorAiViewProps) {
  const [pipeline, allEmployees] = await Promise.all([
    getSuccessionPipeline(),
    listEmployeeMaster(),
  ]);

  // Determine active target incumbent
  const selectedIncumbentParam = filters.incumbent || pipeline[0]?.id;
  const currentTarget: SuccessionTarget =
    pipeline.find(
      (t) =>
        t.id === selectedIncumbentParam ||
        t.incumbentName.toLowerCase() === selectedIncumbentParam?.toLowerCase()
    ) || pipeline[0];

  // Fetch target leadership position AI profile (competencies, responsibilities)
  const positionProfile: TalentPositionAiProfile | null = currentTarget
    ? await getTalentPositionAiProfile(currentTarget.positionTitle)
    : null;

  // Filter successors by readiness or search query if supplied
  const searchQuery = (filters.q || "").toLowerCase().trim();
  const readinessFilter = filters.readiness || "ALL";

  const successorRows = currentTarget.successors
    .filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery) ||
        (s.currentPosition && s.currentPosition.toLowerCase().includes(searchQuery));
      const matchReadiness =
        readinessFilter === "ALL" || s.readiness === readinessFilter;
      return matchSearch && matchReadiness;
    })
    .map((succ) => {
      // Find employee master profile for detailed background & AI employeeId
      const matchedEmployee = allEmployees.find(
        (emp) =>
          emp.name.toLowerCase() === succ.name.toLowerCase() ||
          emp.name.toLowerCase().includes(succ.name.toLowerCase()) ||
          succ.name.toLowerCase().includes(emp.name.toLowerCase())
      );
      return {
        ...succ,
        employee: matchedEmployee,
      };
    });

  // Determine selected successor candidate to analyze
  const analyzeCandidateId = filters.analyze;
  const selectedCandidate = analyzeCandidateId
    ? successorRows.find(
        (r) => r.employee?.profileId === analyzeCandidateId || r.name.toLowerCase() === analyzeCandidateId.toLowerCase()
      )
    : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            Pilih Incumbent Posisi Kunci:
          </span>
          <select
            defaultValue={currentTarget.id}
            onChange={(e) => {
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("mode", "successor");
                url.searchParams.set("incumbent", e.target.value);
                url.searchParams.delete("analyze");
                window.location.href = url.toString();
              }
            }}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            {pipeline.map((t) => (
              <option key={t.id} value={t.id}>
                {t.incumbentName} — {t.positionTitle} ({t.golongan})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Readiness Filter */}
          <select
            defaultValue={readinessFilter}
            onChange={(e) => {
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("mode", "successor");
                url.searchParams.set("readiness", e.target.value);
                window.location.href = url.toString();
              }
            }}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Semua Kesiapan</option>
            <option value="READY_NOW">Hanya Ready Now</option>
            <option value="READY_LATER">Hanya Ready Later</option>
          </select>

          {/* Quick link back to full succession directory */}
          <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-slate-200">
            <Link href="/talent/succession">
              <Trophy className="h-3.5 w-3.5 text-purple-600" />
              <span>Buka Succession Planning</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Target Incumbent Leadership Summary Card */}
      <Card className="overflow-hidden border-slate-200 shadow-xs bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  Target Posisi Kunci & Leadership
                </span>
                {currentTarget.golongan && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                    Golongan {currentTarget.golongan}
                  </span>
                )}
                <span className="text-[11px] text-slate-300 font-medium">
                  {currentTarget.division}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentTarget.positionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Incumbent Saat Ini: <strong className="text-white font-semibold">{currentTarget.incumbentName}</strong> • {currentTarget.directorate}
              </p>
              {positionProfile?.jobDescription && (
                <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl pt-1">
                  {positionProfile.jobDescription}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 text-center min-w-[130px]">
                <p className="text-2xl font-bold text-emerald-400 leading-none">
                  {currentTarget.successors.length}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Calon Suksesor</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 text-center min-w-[130px]">
                <p className="text-2xl font-bold text-amber-300 leading-none">
                  {currentTarget.successors.filter((s) => s.readiness === "READY_NOW").length}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Ready Now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Deep Dive AI Analysis Section if Candidate Selected */}
      {selectedCandidate && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Left: Candidate Profile & Context */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Calon Suksesor Terpilih
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-600 font-medium">
                  {selectedCandidate.currentPosition || "Posisi belum tersedia"}
                </p>
                {selectedCandidate.department && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedCandidate.department}</p>
                )}
              </div>

              <div className="text-right">
                {selectedCandidate.readiness === "READY_NOW" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                    🟢 Ready Now
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold">
                    🟡 Ready Later
                  </Badge>
                )}
                {selectedCandidate.priorityOrder && (
                  <p className="text-[10px] font-mono font-semibold text-slate-500 mt-1">
                    Nominasi #{selectedCandidate.priorityOrder}
                  </p>
                )}
              </div>
            </div>

            {/* Target Leadership Benchmark */}
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-3.5 space-y-2">
              <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-purple-700" />
                Target Posisi Suksesi yang Dianalisis:
              </p>
              <p className="text-xs font-semibold text-slate-900">
                {currentTarget.positionTitle} ({currentTarget.golongan})
              </p>
              <p className="text-[11px] text-slate-600">
                Menggantikan: <strong>{currentTarget.incumbentName}</strong>
              </p>
            </div>

            {/* Competency Requirements Benchmark */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Standar Kompetensi & Leadership Posisi Target:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {positionProfile?.competencyRequirements.length ? (
                  positionProfile.competencyRequirements.slice(0, 8).map((req) => (
                    <Badge
                      key={req.competencyName}
                      variant="outline"
                      className="text-[10px] bg-slate-50 border-slate-200 font-medium text-slate-700"
                    >
                      {req.competencyName} (S{req.requiredLevel})
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Memakai standard role competencies Berau Coal
                  </p>
                )}
              </div>
            </div>

            {/* Candidate Current Competency Evidence */}
            {selectedCandidate.employee && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700">
                  Evidence Kompetensi & Proyek Calon Saat Ini:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.employee.currentSkills?.slice(0, 6).map((sk) => (
                    <Badge
                      key={sk}
                      className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                    >
                      {sk}
                    </Badge>
                  ))}
                  {selectedCandidate.employee.projects?.slice(0, 3).map((pr) => (
                    <Badge
                      key={pr}
                      variant="secondary"
                      className="text-[10px] bg-blue-50 text-blue-800 border-blue-200 font-medium"
                    >
                      {pr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Succession Gap Analysis & IDP Plan */}
          <div>
            <TalentAiPanel
              analysisType="SKILL_GAP"
              employeeId={selectedCandidate.employee?.profileId ?? selectedCandidate.name}
              targetPosition={positionProfile?.id ?? currentTarget.positionTitle}
              buttonLabel="Analisis Leadership Gap & IDP Suksesi (AI)"
            />
          </div>
        </section>
      )}

      {/* 4. Successors Bench Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-purple-600" />
            Daftar Calon Suksesor untuk {currentTarget.incumbentName} ({successorRows.length} Orang)
          </h3>
          <p className="text-xs text-slate-500">
            Klik tombol <strong>&quot;Analisis Gap AI&quot;</strong> pada kandidat untuk melihat kesiapan dan rekomendasi IDP.
          </p>
        </div>

        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-slate-200">
              <tr>
                <th className="p-4">Prioritas</th>
                <th className="p-4">Calon Suksesor</th>
                <th className="p-4">Jabatan Saat Ini</th>
                <th className="p-4">Golongan</th>
                <th className="p-4">Kesiapan</th>
                <th className="p-4">Asal Sumber</th>
                <th className="p-4 text-right">Aksi Analisis AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {successorRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada calon suksesor yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                successorRows.map((row, idx) => {
                  const isSelected =
                    selectedCandidate?.name.toLowerCase() === row.name.toLowerCase();
                  const analyzeId = row.employee?.profileId || row.name;

                  return (
                    <tr
                      key={`${row.name}-${idx}`}
                      className={cn(
                        "transition-colors hover:bg-slate-50/80",
                        isSelected && "bg-purple-50/60 font-semibold"
                      )}
                    >
                      <td className="p-4 font-mono font-bold text-xs text-slate-600">
                        #{row.priorityOrder ?? idx + 1}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{row.name}</span>
                          {row.employee?.talentClass && row.employee.talentClass !== "-" && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 bg-amber-50 text-amber-800">
                              {row.employee.talentClass}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-700">
                        {row.currentPosition || "-"}
                      </td>

                      <td className="p-4 font-mono text-xs">
                        {row.golongan || "-"}
                      </td>

                      <td className="p-4">
                        {row.readiness === "READY_NOW" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            Ready Now
                          </Badge>
                        ) : row.readiness === "READY_LATER" ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                            Ready Later
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-600">
                            Kandidat
                          </Badge>
                        )}
                      </td>

                      <td className="p-4 text-xs text-slate-600">
                        {row.source === "INTERNAL_SUBDIV" ? (
                          <span className="font-semibold text-slate-700">Internal Subdiv</span>
                        ) : row.source === "OUTSIDE_ORGANIZATION" ? (
                          <span className="font-semibold text-purple-700">Outside Org</span>
                        ) : (
                          "Umum"
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100 font-semibold"
                          >
                            <Link
                              href={`/learning/idp?detail=${encodeURIComponent(row.name)}`}
                            >
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              <span>Lihat IDP</span>
                            </Link>
                          </Button>

                          <Button
                            asChild
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "h-8 text-xs gap-1.5 font-semibold",
                              isSelected
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            )}
                          >
                            <Link
                              href={`/talent/gap?mode=successor&incumbent=${currentTarget.id}&analyze=${encodeURIComponent(analyzeId)}`}
                            >
                              <BrainCircuit className="h-3.5 w-3.5" />
                              <span>{isSelected ? "Sedang Dianalisis" : "Analisis Gap AI"}</span>
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableShell>
      </div>
    </div>
  );
}
