import { BrainCircuit, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { listRotationRecommendations } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TalentAiPanel } from "@/components/admin/talent-ai-panel";
import { OdPositionFilterBar } from "@/components/admin/od-position-filter-bar";
import { getOdTalentFilterOptions, getTalentPositionAiProfile, listOdMobilityRecommendations, type OdTalentMatchRow } from "@/lib/services/od-talent-matching.service";

export const metadata = { title: "Talent Mobility - Berau Coal HR" };

export default async function RotationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const mode = params.mode === "competency" ? "competency" : "ai";
  if (mode === "competency") return <CompetencyMobilityPage params={params} />;

  const options = await getOdTalentFilterOptions();
  const target = params.target;
  const targetProfile = target ? await getTalentPositionAiProfile(target) : null;
  const rows = targetProfile ? await listRotationRecommendations(targetProfile.positionName, params) : [];
  const candidateLabels = Object.fromEntries(rows.slice(0, 5).map((row, index) => [
    `CANDIDATE_${String.fromCharCode(65 + index)}`,
    row.candidateName,
  ]));
  const candidateMetadata = Object.fromEntries(rows.slice(0, 5).map((row, index) => [
    `CANDIDATE_${String.fromCharCode(65 + index)}`,
    {
      name: row.candidateName,
      currentPosition: row.currentPosition,
      department: row.department,
      fitScore: row.matchScore,
    },
  ]));

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Mobility" description="Pilih posisi yang perlu diisi. AI baru dijalankan setelah HR menekan tombol analisis untuk mencocokkan profil posisi dengan seluruh konteks kandidat internal." icon={RotateCcw} />
      <ModeSwitch baseHref="/talent/rotation" params={params} active={mode} />
      <OdPositionFilterBar
        selectedDirectorateId={params.directorateId}
        selectedDivisionId={params.divisionId}
        selectedDepartmentId={params.departmentId}
        selectedPositionId={target}
        directorates={options.directorates}
        divisions={options.divisions}
        departments={options.departments}
        positions={options.targetPositions}
        showSearch={false}
        positionRequired
        searchPlaceholder="Cari target position"
        submitLabel="Pilih Posisi"
        resetHref="/talent/rotation"
      />
      {!targetProfile && (
        <section className="rounded-xl border border-dashed bg-white px-6 py-12 text-center shadow-sm">
          <BrainCircuit className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Belum ada posisi yang dipilih</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pilih posisi tujuan untuk menyiapkan konteks analisis kandidat.</p>
        </section>
      )}
      {targetProfile && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position Context</p>
            <h2 className="mt-2 text-xl font-bold">{targetProfile.positionName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{targetProfile.directorate} / {targetProfile.division} / {targetProfile.department}</p>
            <ContextBlock label="Job Description" value={targetProfile.jobDescription ?? targetProfile.positionSummary ?? "Belum tersedia"} />
            <SkillList title="Competency Requirements" items={targetProfile.competencyRequirements.map((item) => `${item.competencyName} - S${item.requiredLevel}`)} />
          </div>
          <TalentAiPanel
            analysisType="MOBILITY"
            targetPosition={targetProfile.id}
            candidateLabels={candidateLabels}
            candidateMetadata={candidateMetadata}
            buttonLabel="Cari Kandidat dengan AI"
          />
        </section>
      )}
    </div>
  );
}

async function CompetencyMobilityPage({ params }: { params: Record<string, string | undefined> }) {
  const options = await getOdTalentFilterOptions();
  const target = params.target || options.targetPositions[0]?.id;
  const { targetPosition, rows } = await listOdMobilityRecommendations(target, params);
  const selected = rows.find((row) => row.candidateId === params.analyze) ?? rows[0];

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Mobility" description="Based on Competencies: kandidat dibandingkan dari OD person competency terhadap target position requirement, lalu gap ditampilkan untuk validasi HR." icon={RotateCcw} />
      <ModeSwitch baseHref="/talent/rotation" params={params} active="competency" />
      <OdPositionFilterBar
        selectedDirectorateId={params.directorateId}
        selectedDivisionId={params.divisionId}
        selectedDepartmentId={params.departmentId}
        selectedPositionId={target}
        selectedLevel={params.level}
        directorates={options.directorates}
        divisions={options.divisions}
        departments={options.departments}
        positions={options.targetPositions}
        hiddenFields={{ mode: "competency" }}
        showSearch={false}
        showLevel
        positionRequired
        searchPlaceholder="Cari target position"
        submitLabel="Cari"
        resetHref="/talent/rotation?mode=competency"
      />

      {selected && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Competency Based Analysis</p>
            <h2 className="mt-2 text-xl font-bold">{selected.employeeName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.currentPosition} ke {selected.targetPosition}</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Match score</span>
                <span className="font-bold">{selected.matchScore}%</span>
              </div>
              <Progress value={selected.matchScore} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SkillList title="Meets required scale" items={selected.matchedCompetencies.slice(0, 8)} />
              <SkillList title="Priority gap" items={selected.priorityGaps.length ? selected.priorityGaps : ["Tidak ada gap utama"]} />
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{selected.recommendationNote}</p>
          </div>
          <TalentAiPanel analysisType="MOBILITY" employeeId={selected.candidateId} targetPosition={selected.targetPositionId ?? selected.targetPosition} />
        </section>
      )}

      <TableShell>
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Candidate</th><th className="p-4">Current Position</th><th className="p-4">Target Position</th><th className="p-4">Match Score</th><th className="p-4">Matched Competency</th><th className="p-4">Skill Needs</th><th className="p-4">AI</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.candidateId} className="align-top">
                <td className="p-4 font-medium">{row.employeeName}<p className="text-xs text-muted-foreground">{row.employeeCode ?? "No NIK"}</p></td>
                <td className="p-4">{row.currentPosition}<p className="text-xs text-muted-foreground">{row.currentDivision}</p></td>
                <td className="p-4">{row.targetPosition}<p className="text-xs text-muted-foreground">{targetPosition?.department.division.name}</p></td>
                <td className="min-w-32 p-4"><p className="mb-2 font-semibold">{row.matchScore}%</p><Progress value={row.matchScore} /></td>
                <td className="p-4"><BadgeList items={row.matchedCompetencies.slice(0, 6)} /></td>
                <td className="p-4"><BadgeList items={row.priorityGaps} variant="outline" /></td>
                <td className="p-4"><Link href={buildCompetencyAnalyzeHref(params, row)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-slate-50"><BrainCircuit className="h-3.5 w-3.5" />Analisis</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function buildCompetencyAnalyzeHref(filters: Record<string, string | undefined>, row: OdTalentMatchRow) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "analyze") params.set(key, value);
  }
  params.set("mode", "competency");
  if (row.targetPositionId) params.set("target", row.targetPositionId);
  params.set("analyze", row.candidateId);
  return `/talent/rotation?${params.toString()}`;
}

function ModeSwitch({ baseHref, params, active }: { baseHref: string; params: Record<string, string | undefined>; active: "ai" | "competency" }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2 shadow-sm">
      <Link href={modeHref(baseHref, params, "ai")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${active === "ai" ? "bg-primary text-slate-950" : "text-muted-foreground hover:bg-slate-50"}`}>Based on AI</Link>
      <Link href={modeHref(baseHref, params, "competency")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${active === "competency" ? "bg-primary text-slate-950" : "text-muted-foreground hover:bg-slate-50"}`}>Based on Competencies</Link>
    </div>
  );
}

function modeHref(baseHref: string, filters: Record<string, string | undefined>, mode: "ai" | "competency") {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "mode" && key !== "analyze") params.set(key, value);
  });
  if (mode === "competency") params.set("mode", "competency");
  const query = params.toString();
  return query ? `${baseHref}?${query}` : baseHref;
}

function BadgeList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div>;
}

function SkillList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
      </div>
    </div>
  );
}

function ContextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="my-4 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
