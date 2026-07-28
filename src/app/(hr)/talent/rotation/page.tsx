import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listPositionSkills, listRotationRecommendations } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Talent Mobility - Berau Coal HR" };

export default async function RotationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const positions = listPositionSkills().map((position) => position.position);
  const target = params.target || positions[0] || "Mining Operations Manager";
  const [rows, options] = await Promise.all([listRotationRecommendations(target, params), getEmployeeFilterOptions()]);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Talent" title="Mobility" description="Pilih target position, lalu lihat kandidat mobility berdasarkan match skill dan job description placeholder." icon={RotateCcw} />
      <form className="rounded-xl border bg-white p-4 shadow-sm">
        <label htmlFor="target" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Target Position</label>
        <div className="mt-2 flex gap-2">
          <select id="target" name="target" defaultValue={target} className="h-10 flex-1 rounded-md border bg-background px-3 text-sm">
            {positions.map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-slate-950">Cari</button>
        </div>
      </form>
      <CascadingFilterBar
        q={params.q}
        selectedDirectorate={params.directorate}
        selectedDivision={params.division}
        selectedDepartment={params.department}
        selectedEmployee={params.employee}
        qPlaceholder="Filter candidate..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
        hiddenFields={{ target }}
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Candidate</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Match Score</th><th className="p-4">Matched Skill</th><th className="p-4">Missing Skill</th><th className="p-4">Development Need (IDP)</th><th className="p-4">Recommendation</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.candidateName} className="align-top">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.candidateName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4 min-w-32"><p className="mb-2 font-semibold">{row.matchScore}%</p><Progress value={row.matchScore} /></td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.matchedSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.missingSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></td>
                <td className="p-4 text-muted-foreground">{row.developmentNeed}</td>
                <td className="p-4 text-muted-foreground">{row.recommendationNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
