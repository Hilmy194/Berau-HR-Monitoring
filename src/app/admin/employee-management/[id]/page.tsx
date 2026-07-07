import Image from "next/image";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/utils";
import type { TalentTrack } from "@/lib/services/talent-development.service";

export const metadata = { title: "Talent Card - Berau Coal" };

export default async function EmployeeTalentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const profile = await getProfileDetail(id);

  if (!profile) notFound();
  const talent = toTalentTrack(profile.talentData);
  const aiInsight = getCurrentPositionInsight(profile.position ?? "Current Position", talent);

  return (
    <div className="space-y-5 pb-8 text-slate-950">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="gap-2 rounded-full bg-white">
              <Link href="/admin/employee-management">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Talent Directory
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white px-4 py-3 shadow-sm">
            <Image src="/BERAU-LOGO.png" alt="Berau Coal" width={122} height={34} className="h-8 w-auto object-contain" />
            <Image src="/MTL-LOGO.png" alt="TechConnect" width={122} height={34} className="h-8 w-auto object-contain" />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:p-8">
          <div className="border-b-2 border-red-500/80 pb-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Promotion Eligibility</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Talent / Employee Card - BERAU COAL
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                  Satu tampilan konsolidasi profil karyawan, data talent SAP, assessment, dan aktivitas pengembangan.
                  Field yang belum tersinkron tetap ditandai agar HR dapat membedakan data aktual dan placeholder.
                </p>
              </div>

              <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-2">
                <InfoChip label="Nama" value={profile.user.name} />
                <InfoChip label="NIK" value={profile.nik ?? "Belum diisi"} />
                <InfoChip label="Posisi Saat Ini" value={profile.position ?? "Belum diisi"} />
                <InfoChip label="Departemen" value={profile.department ?? "Belum diisi"} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2 xl:grid-cols-4">
            <SourceSummary source="Employee Master" status="Tersedia" detail="Identitas dan data employment" tone="ready" />
            <SourceSummary source="SAP Talent" status={profile.talentData ? "Data tersedia" : "Menunggu sync"} detail="Performance, career, project, dan klasifikasi talent" tone={profile.talentData ? "ready" : "planned"} />
            <SourceSummary source="Assessment" status={talent.assessment ? "Data tersedia" : "Direncanakan"} detail="Asesmen potensi, EQ, IQ, dan leadership" tone={talent.assessment ? "ready" : "planned"} />
            <SourceSummary source="Learning / IDP" status="Direncanakan" detail="Pelatihan, mentoring, dan progress development plan" />
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
                  <SourceField label="Performance Scale - Year -1" value={show(talent.performance?.[0])} />
                  <SourceField label="Performance Scale - Year -2" value={show(talent.performance?.[1])} />
                  <SourceField label="Performance Scale - Year -3" value={show(talent.performance?.[2])} />
                  <SourceField label="Job Level" value={show(talent.jobLevel)} />
                  <SourceField label="Education Scale" />
                  <SourceField label="List Certification" value={showList(talent.certifications)} />
                  <SourceField label="Roles / Job Description" value={showList(talent.technical)} />
                  <SourceField label="Career Aspiration" value={show(talent.aspiration)} />
                  <SourceField className="sm:col-span-2" label="Current Position Duration" />
                </div>
              </Panel>

              <Panel title="Career & Experience" source="SAP">
                <div className="grid gap-4">
                  <SourceField label="Career History" value={showList(talent.careerHistory)} />
                  <SourceField label="Business Size" value={profile.department ?? "Belum tersedia dari SAP"} />
                </div>
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="Project Assignment" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Project Involvement" value={showList(talent.projects)} />
                  <SourceField label="Project Impact A" />
                  <SourceField className="sm:col-span-2" label="Project Scope" />
                </div>
              </Panel>

              <Panel title="Current Role Scope">
                <SectionText label="Current Role" value={profile.position ?? "Belum diisi"} />
                <SectionText label="Primary Function" value={profile.department ?? "Belum diisi"} />
                <SectionText label="Role Evidence" value={showList(talent.projects, "Project evidence belum tersedia")} />
              </Panel>

              <Panel title="Capability & Readiness" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Fast Track (DP) Scale" value={show(talent.readiness)} />
                  <SourceField label="Soft Competencies Scale" value={showList(talent.behavioral)} />
                  <SourceField label="Technical Competency Scale" value={showList(talent.technical)} />
                  <SourceField label="BU Visibility Scale" />
                </div>
              </Panel>

              <Panel title="Talent Classification" source="SAP">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="Potential - HAV Matrix" value={show(talent.potential)} />
                  <SourceField label="Talent Class 12 Box Text" value={talent.potential && talent.potential >= 88 ? "High Potential" : talent.potential ? "Core Talent" : "Belum tersedia dari SAP"} />
                </div>
              </Panel>

              <Panel title="AI Insight for Current Position">
                <SectionText label="Current Position Readiness Score" value={`${aiInsight.readinessScore}/100`} />
                <SectionText label="Overall Assessment" value={aiInsight.overallAssessment} />
                <SectionText label="Key Strengths" value={aiInsight.keyStrengths.join("\n")} />
                <SectionText label="Skill Gap" value={aiInsight.skillGap.join("\n")} />
                <SectionText label="Recommended Training" value={aiInsight.recommendedTraining} />
                <SectionText label="Recommended Certification" value={aiInsight.recommendedCertification} />
                <SectionText label="Recommended Project Assignment" value={aiInsight.recommendedProjectAssignment} />
                <SectionText label="Recommended Coaching / Mentoring" value={aiInsight.recommendedCoachingMentoring} />
                <SectionText label="Priority Improvement Area" value={aiInsight.priorityImprovementArea} />
                <SectionText label="Career Risk / Notes" value={aiInsight.careerNotes} />
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="HSE-CT" source="HSE / Medical">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="MCU" value={talent.hse?.mcu ?? "Belum diisi"} source="HSE" />
                  <SourceField label="Simper / SID" value={talent.hse?.simper ?? "Belum diisi"} source="HSE" />
                  <SourceField className="sm:col-span-2" label="Incident Free" value={talent.hse?.incidentFreeMonths ? `${talent.hse.incidentFreeMonths} bulan` : "Belum diisi"} source="HSE" />
                </div>
              </Panel>

              <Panel title="Assessment" source="Assessment Center">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SourceField label="IQ" value={show(talent.assessment?.iq, "Belum diisi")} source="Assessment" />
                  <SourceField label="EQ" value={show(talent.assessment?.eq, "Belum diisi")} source="Assessment" />
                  <SourceField className="sm:col-span-2" label="Leadership" value={show(talent.assessment?.leadership, "Belum diisi")} source="Assessment" />
                </div>
              </Panel>

              <Panel title="Certification">
                <SectionText label="Semi/Certification History" value={showList(talent.certifications, "Belum diisi")} />
                <SectionText label="Certification Plan" value="Belum diisi" />
                <SectionText label="Development" value="Belum diisi" />
              </Panel>

              <Panel title="Attachments">
                <div className="space-y-3 text-sm">
                  <DataRow icon={FileText} label="CV / Resume" value={profile.cvUrl ? "Tersedia" : "Belum diisi"} />
                  <SectionText label="Catatan HR" value="Belum diisi" />
                </div>
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

function show(value: string | number | null | undefined, fallback = "Belum tersedia dari SAP") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function showList(value: string[] | undefined, fallback = "Belum tersedia dari SAP") {
  return value?.length ? value.join(" · ") : fallback;
}

function getCurrentPositionInsight(position: string, talent: TalentTrack) {
  const performanceAverage = talent.performance?.length
    ? Math.round(talent.performance.reduce((sum, value) => sum + value, 0) / talent.performance.length)
    : 76;
  const readinessScore = Math.min(100, Math.round(performanceAverage * 0.45 + (talent.readiness ?? 75) * 0.35 + (talent.assessment?.leadership ?? 75) * 0.2));
  const keyStrengths = [
    ...(talent.behavioral ?? []).slice(0, 2),
    ...(talent.technical ?? []).slice(0, 2),
  ].filter(Boolean);
  const skillGap = inferSkillGap(position, talent.technical ?? []);

  return {
    readinessScore,
    overallAssessment: readinessScore >= 85
      ? "Employee telah memenuhi sebagian besar kompetensi utama pada posisi saat ini dan siap diberi challenge yang lebih kompleks."
      : "Employee memiliki fondasi kompetensi yang baik, namun masih membutuhkan penguatan pada area kritikal posisi saat ini.",
    keyStrengths: keyStrengths.length ? keyStrengths : ["Leadership", "Operational Planning", "Problem Solving"],
    skillGap,
    recommendedTraining: /mine|pit|production|planning/i.test(position) ? "Advanced Mine Planning" : "Role-based Advanced Analytics",
    recommendedCertification: /hse|safety/i.test(position) ? "K3 / SMKP refreshment" : /mining|pit|production/i.test(position) ? "POP / POM / K3" : "Professional certification sesuai fungsi",
    recommendedProjectAssignment: "Continuous Improvement Project dengan KPI cost, productivity, atau safety yang terukur.",
    recommendedCoachingMentoring: "Mentoring bersama Superintendent/Manager terkait scope posisi dan decision making.",
    priorityImprovementArea: skillGap[0] ?? "Financial & Cost Control",
    careerNotes: readinessScore >= 85
      ? "Siap dikembangkan setelah gap utama ditutup dan divalidasi oleh atasan/HR."
      : "Perlu IDP terstruktur sebelum dipertimbangkan untuk rotasi atau promosi.",
  };
}

function inferSkillGap(position: string, skills: string[]) {
  const normalized = skills.join(" ").toLowerCase();
  const base = /finance|cost|budget/i.test(position)
    ? ["Advanced Data Analysis", "Stakeholder Influence"]
    : /hse|safety/i.test(position)
      ? ["Behavior Based Safety", "Emergency Crisis Leadership"]
      : /mine|pit|production|planning/i.test(position)
        ? ["Budget Planning", "Advanced Data Analysis"]
        : ["Budget Planning", "Advanced Data Analysis"];
  return base.filter((gap) => !normalized.includes(gap.toLowerCase())).slice(0, 3);
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
