import Link from "next/link";
import { BrainCircuit, GitCompareArrows } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TalentAiPanel } from "@/components/admin/talent-ai-panel";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { OdPositionFilterBar } from "@/components/admin/od-position-filter-bar";
import { getEmployeeFilterOptions, listEmployeeMaster } from "@/lib/services/hr-modules.service";
import {
  getOdTalentFilterOptions,
  getTalentPositionAiProfile,
  listOdSkillNeeds,
  type OdTalentMatchRow,
} from "@/lib/services/od-talent-matching.service";

export const metadata = { title: "Current Gap / Skill Needs - Berau Coal HR" };

type SkillNeedsMode = "ai" | "competency";

export default async function TalentGapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const mode: SkillNeedsMode = filters.mode === "competency" ? "competency" : "ai";
  if (mode === "ai") return <AiCurrentGapPage filters={filters} />;
  const options = await getOdTalentFilterOptions();
  const rows = await listOdSkillNeeds(filters);
  const selected = filters.analyze ? rows.find((row) => row.candidateId === filters.analyze) : undefined;
  const totalGaps = rows.reduce((sum, row) => sum + row.competencyGaps.filter((gap) => gap.gap > 0).length, 0);
  const highGapEmployees = rows.filter((row) => row.priorityGaps.length >= 3).length;
  const topGap = getTopGap(rows.flatMap((row) => row.priorityGaps.map((gap) => gap.replace(/\sS\d\/S\d$/, ""))));

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Current Gap / Skill Needs"
        description="Tempat analisis current gap per karyawan terhadap posisi saat ini. Based on AI disiapkan untuk membaca skill history, performance, review, dan competency; Based on Competencies memakai OD person vs position scale."
        icon={GitCompareArrows}
      />

      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2 shadow-sm">
        <ModeLink active={false} href={modeHref(filters, "ai")} label="Based on AI" />
        <ModeLink active href={modeHref(filters, "competency")} label="Based on Competencies" />
      </div>

      <OdPositionFilterBar
        q={filters.q ?? filters.search}
        selectedDirectorateId={filters.directorateId}
        selectedDivisionId={filters.divisionId}
        selectedDepartmentId={filters.departmentId}
        selectedPositionId={filters.target}
        selectedLevel={filters.level}
        selectedCompetencyCategory={filters.competencyCategory}
        selectedLimit={filters.limit}
        directorates={options.directorates}
        divisions={options.divisions}
        departments={options.departments}
        positions={options.targetPositions}
        competencyCategories={options.competencyCategories}
        hiddenFields={{ mode }}
        showLevel
        showCompetencyCategory
        showLimit
        searchPlaceholder="Search employee, position, competency"
        submitLabel="Apply Filter"
        resetHref={`/talent/gap?mode=${mode}`}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Employee Dianalisis" value={rows.length} />
        <SummaryCard label="Total Skill Gap" value={totalGaps} />
        <SummaryCard label="Gap Tinggi" value={highGapEmployees} />
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gap Teratas</p>
          <p className="mt-2 text-sm font-semibold">{topGap}</p>
        </div>
      </div>

      {selected && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Competency Based Current Gap</p>
            <h2 className="mt-2 text-xl font-bold">{selected.employeeName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.currentPosition} terhadap {selected.targetPosition}</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Current fit</span>
                <span className="font-bold">{selected.matchScore}%</span>
              </div>
              <Progress value={selected.matchScore} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SkillList title="Meets Required Scale" items={selected.matchedCompetencies.slice(0, 8)} />
              <SkillList title="Priority Improvement" items={selected.priorityGaps.length ? selected.priorityGaps : ["Tidak ada gap utama"]} variant="outline" />
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <PlanCard label="70% On the Job" value={plan70(selected)} />
              <PlanCard label="20% Coaching / Mentoring" value={plan20(selected)} />
              <PlanCard label="10% Training / Certification" value={plan10(selected)} />
            </div>
          </div>
          <TalentAiPanel analysisType="SKILL_GAP" employeeId={selected.candidateId} targetPosition={selected.targetPositionId ?? selected.targetPosition} />
        </section>
      )}

      <TableShell>
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Compared Position</th><th className="p-4">Score</th><th className="p-4">Required Met</th><th className="p-4">Skill Needs</th><th className="p-4">70-20-10 Direction</th><th className="p-4">AI</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.candidateId} className="align-top">
                <td className="p-4 font-medium">{row.employeeName}<p className="text-xs text-muted-foreground">{row.employeeCode ?? "No NIK"}</p></td>
                <td className="p-4">{row.currentPosition}<p className="text-xs text-muted-foreground">{row.currentDivision}</p></td>
                <td className="p-4">{row.targetPosition}<p className="text-xs text-muted-foreground">{row.targetDirectorate} / {row.targetDivision}</p><p className="text-xs text-muted-foreground">{row.targetDepartment}</p></td>
                <td className="min-w-32 p-4"><p className="mb-2 font-semibold">{row.matchScore}%</p><Progress value={row.matchScore} /></td>
                <td className="p-4"><BadgeList items={row.matchedCompetencies.slice(0, 6)} /></td>
                <td className="p-4"><BadgeList items={row.priorityGaps} variant="outline" /></td>
                <td className="min-w-80 p-4 text-muted-foreground">
                  <p><span className="font-semibold text-slate-800">70%</span> {plan70(row)}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-800">20%</span> {plan20(row)}</p>
                  <p className="mt-1"><span className="font-semibold text-slate-800">10%</span> {plan10(row)}</p>
                </td>
                <td className="p-4"><Link href={analyzeHref(filters, mode, row)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-slate-50"><BrainCircuit className="h-3.5 w-3.5" />Analyze</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

async function AiCurrentGapPage({ filters }: { filters: Record<string, string | undefined> }) {
  const allEmployees = await listEmployeeMaster();
  const options = await getEmployeeFilterOptions();
  const keyword = (filters.q ?? "").trim().toLocaleLowerCase("id-ID");
  const employees = allEmployees.filter((employee) => !keyword || [
    employee.name,
    employee.currentPosition,
    employee.department,
    employee.division,
    employee.directorate,
  ].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword)))
    .filter((employee) => !filters.directorate || employee.directorate === filters.directorate)
    .filter((employee) => !filters.division || employee.division === filters.division)
    .filter((employee) => !filters.department || employee.department === filters.department)
    .filter((employee) => !filters.position || employee.currentPosition === filters.position)
    .filter((employee) => !filters.employee || employee.name === filters.employee);
  const selected = filters.analyze ? allEmployees.find((employee) => employee.profileId === filters.analyze) : undefined;
  const positionProfile = selected ? await getTalentPositionAiProfile(selected.currentPosition) : null;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Current Gap / Skill Needs"
        description="Pilih karyawan untuk menganalisis kesesuaian kemampuan saat ini terhadap role, responsibilities, job description, requirement, dan competency posisi yang sedang dijabat."
        icon={GitCompareArrows}
      />
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2 shadow-sm">
        <ModeLink active href={modeHref(filters, "ai")} label="Based on AI" />
        <ModeLink active={false} href={modeHref(filters, "competency")} label="Based on Competencies" />
      </div>

      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedPosition={filters.position}
        selectedEmployee={filters.employee}
        qPlaceholder="Cari nama, posisi, direktorat, divisi, atau department"
        orgOptions={options.orgOptions}
        employees={options.employees}
        positions={options.positions}
        positionOptions={allEmployees.map((employee) => ({
          directorate: employee.directorate,
          division: employee.division,
          department: employee.department,
          position: employee.currentPosition,
        }))}
        showPosition
        showEmployee
        hiddenFields={{ mode: "ai" }}
        resetHref="/talent/gap?mode=ai"
      />

      {selected && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee and Current Role Context</p>
            <h2 className="mt-2 text-xl font-bold">{selected.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.currentPosition} / {selected.division} / {selected.department}</p>
            <ContextBlock label="Current Role Job Description" value={positionProfile?.jobDescription ?? selected.jobDescription ?? "Belum tersedia"} />
            <SkillList
              title="Current Position Requirements"
              items={positionProfile?.competencyRequirements.map((item) => `${item.competencyName} - S${item.requiredLevel}`) ?? ["Requirement posisi belum dimapping"]}
              variant="outline"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SkillList title="Employee Competencies" items={[...selected.currentSkills, ...selected.behavioralSkills].slice(0, 10)} />
              <SkillList title="Evidence" items={[...selected.projects, ...selected.certifications].slice(0, 8)} />
            </div>
          </div>
          <TalentAiPanel
            analysisType="SKILL_GAP"
            employeeId={selected.profileId}
            targetPosition={positionProfile?.id ?? selected.currentPosition}
            buttonLabel="Analisis Current Gap dengan AI"
          />
        </section>
      )}

      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((employee) => (
              <tr key={employee.profileId} className="hover:bg-emerald-50/60">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${employee.profileId}`} className="hover:text-emerald-700 hover:underline">{employee.name}</Link></td>
                <td className="p-4">{employee.currentPosition}</td>
                <td className="p-4">{employee.directorate}</td>
                <td className="p-4">{employee.division}</td>
                <td className="p-4">{employee.department}</td>
                <td className="p-4 text-right"><Link href={employeeAnalyzeHref(filters, employee.profileId)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-slate-50"><BrainCircuit className="h-3.5 w-3.5" />Pilih untuk Dianalisis</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function employeeAnalyzeHref(filters: Record<string, string | undefined>, profileId: string) {
  const params = new URLSearchParams();
  for (const key of ["mode", "q", "directorate", "division", "department", "position", "employee"]) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  params.set("analyze", profileId);
  return `/talent/gap?${params.toString()}`;
}

function ContextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="my-4 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function ModeLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return <Link href={href} className={`rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-primary text-slate-950" : "text-muted-foreground hover:bg-slate-50"}`}>{label}</Link>;
}

function modeHref(filters: Record<string, string | undefined>, mode: SkillNeedsMode) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  for (const key of ["q", "employee", "competencyCategory", "level", "limit", "directorate", "division", "department", "position", "directorateId", "divisionId", "departmentId", "target"]) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return `/talent/gap?${params.toString()}`;
}

function analyzeHref(filters: Record<string, string | undefined>, mode: SkillNeedsMode, row: OdTalentMatchRow) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "analyze") params.set(key, value);
  });
  params.set("mode", mode);
  if (row.targetPositionId) params.set("target", row.targetPositionId);
  params.set("analyze", row.candidateId);
  return `/talent/gap?${params.toString()}`;
}

function SkillList({ title, items, variant = "secondary" }: { title: string; items: string[]; variant?: "secondary" | "outline" }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div>
    </div>
  );
}

function BadgeList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div>;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PlanCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function plan70(row: OdTalentMatchRow) {
  return row.priorityGaps[0] ? `Stretch assignment untuk membuktikan ${row.priorityGaps[0]} pada pekerjaan nyata.` : "Maintain performance dengan assignment reguler.";
}

function plan20(row: OdTalentMatchRow) {
  return row.priorityGaps[1] ? `Coaching oleh atasan/incumbent untuk ${row.priorityGaps[1]}.` : "Review berkala dengan atasan untuk mempertahankan competency.";
}

function plan10(row: OdTalentMatchRow) {
  return row.priorityGaps[2] ? `Training atau certification terkait ${row.priorityGaps[2]}.` : "Refreshment learning sesuai kebutuhan posisi.";
}

function getTopGap(gaps: string[]) {
  if (!gaps.length) return "Tidak ada gap kritikal";
  const counts = gaps.reduce<Record<string, number>>((acc, gap) => {
    acc[gap] = (acc[gap] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tidak ada gap kritikal";
}
