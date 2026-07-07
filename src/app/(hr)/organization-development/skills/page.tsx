import { BookOpenCheck } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getFilterOptions, listPositionSkills } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Position Skills - Berau Coal HR" };

export default async function SkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const rows = listPositionSkills(filters);
  const options = getFilterOptions();
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Organization Development" title="Skills" description="Required skills per posisi. Data ini menjadi referensi Talent GAP, Rotation, dan rekomendasi IDP." icon={BookOpenCheck} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        qPlaceholder="Search position atau skill..."
        orgOptions={options.orgOptions}
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Required Skills</th><th className="p-4">Level</th><th className="p-4">Description</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.position} className="align-top">
                <td className="p-4 font-medium">{row.position}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></td>
                <td className="p-4"><Badge>{row.proficiencyLevel}</Badge></td>
                <td className="p-4 max-w-md text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
