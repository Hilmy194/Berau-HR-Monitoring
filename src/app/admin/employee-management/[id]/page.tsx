import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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

export const metadata = { title: "Talent Card - Berau Coal" };

export default async function EmployeeTalentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const profile = await getProfileDetail(id);

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-[hsl(222.2,47.4%,11.2%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="gap-2 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <Link href="/admin/employee-management">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Talent Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <Link href="/admin">
                Menu Admin <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white px-4 py-3 shadow-sm">
            <Image src="/BERAU-LOGO.png" alt="Berau Coal" width={122} height={34} className="h-8 w-auto object-contain" />
            <Image src="/MTL-LOGO.png" alt="TechConnect" width={122} height={34} className="h-8 w-auto object-contain" />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-4 shadow-[0_22px_80px_rgba(2,6,23,0.38)] sm:p-6 xl:p-8">
          <div className="border-b-2 border-red-500/80 pb-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Promotion Eligibility</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Talent / Employee Card - BERAU COAL
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                  Layout talent card per karyawan sudah disiapkan. Field penilaian, promosi, dan insight masih kosong agar
                  bisa diisi bertahap sesuai kebutuhan HR.
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
                  <DataRow icon={MapPin} label="Work Location" value="Belum diisi" />
                  <DataRow icon={Phone} label="Phone" value={profile.phone ?? "Belum diisi"} />
                  <DataRow icon={Mail} label="Email" value={profile.user.email ?? "Belum diisi"} />
                </div>
              </Panel>

              <Panel title="Personal Information">
                <BulletField label="Performance">
                  Final Rating 2026: Belum diisi
                  {"\n"}Final Rating 2025: Belum diisi
                  {"\n"}Final Rating 2024: Belum diisi
                </BulletField>
                <BulletField label="Last Promotion">Belum diisi</BulletField>
                <BulletField label="Education">Belum diisi</BulletField>
                <BulletField label="Talent Class">Belum diisi</BulletField>
                <BulletField label="Age">Belum diisi</BulletField>
                <BulletField label="Year of Service">Belum diisi</BulletField>
                <BulletField label="Barometer">Belum diisi</BulletField>
                <BulletField label="Aspiration">Belum diisi</BulletField>
              </Panel>

              <Panel title="Career History">
                <SectionText label="Career Within Company" value="Belum diisi" />
                <SectionText label="Career Outside Company" value="Belum diisi" />
              </Panel>
            </div>

            <div className="space-y-4">
              <ScoreGrid />

              <Panel title="Project Assignment">
                <SectionText label="Project List" value="Belum ada project assignment yang diisikan." />
                <SectionText label="Project Impact" value="Belum diisi" />
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Current Roles">
                  <SectionText label="Current Roles" value="Belum diisi" />
                  <MetricRow label="Manage BU" value="0" />
                  <MetricRow label="Manage HC" value="0" />
                  <MetricRow label="Manage Revenue" value="0" />
                  <MetricRow label="Manage Cost Saving" value="0" />
                </Panel>

                <Panel title="Additional Roles">
                  <SectionText label="New / Additional Roles" value="Belum diisi" />
                  <MetricRow label="Manage BU" value="0" />
                  <MetricRow label="Manage HC" value="0" />
                  <MetricRow label="Manage Revenue" value="0" />
                  <MetricRow label="Manage Cost Saving" value="0" />
                </Panel>
              </div>

              <Panel title="Job Evaluation">
                <SectionText label="New Role" value="Belum diisi" />
                <SectionText label="PC / OD Perspective" value="Belum diisi" />
                <SectionText label="Mercer Benchmark" value="Belum diisi" />
              </Panel>

              <Panel title="AI Insight for Promotion Recommendation">
                <SectionText label="Promotion Recommendation" value="Belum diisi" />
                <SectionText label="Readiness Promotion for Development Plan" value="Belum diisi" />
                <SectionText label="Certification" value="Belum diisi" />
                <SectionText label="Project" value="Belum diisi" />
                <SectionText label="Mentoring" value="Belum diisi" />
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="Multi-raters Potential Feedback">
                <div className="space-y-3">
                  <ScoreBar label="Overall Score" value="0.00" width="0%" />
                  <ScoreBar label="GO WIN" value="0.00" width="0%" muted />
                  <ScoreBar label="Achievement" value="0.00" width="0%" muted />
                  <ScoreBar label="Intellectual Cap." value="0.00" width="0%" muted />
                  <ScoreBar label="Work Determ." value="0.00" width="0%" muted />
                </div>
                <div className="mt-5">
                  <SectionText label="Employee Strength" value="Belum diisi" />
                </div>
              </Panel>

              <Panel title="Stakeholder Perspective">
                <SectionText label="Notes From BU" value="Belum diisi" />
              </Panel>

              <Panel title="Certification">
                <SectionText label="Semi/Certification History" value="Belum diisi" />
                <SectionText label="Certification Plan" value="Belum diisi" />
                <SectionText label="Development" value="Belum diisi" />
              </Panel>

              <Panel title="Span of Control">
                <SectionText label="Individual Contribution" value="Belum diisi" />
                <MetricRow label="CR Before" value="0.00" />
                <MetricRow label="CR After" value="0.00" />
                <MetricRow label="% Increase" value="0.00%" />
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

function Panel({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "soft";
}) {
  return (
    <section className="overflow-hidden border border-slate-300 bg-white">
      <div className={tone === "soft" ? "bg-[#dfe9d7] px-4 py-2.5 text-center text-base font-bold" : "bg-[#d5e2cb] px-4 py-2.5 text-center text-base font-bold"}>
        {title}
      </div>
      <div className="space-y-4 p-4">{children}</div>
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

function BulletField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-[#0969c2]">{label} :</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800">{children}</p>
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

function ScoreGrid() {
  const headers = [
    "Final Rating",
    "Job Value",
    "Certification",
    "Project",
    "Multi-raters Score",
    "AI Certification",
    "Tax Certification",
  ];

  return (
    <section className="overflow-hidden border border-slate-300 bg-white">
      <div className="grid grid-cols-2 border-b border-slate-300 text-center text-sm font-medium sm:grid-cols-4 xl:grid-cols-7">
        {headers.map((header) => (
          <div key={header} className="border-r border-slate-300 bg-[#d5e2cb] px-3 py-3 last:border-r-0">
            {header}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 text-center text-2xl text-slate-500 sm:grid-cols-4 xl:grid-cols-7">
        {headers.map((header) => (
          <div key={header} className="border-r border-slate-300 px-3 py-4 last:border-r-0">
            -
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreBar({
  label,
  value,
  width,
  muted = false,
}: {
  label: string;
  value: string;
  width: string;
  muted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_160px_56px] items-center gap-3">
      <span className={muted ? "font-semibold text-slate-900" : "font-bold text-[#0969c2]"}>{label}</span>
      <div className="h-4 overflow-hidden bg-slate-200">
        <div className={muted ? "h-full bg-slate-700" : "h-full bg-blue-600"} style={{ width }} />
      </div>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
