import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Compass,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBigQueryEmployeeProfile } from "@/lib/services/bq-employee.service";
import { getLatestTalentAiAnalysisForEmployee } from "@/lib/services/talent-ai.service";
import { filterCommentsForCurrentYear } from "@/lib/services/talent-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/utils";
import type { TalentTrack } from "@/lib/services/talent-development.service";
import {
  getEmployeeCompetencyProfile,
  type CompetencyScaleItem,
  type EmployeeCompetencyProfile,
} from "@/lib/services/employee-competency.service";
import {
  getEmployeeOdSkillGap,
  type OdTalentMatchRow,
} from "@/lib/services/od-talent-matching.service";

export const metadata = { title: "Talent Card - Harmoni" };

export default async function EmployeeTalentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [profile, storedCurrentGap] = await Promise.all([
    getBigQueryEmployeeProfile(id),
    getLatestTalentAiAnalysisForEmployee({ analysisType: "SKILL_GAP", employeeId: id }),
  ]);

  if (!profile) notFound();

  const odSkillGap = await getEmployeeOdSkillGap({
    employeeCode: id,
    employeeName: profile.user?.name,
    positionName: profile.position,
  });

  const currentYear = new Date().getFullYear();
  const talent = toTalentTrack(profile.talentData);
  const competencyProfile = await getEmployeeCompetencyProfile(
    id,
    profile.position ?? undefined,
    profile.user.name ?? undefined
  );

  // Matriks Level Kompetensi Ideal Posisi dari OD
  const targetLevelsMap = new Map<string, number>();
  if (odSkillGap?.competencyGaps?.length) {
    for (const g of odSkillGap.competencyGaps) {
      if (typeof g.requiredLevel === "number" && g.requiredLevel > 0) {
        targetLevelsMap.set(normalizeSkillKey(g.competencyName), g.requiredLevel);
      }
    }
  }

  if (targetLevelsMap.size === 0 && profile.position) {
    try {
      const posReqs = await prisma.talentPositionSkillRequirement.findMany({
        where: {
          position: {
            positionName: { contains: profile.position.split(" ")[0], mode: "insensitive" },
          },
          isActive: true,
        },
        include: { skill: true },
      });
      for (const pr of posReqs) {
        targetLevelsMap.set(normalizeSkillKey(pr.skill.skillName), pr.requiredLevel);
      }
    } catch {
      // ignore
    }
  }

  if (!talent.behavioral?.length && competencyProfile.softCompetencies.length) {
    talent.behavioral = competencyProfile.softCompetencies.map(
      (c) => `${c.name} (Level ${c.profId})`
    );
  }
  if (!talent.technical?.length && competencyProfile.technicalCompetencies.length) {
    talent.technical = competencyProfile.technicalCompetencies.map(
      (c) => `${c.name} (Level ${c.profId})`
    );
  }

  const currentPositionDuration = talent.currentPositionDuration;
  const education = talent.education;
  const certificationItems = filterItemsLast3Years(certificationListFor(talent), currentYear);
  const filteredProjects = filterItemsLast3Years(talent.projects, currentYear);
  const aspirationEntries = parseAspirationEntries(talent.aspiration, 3);
  const strengths = talent.strength ?? [];
  const weaknesses = talent.weakness ?? [];
  const currentGapInsight = storedCurrentGap?.result
    ? formatCurrentGapInsight(storedCurrentGap.result, odSkillGap, competencyProfile, targetLevelsMap)
    : null;

  return (
    <div className="space-y-5 pb-8 text-slate-950">
      <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="gap-2 rounded-full bg-white">
                <Link href="/admin/employee-management">
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Talent Dictionary
                </Link>
              </Button>
            </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:p-8">
          <div className="border-b-2 border-red-500/80 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Talent / Employee Card - BERAU COAL
              </h1>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* Kolom 1: Profil & Catatan Karyawan */}
            <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
              <Panel title="Profil Karyawan" tone="soft">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="h-36 w-28 rounded-xl border border-slate-200 bg-slate-50">
                    {profile.photoUrl && <AvatarImage src={profile.photoUrl} alt={profile.user.name} className="object-cover" />}
                    <AvatarFallback className="rounded-xl bg-primary/15 text-2xl font-semibold text-primary">
                      {getInitials(profile.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-slate-400">Talent Profile</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">{profile.user.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{profile.user.email}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 text-sm">
                  <DataRow icon={Briefcase} label="Current Position" value={profile.position ?? "Belum diisi"} />
                  <DataRow icon={CalendarDays} label="Current Position Duration" value={currentPositionDuration ?? "Belum diisi"} />
                  <DataRow icon={Briefcase} label="Job Level" value={show(talent.jobLevel)} />
                  <DataRow icon={Building2} label="Department" value={profile.department ?? "Belum diisi"} />
                  <DataRow icon={CalendarDays} label="Join Date" value={formatDate(profile.joinDate)} />
                  <DataRow icon={UserRound} label="Supervisor" value={profile.supervisorName ?? "Belum diisi"} />
                  <DataRow icon={MapPin} label="Work Location" value={talent.workLocation ?? "Belum diisi"} />
                  <DataRow icon={Phone} label="Phone" value={profile.phone ?? "Belum diisi"} />
                  <DataRow icon={Mail} label="Email" value={profile.user.email ?? "Belum diisi"} />
                </div>
              </Panel>

              <Panel title="Attachments & Notes">
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                  <SourceField label="CV / Resume" value={profile.cvUrl ? "Tersedia" : "Belum diisi"} source="File" />
                  <SourceField label="Catatan HR" value="Belum diisi" source="HR" />
                </div>
              </Panel>
            </div>

            {/* Kolom 2: Talent, Competencies, Experience, & Performance */}
            <div className="space-y-4 min-w-0">
              {/* 1. Capability & Talent Profile */}
              <Panel title="Capability & Talent Profile" source="BigQuery" period="Data Terkini">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <SourceField label="Current Role" value={show(talent.currentRole, "Belum diisi")} />
                  <SourceField label="Talent Class" value={show(talent.talentClass)} />
                  <SourceField label="Education" value={show(education)} />
                  <SourceField label="Fast Track" value={fastTrackProgram(talent, currentYear)} />
                  <SourceField className="sm:col-span-2 lg:col-span-4" label="BU Visibility Scale" value={show(talent.buVisibility)} />
                </div>
              </Panel>

              {/* 2. Competency Scale */}
              <Panel title="Competency Scale" source="BigQuery" period="Siklus 1-2 Tahun">
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Soft Competencies Scale</p>
                          <p className="text-[10.5px] text-slate-500">
                            {competencyProfile.softCompetencies.length} Kompetensi • Rata-rata: Level {competencyProfile.summary.softAverage} / 5.0
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                          SAP
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {competencyProfile.softCompetencies.map((item) => {
                          const idealLevel =
                            findIdealLevel(item.name, targetLevelsMap) ??
                            getSoftCompetencyIdealLevel(item.name, profile.position, talent.jobLevel);
                          return (
                            <CompetencyItemRow
                              key={`soft-${item.qualId}`}
                              item={item}
                              isSoft
                              idealLevel={idealLevel}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Technical Competency Scale</p>
                          <p className="text-[10.5px] text-slate-500">
                            {competencyProfile.technicalCompetencies.length} Kompetensi • Rata-rata: Level {competencyProfile.summary.technicalAverage} / 5.0
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                          SAP
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {competencyProfile.technicalCompetencies.map((item) => {
                          const idealLevel = findIdealLevel(item.name, targetLevelsMap);
                          return (
                            <CompetencyItemRow
                              key={`tech-${item.groupId}-${item.qualId}`}
                              item={item}
                              isSoft={false}
                              idealLevel={idealLevel}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">Keterangan:</span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                      Aktual: Level pencapaian
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                      Ideal: Standar posisi jabatan
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-700 inline-block" /> Titik target posisi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[9.5px] text-slate-400">
                    <span>L1: Knowledge</span>
                    <span>•</span>
                    <span>L2: Elementary</span>
                    <span>•</span>
                    <span>L3: Advance</span>
                    <span>•</span>
                    <span>L4: Mastery</span>
                    <span>•</span>
                    <span>L5: Expertise</span>
                  </div>
                </div>
              </Panel>

              {/* 3. Grid 2 Kolom Sejajar: Career, Project, Certification, Assessment, HSE */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Baris 1: Career & Experience (Kiri) | Career Aspiration (Kanan) */}
                <Panel title="Career & Experience" source="BigQuery" period="Historis Seluruh Masa Kerja" className="h-full">
                  <div className="flex-1 space-y-2">
                    {talent.careerHistory && talent.careerHistory.length > 0 ? (
                      talent.careerHistory
                        .flatMap((entry) => String(entry).split("\n"))
                        .filter(Boolean)
                        .map((item, idx) => {
                          const { title, period } = parseCareerItem(item);
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0969c2]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold leading-snug text-slate-900">{title}</p>
                                {period && (
                                  <p className="mt-0.5 text-[10.5px] font-semibold text-slate-500">
                                    {period}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <p className="text-xs italic text-slate-400">Belum tersedia dari SAP</p>
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Career Aspiration (MyAgility)" source="BigQuery" period="3 Entri Terbaru" className="h-full">
                  <div className="flex-1 space-y-2">
                    {aspirationEntries && aspirationEntries.length > 0 ? (
                      aspirationEntries.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug text-slate-900">{entry.content}</p>
                            {entry.dateStr && (
                              <p className="mt-0.5 text-[10.5px] font-semibold text-slate-500">
                                {entry.dateStr}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <p className="text-xs italic text-slate-400">Belum tersedia dari SAP / MyAgility</p>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Baris 2: Project Assignment (Kiri) | Certification (Kanan) */}
                <Panel title="Project Assignment" source="BigQuery" period="3 Tahun Terakhir" className="h-full">
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <SourceField label="Project Contribution" value={show(talent.projectContribution)} source="SAP" />
                      <SourceField label="Project Impact" value={show(talent.projectImpact)} source="SAP" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between pb-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Project Involvement
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                          SAP
                        </span>
                      </div>

                      {filteredProjects && filteredProjects.length > 0 ? (
                        <div className="space-y-2">
                          {filteredProjects.map((proj, idx) => {
                            const { title, date } = parseProjectItem(String(proj));
                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold leading-snug text-slate-900">{title}</p>
                                  {date && (
                                    <p className="mt-0.5 text-[10.5px] font-semibold text-slate-500">
                                      {date}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs italic text-slate-400">
                            {talent.projects?.length
                              ? "Belum ada data dalam 3 tahun terakhir"
                              : "Belum tersedia dari SAP"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>

                <Panel title="Certification" source="BigQuery" period="3 Tahun Terakhir" className="h-full">
                  <div className="flex-1 space-y-2">
                    {certificationItems && certificationItems.length > 0 ? (
                      certificationItems.map((certBlock, idx) => {
                        const { title, subtitle } = parseCertificationItem(String(certBlock));
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold leading-snug text-slate-900">{title}</p>
                              {subtitle && (
                                <p className="mt-0.5 text-[10.5px] font-medium leading-normal text-slate-500">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <p className="text-xs italic text-slate-400">
                          {talent.certifications?.length ? "Belum ada data dalam 3 tahun terakhir" : "Belum diisi"}
                        </p>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Baris 3: Assessment (Kiri) | HSE-CT (Kanan) */}
                <Panel title="Assessment" source="BigQuery / Assessment Center" period="Siklus 2-3 Tahun" className="h-full">
                  <div className="grid gap-2.5 grid-cols-2 flex-1">
                    <SourceField label="IQ Score" value={show(talent.assessment?.iq, "Belum diisi")} source="BigQuery" />
                    <SourceField label="IQ Category" value={show(talent.assessment?.iqCategory, "Belum diisi")} source="BigQuery" />
                    <SourceField label="DISC" value={show(talent.assessment?.disc, "Belum diisi")} source="BigQuery" />
                    <SourceField label="DISC Category" value={show(talent.assessment?.discCategory, "Belum diisi")} source="BigQuery" />
                    <SourceField className="col-span-2" label="Matchup Result" value={show(talent.assessment?.matchupResult, "Belum diisi")} source="BigQuery" />
                  </div>
                </Panel>

                <Panel title="HSE-CT" source="HSE / Medical" period="Siklus 1 Tahun" className="h-full">
                  <div className="grid gap-2.5 grid-cols-3 flex-1">
                    <SourceField label="MCU" value={talent.hse?.mcu ?? "Belum diisi"} source="HSE" />
                    <SourceField label="SID" value={talent.hse?.sid ?? "Belum diisi"} source="HSE" />
                    <SourceField label="SIMPER" value={talent.hse?.simper ?? "Belum diisi"} source="HSE" />
                    <SourceField className="col-span-3" label="HSE CT Summary" value={talent.hse?.summary ?? "Belum diisi"} source="HSE" />
                  </div>
                </Panel>
              </div>

              {/* 4. Strength & Weakness */}
              <Panel title="Strength & Weakness" period="Siklus 1 Tahun">
                <ReviewBox
                  title={String(currentYear)}
                  strength={filterCommentsForCurrentYear(strengths, currentYear, `Belum ada data strength untuk tahun ${currentYear}`)}
                  weakness={filterCommentsForCurrentYear(weaknesses, currentYear, `Belum ada data weakness untuk tahun ${currentYear}`)}
                />
              </Panel>

              {/* 5. Performance Profile */}
              <Panel title="Performance Profile" source="BigQuery" period="3 Tahun Terakhir (2023 - 2025)">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <SourceField label="Performance Scale - Year 2025" value={formatPerformanceScale(talent.patByYear?.["2025"])} />
                  <SourceField label="Performance Scale - Year 2024" value={formatPerformanceScale(talent.patByYear?.["2024"])} />
                  <SourceField label="Performance Scale - Year 2023" value={formatPerformanceScale(talent.patByYear?.["2023"])} />
                </div>
                <div className="mt-3">
                  <SourceField
                    label={`360 Comments (${currentYear})`}
                    value={filterCommentsForCurrentYear(talent.supervisorNotes, currentYear, `Belum ada komentar untuk tahun ${currentYear}`)}
                    source="BigQuery"
                  />
                </div>
              </Panel>

              {/* 6. AI Insight */}
              <Panel title="AI Insight from Current Gap" period="Evaluasi Posisi Terkini">
                {currentGapInsight ? (
                  <div className="space-y-4">
                    {/* 1. Header: Readiness Badge & Executive Summary */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-blue-200/60 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                            Executive Readiness Assessment
                          </h4>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                            currentGapInsight.readinessTone === "ready"
                              ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                              : currentGapInsight.readinessTone === "development"
                              ? "border-blue-300 bg-blue-100 text-blue-800"
                              : "border-amber-300 bg-amber-100 text-amber-800"
                          }`}
                        >
                          {currentGapInsight.readinessLabel}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-slate-800">
                        {currentGapInsight.summary}
                      </p>
                    </div>

                    {/* 2. Key Strengths & Skill Gaps */}
                    <div className="grid gap-3.5 md:grid-cols-2">
                      {/* Key Strengths */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <p className="text-xs font-bold text-slate-900">Key Strengths</p>
                        </div>
                        {currentGapInsight.strengths.length ? (
                          <ul className="space-y-2">
                            {currentGapInsight.strengths.map((str, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs italic text-slate-400">Belum ada catatan strength dari AI.</p>
                        )}
                      </div>

                      {/* Skill Gaps */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-bold text-slate-900">Priority Skill Gaps</p>
                        </div>
                        {currentGapInsight.prioritySkillGaps.length ? (
                          <ul className="space-y-2">
                            {currentGapInsight.prioritySkillGaps.map((gap, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{gap.skillName}</span>
                                    {gap.gap !== undefined && (
                                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                        Gap {gap.gap}
                                      </span>
                                    )}
                                  </div>
                                  {gap.evidenceSummary && (
                                    <p className="mt-0.5 text-[11px] text-slate-500">{gap.evidenceSummary}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs italic text-slate-400">Belum tersedia dari SAP</p>
                        )}
                      </div>
                    </div>

                    {/* 3. Recommended Development */}
                    {currentGapInsight.developmentRecommendations.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          <p className="text-xs font-bold text-slate-900">Recommended Development</p>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          {currentGapInsight.developmentRecommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-1 shadow-xs"
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                <p className="text-xs font-bold text-slate-900 leading-snug">{rec.title}</p>
                              </div>
                              {rec.description && (
                                <p className="pl-3.5 text-[11px] leading-relaxed text-slate-600">{rec.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. IDP 70-20-10 Plan */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-teal-600" />
                          <p className="text-xs font-bold text-slate-900">Individual Development Plan (IDP 70-20-10)</p>
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-400">Kerangka Pengembangan Terarah</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {/* 70% Experiential */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-blue-200/60 pb-1.5 mb-2">
                              <span className="text-xs font-bold text-blue-900">70% On-The-Job Action</span>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                                Experiential
                              </span>
                            </div>
                            {currentGapInsight.idpPlan.seventy.length ? (
                              <ul className="space-y-1.5">
                                {currentGapInsight.idpPlan.seventy.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs italic text-slate-400">Belum ada aksi 70%</p>
                            )}
                          </div>
                        </div>

                        {/* 20% Social */}
                        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-purple-200/60 pb-1.5 mb-2">
                              <span className="text-xs font-bold text-purple-900">20% Coaching & Mentoring</span>
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                                Social
                              </span>
                            </div>
                            {currentGapInsight.idpPlan.twenty.length ? (
                              <ul className="space-y-1.5">
                                {currentGapInsight.idpPlan.twenty.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs italic text-slate-400">Belum ada aksi 20%</p>
                            )}
                          </div>
                        </div>

                        {/* 10% Formal */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5 mb-2">
                              <span className="text-xs font-bold text-emerald-900">10% Formal Learning</span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                Formal
                              </span>
                            </div>
                            {currentGapInsight.idpPlan.ten.length ? (
                              <ul className="space-y-1.5">
                                {currentGapInsight.idpPlan.ten.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs italic text-slate-400">Belum ada aksi 10%</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Career Risk / Notes */}
                    {currentGapInsight.notes.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 border-b border-amber-200/70 pb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <p className="text-xs font-bold text-amber-900">Catatan Risiko Karier & Keterbatasan Data</p>
                        </div>
                        <ul className="space-y-1.5">
                          {currentGapInsight.notes.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-amber-950">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">Belum ada AI Insight dari Current Gap.</p>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toTalentTrack(value: unknown): TalentTrack {
  return value && typeof value === "object" && !Array.isArray(value) ? value as TalentTrack : {};
}

const EDUCATION_BY_NIK: Record<string, string> = {
  "11000433": "S2 Universitas Sunan Giri Surabaya (UNSURI)(Hukum Bisnis)",
  "11000078": "S2 Institut Teknologi Bandung (ITB)(Manajemen Bisnis)",
  "11000725": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000390": "S2 Institut Teknologi Bandung (ITB)(Manajemen Bisnis)",
  "11000468": "Teknik Pertambangan",
  "10000055": "S1 Institut Teknologi Bandung (ITB)(Teknik Pertambangan)",
  "10000061": "S1 Universitas Terbuka (UT)(Manajemen)",
  "10000071": "S1 Institut Teknologi Budi Utomo (ITBU)(Teknik Sipil)",
  "11000305": "S1 Universitas Hasanuddin (UNHAS)(Teknik Geologi)",
  "11000308": "S1 Institut Teknologi Bandung (ITB)(Teknik Pertambangan)",
  "11000310": "S2 Institut Teknologi Bandung (ITB)()",
  "11000317": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000354": "S1 Universitas Pembangunan Nasional \"Veteran\" (UPN) Yogyakar",
  "11000358": "S2 Institut Teknologi Bandung (ITB)()",
  "11000372": "S2 Institut Teknologi Bandung (ITB)()",
  "11000401": "S2 Institut Teknologi Bandung (ITB)()",
  "11000407": "S1 Universitas Pembangunan Nasional \"Veteran\" (UPN) Yogyakar",
  "11000414": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000415": "S1 Institut Teknologi Bandung (ITB)(Teknik Pertambangan)",
  "11000425": "S1 Universitas Sriwijaya (UNSRI)(Teknik Pertambangan)",
  "11000429": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000464": "S2 Institut Teknologi Bandung (ITB)(Teknik Pertambangan)",
  "11000543": "S1 Universitas Sriwijaya (UNSRI)(Teknik Pertambangan)",
  "11000624": "S1 Universitas Muslim Indonesia (UMI) Makassar()",
  "11000661": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000769": "S2 Institut Teknik Bandung(Bisnis Internasional)",
  "11000921": "S1 Universitas Diponegoro (UNDIP)()",
  "11000939": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11000987": "S2 Institut Teknologi Bandung (ITB)(Administrasi Bisnis)",
  "11001254": "S2 Institut Teknologi Bandung (ITB)(Manajemen)",
  "11001325": "S1 Institut Teknologi Bandung (ITB)(Teknik Pertambangan)",
  "11001519": "S2 Institut Teknologi Bandung (ITB)(Ilmu Administrasi Fiskal",
};

const CURRENT_POSITION_DURATION_BY_NIK: Record<string, string> = {
  "11000433": "0 Years 11 Months",
  "11000078": "0 Years 3 Months",
  "11000725": "1 Years 8 Months",
  "11000390": "0 Years 11 Months",
  "11000468": "0 Years 4 Months",
  "10000055": "4 Years 7 Months",
  "10000061": "5 Years 7 Months",
  "10000071": "5 Years 7 Months",
  "11000305": "1 Years 7 Months",
  "11000308": "2 Years 7 Months",
  "11000310": "2 Years 7 Months",
  "11000317": "2 Years 7 Months",
  "11000354": "2 Years 7 Months",
  "11000358": "2 Years 7 Months",
  "11000372": "2 Years 7 Months",
  "11000401": "2 Years 7 Months",
  "11000407": "2 Years 7 Months",
  "11000414": "2 Years 7 Months",
  "11000415": "2 Years 7 Months",
  "11000425": "1 Years 7 Months",
  "11000429": "1 Years 7 Months",
  "11000464": "2 Years 7 Months",
  "11000543": "1 Years 7 Months",
  "11000624": "8 Years 7 Months",
  "11000661": "2 Years 7 Months",
  "11000769": "1 Years 7 Months",
  "11000921": "2 Years 7 Months",
  "11000939": "1 Years 7 Months",
  "11000987": "1 Years 7 Months",
  "11001254": "4 Years 7 Months",
  "11001325": "0 Years 7 Months",
  "11001519": "0 Years 7 Months",
};

const PROJECT_SCOPE_BY_NIK: Record<string, string> = {
  "11000433": "Across Dept./Div. (Within BU)",
  "11000078": "Across Dept./Div. (Within BU)",
  "11000725": "Within Dept./Div.",
  "11000390": "Within Dept./Div.",
  "11000468": "Within Dept./Div.",
  "10000055": "Across Dept./Div. (Within BU)",
  "10000061": "Across Dept./Div. (Within BU)",
  "10000071": "Within Dept./Div.",
  "11000305": "Within Dept./Div.",
  "11000308": "Within Dept./Div.",
  "11000310": "Across Dept./Div. (Within BU)",
  "11000317": "Across Dept./Div. (Within BU)",
  "11000354": "Within Dept./Div.",
  "11000358": "Within Dept./Div.",
  "11000372": "Within Dept./Div.",
  "11000401": "Across Dept./Div. (Within BU)",
  "11000407": "Across Dept./Div. (Within BU)",
  "11000414": "Within Dept./Div.",
  "11000415": "Within Dept./Div.",
  "11000425": "Within Dept./Div.",
  "11000429": "Across Dept./Div. (Within BU)",
  "11000464": "Across Dept./Div. (Within BU)",
  "11000543": "Within Dept./Div.",
  "11000624": "Within Dept./Div.",
  "11000661": "Within Dept./Div.",
  "11000769": "Across Dept./Div. (Within BU)",
  "11000921": "Across Dept./Div. (Within BU)",
  "11000939": "Within Dept./Div.",
  "11000987": "Within Dept./Div.",
  "11001254": "Within Dept./Div.",
  "11001325": "Across Dept./Div. (Within BU)",
  "11001519": "Across Dept./Div. (Within BU)",
};

const CERTIFICATION_TRAINING_BY_NIK: Record<string, string[]> = {
  "11000433": ["Workshop and Warehouse Management", "2024 - Project Management: The Basics for Success", "2025 - AI Catalyst Workshop", "Sertifikasi Ahli Investigasi Insiden"],
  "11000078": ["Pelatihan dan Sertifikasi Praktisi Coaching Lisensi BNSP", "Pelatihan dan Sertifikasi Praktisi Coaching Lisensi BNSP", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000725": ["Lean Six Sigma for Leader - batch 3", "2024 - AI For Everyone", "2025 - AI Catalyst Workshop", "2024 - English Workshop - Speak english Confidently and Properly"],
  "11000390": ["2024 - Managerial Management Development Program - Batch 10", "Diklat & Uji Kompetensi Pengawas Operasional Pertama (POP)", "2025 - AI Catalyst Workshop", "2025 - Building Better Communication"],
  "10000055": ["Digital Strategy And Transformation", "Program Pembinaan Profesi Insinyur (P3I)", "2025 - Prompt Engineering with ChatGPT", "2025 - Advanced Prompt Engineering Techniques"],
  "10000061": ["Placement Test Bahasa Inggris", "Auditor Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3)", "Safety Outbound", "How To Create Stunning and Insightful Presentation Skill"],
  "10000071": ["Mining Economic", "Placement Test Bahasa Inggris", "2024 - Refreshment Coaching Skill for The Leader", "2024 - Diskusi Bidang Environtmental Sosial dan Governance"],
  "11000305": ["Lean Six Sigma for Leader - batch 1", "English Culture Program", "2025 - AI Catalyst Workshop", "2024 - Coaltrans Asia 2024"],
  "11000308": ["Lean Six Sigma for Leader - batch 3", "Implementasi Sistem Manajemen Keselamatan Pertambangan (SMKP)", "Safety Outbound", "Risk Factor In Merger & Acquisition"],
  "11000310": ["2025 - Generative AI: Prompt Engineering Basics", "Maritime Cyber Security", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000317": ["2024 - Mining Financial Modelling", "Implementasi Sistem Manajemen Keselamatan Pertambangan (SMKP)", "2025 - AI Catalyst Workshop", "2024 - Coaltrans Asia 2024"],
  "11000354": ["2025 - SIG Modul Dasar - Quantum GIS", "Lean Six Sigma for Leader - batch 3", "2025 - AI Catalyst Workshop", "2024 - English Workshop - Speak english Confidently and Properly"],
  "11000358": ["Placement Test Bahasa Inggris", "Diklat & Uji Kompetensi Pengawas Operasional Madya (POM)", "2024 - Diskusi Bidang Environtmental Sosial dan Governance", "Safety Outbound"],
  "11000372": ["Lean Six Sigma for Leader - batch 3", "Diklat & Uji Kompetensi Pengawas Operasional Utama (POU)", "2024 - Refreshment Coaching Skill for The Leader", "Kelompok Materi Pelatihan Dasar (KMPD)"],
  "11000401": ["Lean Six Sigma for Leader - batch 3", "Diklat & Uji Kompetensi Pengawas Operasional Pertama (POP)", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000407": ["Lean Six Sigma for Leader - batch 3", "Implementasi Sistem Manajemen Keselamatan Pertambangan (SMKP)", "2024 - Coaltrans Asia 2024", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000414": ["2025 - Fundamental Estimasi Sumberdaya", "Lean Six Sigma for Leader - batch 3", "2024 - Refreshment Coaching Skill for The Leader", "2024 - Diskusi Bidang Environtmental Sosial dan Governance"],
  "11000415": ["2024 - Agile Meets Design Thinking", "2024 - Corporate Financial Decision - Making for Value Creation", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000425": ["2024 - Managerial Management Development Program - Batch 10", "Ahli Keselamatan dan Kesehatan Kerja (K3) Umum", "2024 - Refreshment Coaching Skill for The Leader", "Safety Outbound"],
  "11000429": ["2026 - AI Prompt Engineering Fundamentals (PL419: AI Prompt Crafting)", "Lean Six Sigma for Leader - batch 3", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000464": ["Workshop and Warehouse Management", "Lean Six Sigma for Leader - batch 1", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000543": ["2025 - Agile Leadership Capstone", "2025 - Developing an Agile Team", "2025 - AI Catalyst Workshop", "2025 - The Capabilities of GenAI and Use Cases in the Real World"],
  "11000624": ["English Culture Program", "Sertifikasi Asesor Kompetensi", "2025 - AI Catalyst Workshop", "Safety Outbound"],
  "11000661": ["Lean Six Sigma for Leader - batch 3", "English Culture Program", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000769": ["Workshop and Warehouse Management", "Lean Six Sigma for Leader - batch 3", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000921": ["2025 - Leader as Coach", "2024 - Project Management: The Basics for Success", "2025 - AI Catalyst Workshop", "2025 - Turn Alive Your Virtual Presentation Skill"],
  "11000939": ["2024 - Fundamental of Statistic", "Project Management", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11000987": ["Lean Six Sigma for Leader - batch 3", "Workshop and Warehouse Management", "2025 - AI Catalyst Workshop", "2025 - Strategic Thinking"],
  "11001254": ["Speak to Change For Professional Trainer", "Lean Six Sigma for Leader - batch 2", "2025 - AI Catalyst Workshop", "2024 - Coaltrans Asia 2024"],
  "11001325": ["Lean Six Sigma for Leader - batch 2", "Workshop and Warehouse Management", "2025 - AI Catalyst Workshop", "2024 - Refreshment Coaching Skill for The Leader"],
  "11001519": ["Lean Six Sigma for Leader - batch 2", "2023 - Sistem Manajemen Keselamatan Pertambangan (SMKP)", "2025 - AI Catalyst Workshop", "2024 - English Workshop - Speak english Confidently and Properly"],
};

function formatDatedText(value: string | number | null | undefined, fallback = "Belum tersedia dari SAP") {
  if (value === null || value === undefined || value === "") return fallback;
  const str = String(value).trim();
  return str
    .replace(/(?<=[^\n])\s+(?=\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b)/g, "\n")
    .replace(/(?<=[^\n])\s+(?=\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b)/g, "\n")
    .replace(/(?<=[^\n])\s+(?=\b\d{4}\s*-\s*(?:\d{4}|Present|Sekarang)\b)/gi, "\n");
}

function show(value: string | number | null | undefined, fallback = "Belum tersedia dari SAP") {
  if (value === null || value === undefined || value === "") return fallback;
  return formatDatedText(value, fallback);
}

function showList(value: string[] | undefined, fallback = "Belum tersedia dari SAP") {
  if (!value?.length) return fallback;
  return value.map((item) => formatDatedText(item, fallback)).join("\n");
}

function normalizeSkillKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findIdealLevel(competencyName: string, targetMap: Map<string, number>): number | null {
  const key = normalizeSkillKey(competencyName);
  if (targetMap.has(key)) return targetMap.get(key)!;

  // Partial match: e.g. "perencanaantambangbatubara" contains / is contained
  for (const [targetKey, level] of targetMap.entries()) {
    if (targetKey.includes(key) || key.includes(targetKey)) {
      return level;
    }
  }

  // Token-based matching: at least 2 significant words match
  const words = competencyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (words.length >= 2) {
    for (const [targetKey, level] of targetMap.entries()) {
      const matchWords = words.filter((w) => targetKey.includes(w));
      if (matchWords.length >= 2) {
        return level;
      }
    }
  }

  return null;
}

function getSoftCompetencyIdealLevel(
  competencyName: string,
  positionName?: string | null,
  jobLevel?: string | null
): number {
  const normTitle = (positionName || "").toLowerCase();
  const normLevel = (jobLevel || "").toLowerCase();

  const isExecutive =
    /general manager|gm\b|division head|director|direktur|vp\b|vice president/i.test(normTitle) ||
    /executive|division head/i.test(normLevel);
  const isManager =
    /manager\b|dept head|department head|section head/i.test(normTitle) ||
    /manager/i.test(normLevel);
  const isSuperintendent =
    /superintendent|senior specialist|sr\. specialist|sr specialist|principal/i.test(normTitle) ||
    /superintendent/i.test(normLevel);
  const isSupervisor =
    /supervisor|specialist|senior engineer|sr\. engineer/i.test(normTitle) ||
    /supervisor/i.test(normLevel);
  const isOfficerOrStaff =
    /officer|foreman|engineer|staff/i.test(normTitle) ||
    /officer|staff/i.test(normLevel);

  const cleanName = competencyName.toLowerCase().trim();

  if (isExecutive) {
    if (cleanName.includes("leading") || cleanName.includes("business") || cleanName.includes("problem")) return 5;
    return 4;
  }
  if (isManager) {
    if (cleanName.includes("business") || cleanName.includes("leading") || cleanName.includes("achieving")) return 4;
    return 4;
  }
  if (isSuperintendent) {
    if (cleanName.includes("leading") || cleanName.includes("achieving") || cleanName.includes("trust")) return 4;
    return 3;
  }
  if (isSupervisor) {
    if (cleanName.includes("achieving") || cleanName.includes("problem") || cleanName.includes("team")) return 3;
    return 3;
  }
  if (isOfficerOrStaff) {
    if (cleanName.includes("trust") || cleanName.includes("team")) return 2;
    return 2;
  }

  return 3;
}

function CompetencyItemRow({
  item,
  isSoft,
  idealLevel,
}: {
  item: CompetencyScaleItem;
  isSoft: boolean;
  idealLevel?: number | null;
}) {
  const currentLevel = item.profId;
  const hasTarget = typeof idealLevel === "number" && idealLevel > 0;
  const gap = hasTarget ? currentLevel - idealLevel : null;
  const isMeetOrExceed = gap !== null && gap >= 0;

  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {!isSoft && item.groupName && item.groupName !== "Technical Competency" && (
            <span className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
              {item.groupName}
            </span>
          )}
          <p className="text-xs font-bold text-slate-900 leading-snug">
            {item.name}
          </p>
        </div>

        {/* Badges: Level Aktual & Target Ideal Posisi */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none ${levelBadgeClass(
              currentLevel
            )}`}
            title={`Level Aktual Karyawan: Level ${currentLevel}`}
          >
            Level {currentLevel}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold leading-none ${
              hasTarget
                ? isMeetOrExceed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
            title={
              hasTarget
                ? `Standar Ideal Posisi: Level ${idealLevel} (${
                    gap === 0
                      ? "Memenuhi Standar"
                      : gap! > 0
                      ? `Melebihi Standar (+${gap})`
                      : `Gap ${gap}`
                  })`
                : "Standar ideal belum diatur di matriks posisi"
            }
          >
            Ideal: {hasTarget ? `L${idealLevel}` : "-"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
        <div
          className="flex items-center gap-1.5 shrink-0"
          title={`Aktual: Level ${currentLevel} dari 5${hasTarget ? ` • Ideal Posisi: Level ${idealLevel}` : ""}`}
        >
          {[1, 2, 3, 4, 5].map((step) => {
            const isFilled = step <= currentLevel;
            const isTarget = hasTarget && step === idealLevel;
            return (
              <span
                key={step}
                className={`relative h-1.5 w-3.5 rounded-full transition-colors ${
                  isFilled ? levelPipColor(currentLevel) : "bg-slate-200"
                }`}
              >
                {isTarget && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-slate-700 ring-1 ring-white"
                    title={`Ideal: Level ${idealLevel}`}
                  />
                )}
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-[10px] font-medium text-slate-600 truncate text-right">
            {item.profDesc}
          </span>
          {hasTarget && gap !== null && (
            <span
              className={`shrink-0 text-[9.5px] font-bold ${
                isMeetOrExceed ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {gap === 0 ? "• Sesuai" : gap > 0 ? `• +${gap}` : `• Gap ${gap}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function levelBadgeClass(level: number) {
  switch (level) {
    case 5:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case 4:
      return "bg-purple-50 text-purple-700 border-purple-200";
    case 3:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 2:
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case 1:
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function levelPipColor(level: number) {
  switch (level) {
    case 5:
      return "bg-amber-500";
    case 4:
      return "bg-purple-500";
    case 3:
      return "bg-emerald-500";
    case 2:
      return "bg-cyan-500";
    case 1:
      return "bg-sky-500";
    default:
      return "bg-slate-300";
  }
}

function formatPerformanceScale(value: string | number | null | undefined) {
  if (typeof value === "string") return show(value);
  if (typeof value !== "number") return "Belum tersedia dari SAP";
  if (value >= 96) return "A+";
  if (value >= 92) return "A";
  if (value >= 86) return "B+";
  if (value >= 80) return "B";
  return String(value);
}

function formatPercentage(value: number | undefined) {
  if (value === undefined) return "Belum diisi";
  return `${value <= 1 ? Math.round(value * 100) : Math.round(value)}%`;
}

function ReviewBox({ title, strength, weakness }: { title: string; strength: string; weakness: string }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <p className="text-xs font-bold text-slate-800">Evaluasi 360 (Tahun {title})</p>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
          SAP 360
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Strength :
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-800">{strength}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Weakness :
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-800">{weakness}</p>
        </div>
      </div>
    </div>
  );
}

function parseCareerItem(raw: string): { title: string; period?: string } {
  const clean = raw.trim().replace(/^[-•*]\s*/, "");
  if (!clean) return { title: clean };

  let left = clean;
  let company = "";
  if (clean.includes("|")) {
    const parts = clean.split("|").map((p) => p.trim());
    left = parts[0] ?? clean;
    company = parts[1] ?? "";
  }

  const periodMatch = left.match(
    /^((?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{4}\s*[-–]\s*(?:\d{4}|present|sekarang)|\d{4}))\s*[-–]?\s*(.*)$/i
  );

  let period = "";
  let role = left;

  if (periodMatch) {
    period = periodMatch[1].trim();
    const sameYearMatch = period.match(/^(\d{4})\s*[-–]\s*\1$/);
    if (sameYearMatch) {
      period = sameYearMatch[1];
    } else if (/^\d{4}\s*[-–]\s*(?:\d{4}|present|sekarang)$/i.test(period)) {
      period = period.replace(/\s*[-–]\s*/, " - ");
    }
    role = periodMatch[2].trim() || left;
  }

  const title = company ? `${role} - ${company}` : role;
  return { title: title || clean, period: period || undefined };
}

function parseCertificationItem(raw: string): { title: string; subtitle?: string } {
  const clean = raw.trim().replace(/^[-•*]\s*/, "");
  if (!clean) return { title: clean };

  if (clean.includes("|")) {
    const parts = clean.split("|").map((p) => p.trim()).filter((p) => Boolean(p) && p !== "-");
    const title = parts[0] ?? clean;
    const details = parts.slice(1);
    return {
      title,
      subtitle: details.length > 0 ? details.join(" • ") : undefined,
    };
  }

  if (clean.includes("\n")) {
    const lines = clean.split("\n").map((l) => l.trim().replace(/^[-•*]\s*/, "")).filter(Boolean);
    const title = lines[0] ?? clean;
    const details = lines.slice(1);
    return {
      title,
      subtitle: details.length > 0 ? details.join(" • ") : undefined,
    };
  }

  return { title: clean };
}

function parseProjectItem(raw: string): { title: string; date?: string } {
  const clean = raw.trim().replace(/^[\s\-–—•*]+\s*/, "");
  if (!clean) return { title: clean };

  const match = clean.match(
    /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4})\s*[-:–]\s*(.+)$/
  );
  if (match) {
    return {
      date: match[1].trim(),
      title: match[2].trim().replace(/^[\s\-–—•*]+\s*/, ""),
    };
  }

  return { title: clean };
}

function parseAspirationEntries(
  rawAspiration: string | null | undefined,
  maxEntries = 3
): Array<{ dateStr?: string; content: string }> {
  if (!rawAspiration || typeof rawAspiration !== "string") return [];

  // Normalize newlines before any date pattern like 2026-07-29 or 2023.04.14
  const normalized = rawAspiration
    .replace(/(?<=[^\n])\s+(?=\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s*[-:–])/g, "\n")
    .replace(/(?<=[^\n])\s+(?=\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\s*[-:–])/g, "\n");

  const lines = normalized
    .split("\n")
    .map((l) => l.trim().replace(/^[\s\-–—•*]+\s*/, ""))
    .filter(Boolean);

  const entries: Array<{ dateStr?: string; date: number; content: string }> = [];
  let current: { dateStr?: string; date: number; content: string } | null = null;

  for (const line of lines) {
    const match = line.match(/^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\s*[-:–]\s*(.+)$/);
    if (match) {
      if (current) entries.push(current);
      const parsedTime = Date.parse(match[1].replace(/\./g, "-"));
      current = {
        dateStr: match[1],
        date: isNaN(parsedTime) ? 0 : parsedTime,
        content: match[2].trim().replace(/^[\s\-–—•*]+\s*/, ""),
      };
    } else if (current) {
      current.content += " " + line.replace(/^[\s\-–—•*]+\s*/, "");
    } else {
      current = {
        dateStr: undefined,
        date: 0,
        content: line.replace(/^[\s\-–—•*]+\s*/, ""),
      };
    }
  }
  if (current) entries.push(current);

  // Deduplicate identical content
  const unique: typeof entries = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const cleanContent = entry.content.replace(/^[\s\-–—•*]+\s*/, "").trim();
    if (!cleanContent) continue;
    const key = `${entry.dateStr ?? ""}::${cleanContent.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ ...entry, content: cleanContent });
    }
  }

  // Sort descending by date (newest first)
  unique.sort((a, b) => b.date - a.date);

  return unique.slice(0, maxEntries).map((e) => ({
    dateStr: e.dateStr,
    content: e.content.replace(/^[\s\-–—•*]+\s*/, "").trim(),
  }));
}

function fastTrackProgram(talent: TalentTrack, currentYear: number) {
  const filtered = filterItemsLast3Years(talent.xdpHistory, currentYear);
  return filtered.length ? filtered.join(" - ") : "-";
}

function isWithinLastNYears(text: string, currentYear: number, nYears = 3): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed || trimmed === "-") return false;

  // Entries indicating active or current statuses are relevant in current period
  if (/(present|sekarang|aktif|current)/i.test(trimmed)) {
    return true;
  }

  // Extract all 4-digit years between 1900 and 2099
  const years = Array.from(trimmed.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) =>
    parseInt(m[1], 10)
  );

  if (years.length === 0) {
    // If no year is explicitly mentioned in the text, preserve the record
    return true;
  }

  const minYear = currentYear - (nYears - 1);
  const maxYear = Math.max(...years);

  return maxYear >= minYear;
}

function filterItemsLast3Years(items: string[] | undefined, currentYear: number): string[] {
  if (!items?.length) return [];
  return items.filter((item) => isWithinLastNYears(item, currentYear, 3));
}

function certificationListFor(talent: TalentTrack) {
  return uniqueCleanList(talent.certifications);
}

function uniqueCleanList(value: string[] | undefined) {
  const seen = new Set<string>();
  return (value ?? [])
    .map((item) => item.trim().replace(/^-\s*/, ""))
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function getStrengths(talent: TalentTrack) {
  return [...(talent.technical ?? []).slice(0, 2), ...(talent.behavioral ?? []).slice(0, 1)].filter(Boolean);
}

function getWeaknesses(position: string, talent: TalentTrack) {
  if (/mine|pit|production|planning/i.test(position)) return ["Cost control", "Stakeholder alignment"];
  if (/hse|safety/i.test(position)) return ["Emergency leadership", "Data-driven trend analysis"];
  if (/finance|cost|budget/i.test(position)) return ["Influencing operation leaders", "Scenario modelling"];
  return ["Cross-functional influence", "Advanced data analysis"];
}

function Panel({
  title,
  children,
  tone = "default",
  source,
  period,
  className,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "soft";
  source?: string;
  period?: string;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col ${className ?? ""}`.trim()}>
      <div className={tone === "soft" ? "flex items-center justify-between gap-3 bg-[#dfe9d7] px-4 py-2.5" : "flex items-center justify-between gap-3 bg-[#d5e2cb] px-4 py-2.5"}>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold text-slate-950">{title}</h3>
          {period ? (
            <span className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/75 px-2 py-0.5 text-[9.5px] font-semibold text-slate-700">
              {period}
            </span>
          ) : null}
        </div>
        {source ? (
          <span className="shrink-0 rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {source}
          </span>
        ) : null}
      </div>
      <div className="flex-1 space-y-3 p-3.5 flex flex-col">{children}</div>
    </section>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SourceSummary({
  source,
  status,
  detail,
  tone = "planned",
}: {
  source: string;
  status: string;
  detail: string;
  tone?: "ready" | "planned";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">{source}</p>
        <span className={tone === "ready" ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700" : "rounded-full bg-amber-100 px-2 py-0.5 text-[9.5px] font-bold text-amber-700"}>
          {status}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SourceField({
  label,
  value = "Menunggu sinkronisasi SAP",
  source = "SAP",
  className,
}: {
  label: string;
  value?: string;
  source?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col justify-between ${className ?? ""}`.trim()}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold leading-4 text-slate-600">{label}</p>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
          {source}
        </span>
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-900 flex-1">{value}</p>
    </div>
  );
}

function DataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-0.5 break-words font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SectionText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#0969c2]">{label} :</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
      <span className="font-semibold text-[#0969c2]">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

type StoredCurrentGapInsight = {
  readinessCategory: string;
  readinessLabel: string;
  readinessTone: "ready" | "development" | "not_ready";
  summary: string;
  strengths: string[];
  prioritySkillGaps: Array<{
    skillName: string;
    gap?: number;
    evidenceSummary?: string;
  }>;
  developmentRecommendations: Array<{
    title: string;
    description?: string;
  }>;
  idpPlan: {
    seventy: string[];
    twenty: string[];
    ten: string[];
  };
  notes: string[];
};

function formatCurrentGapInsight(
  value: unknown,
  odSkillGap?: OdTalentMatchRow | null,
  competencyProfile?: EmployeeCompetencyProfile | null,
  targetLevelsMap?: Map<string, number> | null
): StoredCurrentGapInsight | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (typeof result.summary !== "string") return null;

  const rawReadiness = typeof result.readinessCategory === "string" ? result.readinessCategory : "";
  let readinessTone: "ready" | "development" | "not_ready" = "development";
  let readinessLabel = "Ready with Development";

  if (/READY_NOW/i.test(rawReadiness)) {
    readinessTone = "ready";
    readinessLabel = "Ready Now";
  } else if (/NOT_READY/i.test(rawReadiness)) {
    readinessTone = "not_ready";
    readinessLabel = "Not Ready";
  } else if (/DEVELOPMENT/i.test(rawReadiness)) {
    readinessTone = "development";
    readinessLabel = "Ready with Development";
  } else if (rawReadiness) {
    readinessLabel = rawReadiness.replace(/_/g, " ");
  } else {
    readinessLabel = "Belum diisi";
  }

  const idp = result.idpPlan && typeof result.idpPlan === "object" && !Array.isArray(result.idpPlan)
    ? (result.idpPlan as Record<string, unknown>)
    : {};

  const toCleanArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0 && item !== "Belum tersedia dari SAP");
  };

  let prioritySkillGaps = Array.isArray(result.prioritySkillGaps)
    ? result.prioritySkillGaps.map((item) => {
        if (!item || typeof item !== "object") return { skillName: String(item) };
        const gap = item as Record<string, unknown>;
        return {
          skillName: String(gap.skillName ?? "Skill"),
          gap: typeof gap.gap === "number" ? gap.gap : undefined,
          evidenceSummary: gap.evidenceSummary ? String(gap.evidenceSummary) : undefined,
        };
      })
    : [];

  if (prioritySkillGaps.length === 0 && odSkillGap?.competencyGaps?.length) {
    prioritySkillGaps = odSkillGap.competencyGaps
      .filter((g) => g.gap > 0)
      .slice(0, 5)
      .map((g) => ({
        skillName: g.competencyName,
        gap: g.gap,
        evidenceSummary: `Target: Level ${g.requiredLevel} • Aktual: Level ${g.currentLevel}`,
      }));
  }

  if (prioritySkillGaps.length === 0 && competencyProfile) {
    const allComp = [...competencyProfile.softCompetencies, ...competencyProfile.technicalCompetencies];
    const fallbackGaps = [];
    for (const c of allComp) {
      const req = targetLevelsMap?.get(normalizeSkillKey(c.name)) ?? (c.profId >= 3 ? c.profId : 3);
      const diff = req - c.profId;
      if (diff > 0) {
        fallbackGaps.push({
          skillName: c.name,
          gap: diff,
          evidenceSummary: `Target: Level ${req} • Aktual: Level ${c.profId}`,
        });
      }
    }
    fallbackGaps.sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
    prioritySkillGaps = fallbackGaps.slice(0, 5);
  }

  let developmentRecommendations = Array.isArray(result.developmentRecommendations)
    ? result.developmentRecommendations.map((item) => {
        if (!item || typeof item !== "object") return { title: String(item) };
        const rec = item as Record<string, unknown>;
        return {
          title: String(rec.title ?? "Rekomendasi"),
          description: rec.description ? String(rec.description) : undefined,
        };
      })
    : [];

  if (developmentRecommendations.length === 0 && prioritySkillGaps.length > 0) {
    developmentRecommendations = prioritySkillGaps.slice(0, 3).map((g) => ({
      title: `Peningkatan Kompetensi ${g.skillName}`,
      description: `Peningkatan menuju standar posisi melalui on-the-job assignment dan mentoring.`,
    }));
  }

  const idpSeventy = toCleanArray(idp.seventy);
  const idpTwenty = toCleanArray(idp.twenty);
  const idpTen = toCleanArray(idp.ten);

  if (idpSeventy.length === 0 && prioritySkillGaps.length > 0) {
    idpSeventy.push(...prioritySkillGaps.slice(0, 2).map((g) => `Penugasan proyek / OJT terarah terkait ${g.skillName}.`));
  }
  if (idpTwenty.length === 0 && prioritySkillGaps.length > 0) {
    idpTwenty.push(...prioritySkillGaps.slice(0, 1).map((g) => `Coaching rutin bulanan dengan atasan teknis untuk evaluasi ${g.skillName}.`));
  }
  if (idpTen.length === 0 && prioritySkillGaps.length > 0) {
    idpTen.push(...prioritySkillGaps.slice(0, 1).map((g) => `Training atau sertifikasi pemenuhan kompetensi ${g.skillName}.`));
  }

  const notes = [
    ...toCleanArray(result.risks),
    ...toCleanArray(result.missingInformation),
    ...toCleanArray(result.limitations),
  ];

  return {
    readinessCategory: rawReadiness || "Belum diisi",
    readinessLabel,
    readinessTone,
    summary: result.summary,
    strengths: toCleanArray(result.strengths),
    prioritySkillGaps,
    developmentRecommendations,
    idpPlan: {
      seventy: idpSeventy,
      twenty: idpTwenty,
      ten: idpTen,
    },
    notes,
  };
}
