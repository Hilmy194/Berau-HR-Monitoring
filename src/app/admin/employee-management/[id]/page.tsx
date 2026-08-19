import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getProfileDetail } from "@/lib/services/employee.service";
import { listEmployeeMaster } from "@/lib/services/hr-modules.service";
import { getLatestTalentAiAnalysisForEmployee } from "@/lib/services/talent-ai.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/utils";
import type { TalentTrack } from "@/lib/services/talent-development.service";

export const metadata = { title: "Talent Card - Harmoni" };

export default async function EmployeeTalentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [profile, employees, storedCurrentGap] = await Promise.all([
    getProfileDetail(id),
    listEmployeeMaster(),
    getLatestTalentAiAnalysisForEmployee({ analysisType: "SKILL_GAP", employeeId: id }),
  ]);

  if (!profile) notFound();
  const employee = employees.find((item) => item.profileId === profile.id);
  const talent = toTalentTrack(profile.talentData);
  const currentPositionDuration = talent.currentPositionDuration ?? employee?.currentPositionDuration ?? CURRENT_POSITION_DURATION_BY_NIK[profile.nik ?? ""];
  const education = talent.education ?? EDUCATION_BY_NIK[profile.nik ?? ""];
  const projectScope = talent.projectScope ?? talent.projects?.[2] ?? PROJECT_SCOPE_BY_NIK[profile.nik ?? ""];
  const certificationItems = certificationListFor(profile.nik, talent);
  const strengths = getStrengths(talent);
  const weaknesses = getWeaknesses(profile.position ?? "", talent);
  const currentGapInsight = formatCurrentGapInsight(storedCurrentGap?.result);

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

          <div className="mt-6 grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Panel title="Profil Karyawan" tone="soft">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Avatar className="h-40 w-32 rounded-xl border border-slate-200 bg-slate-50">
                    {profile.photoUrl && <AvatarImage src={profile.photoUrl} alt={profile.user.name} className="object-cover" />}
                    <AvatarFallback className="rounded-xl bg-primary/15 text-3xl font-semibold text-primary">
                      {getInitials(profile.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Talent Profile</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">{profile.user.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{profile.user.email}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
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

              <Panel title="Performance & Job Profile" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Performance Scale - Year 2025" value={formatPerformanceScale(talent.performance?.[0])} />
                  <SourceField label="Performance Scale - Year 2024" value={formatPerformanceScale(talent.performance?.[1])} />
                  <SourceField label="Performance Scale - Year 2023" value={formatPerformanceScale(talent.performance?.[2])} />
                  <SourceField label="Education" value={show(education)} />
                  <SourceField label="Career Aspiration" value={show(talent.aspiration)} />
                  <SourceField label="Fast Track" value={fastTrackProgram(talent)} />
                  <SourceField className="sm:col-span-2" label="Comment during PAT" value={show(talent.patComment ?? talent.supervisorNotes, "Belum diisi")} source="PAT" />
                </div>
              </Panel>

              <Panel title="Career & Experience" source="SAP">
                <div className="grid gap-4">
                  <SourceField label="Career History" value={showList(talent.careerHistory)} />
                </div>
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="Project Assignment" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Project Involvement" value={show(talent.projects?.[0])} />
                  <SourceField label="Project Impact A" value={show(talent.projectImpact)} />
                  <SourceField className="sm:col-span-2" label="Project Scope" value={show(projectScope)} />
                </div>
              </Panel>

              <Panel title="Current Role">
                <SectionText label="Job Desc" value={show(talent.jobDescription, "Belum diisi")} />
              </Panel>

              <Panel title="Capability & Readiness" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Soft Competencies Scale" value={showList(talent.behavioral)} />
                  <SourceField label="Technical Competency Scale" value={showList(talent.technical)} />
                  <SourceField label="BU Visibility Scale" value="Talent" />
                </div>
              </Panel>

              <Panel title="Talent Classification" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Talent Class" value={employee?.talentClass ?? (talent.potential && talent.potential >= 88 ? "High Potential" : talent.potential ? "Core Talent" : "Belum tersedia dari SAP")} />
                </div>
              </Panel>

            </div>

            <div className="space-y-4">
              <Panel title="HSE-CT" source="HSE / Medical">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="MCU" value={talent.hse?.mcu ?? "Belum diisi"} source="HSE" />
                  <SourceField label="Simper / SID" value={talent.hse?.simper ?? "Belum diisi"} source="HSE" />
                  <SourceField className="sm:col-span-2" label="HSE CT Summary (Last 3 Years)" value={talent.hse?.summary ?? (talent.hse?.incidentFreeMonths ? `MCU ${talent.hse.mcu ?? "Belum diisi"}, Simper/SID ${talent.hse.simper ?? "Belum diisi"}, ${talent.hse.incidentFreeMonths} bulan tanpa incident tercatat.` : "Belum diisi")} source="HSE" />
                </div>
              </Panel>

              <Panel title="Assessment" source="Assessment Center">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="IQ" value={show(talent.assessment?.iq, "Belum diisi")} source="Assessment" />
                  <SourceField label="EQ" value={show(talent.assessment?.eq, "Belum diisi")} source="Assessment" />
                  <SourceField className="sm:col-span-2" label="Leadership" value={formatPercentage(talent.assessment?.leadership)} source="Assessment" />
                </div>
              </Panel>

              <Panel title="Certification">
                <SectionText label="List Certification" value={showList(certificationItems, "Belum diisi")} />
              </Panel>

              <Panel title="Strength & Weakness">
                <ReviewBox
                  title="Entomo"
                  strength={showList(talent.strength, "Belum diisi")}
                  weakness={showList(talent.weakness, "Belum diisi")}
                />
                <ReviewBox
                  title="People Review"
                  strength={showList(strengths, "Belum diisi")}
                  weakness={showList(weaknesses, "Belum diisi")}
                />
              </Panel>

              <Panel title="Attachments">
                <div className="space-y-3 text-sm">
                  <DataRow icon={FileText} label="CV / Resume" value={profile.cvUrl ? "Tersedia" : "Belum diisi"} />
                  <SectionText label="Catatan HR" value="Belum diisi" />
                </div>
              </Panel>
            </div>

            <div className="xl:col-span-3">
              <Panel title="AI Insight from Current Gap">
                {currentGapInsight ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SectionText label="Readiness Category" value={currentGapInsight.readinessCategory} />
                    <SectionText label="Overall Assessment" value={currentGapInsight.summary} />
                    <SectionText label="Key Strengths" value={currentGapInsight.strengths} />
                    <SectionText label="Skill Gap" value={currentGapInsight.skillGaps} />
                    <SectionText label="Recommended Development" value={currentGapInsight.recommendations} />
                    <SectionText label="IDP 70-20-10" value={currentGapInsight.idpPlan} />
                    <SectionText label="Career Risk / Notes" value={currentGapInsight.notes} />
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

function show(value: string | number | null | undefined, fallback = "Belum tersedia dari SAP") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function showList(value: string[] | undefined, fallback = "Belum tersedia dari SAP") {
  return value?.length ? value.join(" - ") : fallback;
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
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">{title}</p>
      <SectionText label="Strength" value={strength} />
      <SectionText label="Weakness" value={weakness} />
    </div>
  );
}

function fastTrackProgram(talent: TalentTrack) {
  const programs = talent.developmentPrograms?.filter((program) => /dp|gdp|ecdp|cdp|fast/i.test(program)) ?? [];
  return programs.length ? programs.join(" - ") : "-";
}

function certificationListFor(nik: string | null, talent: TalentTrack) {
  const source = nik ? CERTIFICATION_TRAINING_BY_NIK[nik] : undefined;
  return uniqueCleanList(source ?? talent.certifications);
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
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "soft";
  source?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className={tone === "soft" ? "flex items-center justify-between gap-3 bg-[#dfe9d7] px-5 py-4" : "flex items-center justify-between gap-3 bg-[#d5e2cb] px-5 py-4"}>
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {source ? (
          <span className="shrink-0 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            {source}
          </span>
        ) : null}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">{source}</p>
        <span className={tone === "ready" ? "rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700" : "rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700"}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
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
    <div className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-4 ${className ?? ""}`.trim()}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-5 text-slate-600">{label}</p>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          {source}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
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
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-1 break-words font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SectionText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-[#0969c2]">{label} :</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800">{value}</p>
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
  summary: string;
  strengths: string;
  skillGaps: string;
  recommendations: string;
  idpPlan: string;
  notes: string;
};

function formatCurrentGapInsight(value: unknown): StoredCurrentGapInsight | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (typeof result.summary !== "string") return null;
  const idp = result.idpPlan && typeof result.idpPlan === "object" && !Array.isArray(result.idpPlan)
    ? result.idpPlan as Record<string, unknown>
    : {};
  const notes = [
    stringList(result.risks),
    stringList(result.missingInformation),
    stringList(result.limitations),
  ].filter((item) => item !== "Belum tersedia dari SAP");

  return {
    readinessCategory: show(typeof result.readinessCategory === "string" ? result.readinessCategory : undefined, "Belum diisi"),
    summary: result.summary,
    strengths: stringList(result.strengths),
    skillGaps: gapList(result.prioritySkillGaps),
    recommendations: recommendationList(result.developmentRecommendations),
    idpPlan: [
      `70: ${stringList(idp.seventy)}`,
      `20: ${stringList(idp.twenty)}`,
      `10: ${stringList(idp.ten)}`,
    ].join("\n"),
    notes: notes.length ? notes.join("\n") : "Belum tersedia dari AI",
  };
}

function stringList(value: unknown, fallback = "Belum tersedia dari SAP") {
  return Array.isArray(value) && value.length ? value.map((item) => String(item)).join("\n") : fallback;
}

function gapList(value: unknown) {
  if (!Array.isArray(value) || !value.length) return "Belum tersedia dari SAP";
  return value.map((item) => {
    if (!item || typeof item !== "object") return String(item);
    const gap = item as Record<string, unknown>;
    const name = String(gap.skillName ?? "Skill");
    const gapValue = gap.gap === undefined ? "" : ` gap ${gap.gap}`;
    const evidence = gap.evidenceSummary ? ` - ${gap.evidenceSummary}` : "";
    return `${name}${gapValue}${evidence}`;
  }).join("\n");
}

function recommendationList(value: unknown) {
  if (!Array.isArray(value) || !value.length) return "Belum tersedia dari SAP";
  return value.map((item) => {
    if (!item || typeof item !== "object") return String(item);
    const recommendation = item as Record<string, unknown>;
    const title = String(recommendation.title ?? "Recommendation");
    const description = recommendation.description ? ` - ${recommendation.description}` : "";
    return `${title}${description}`;
  }).join("\n");
}
