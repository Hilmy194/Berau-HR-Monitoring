import { FileText } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getFilterOptions, listJobDescriptions } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Job Descriptions - Berau Coal HR" };

export default async function JobDescriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const rows = listJobDescriptions(filters);
  const options = getFilterOptions();
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Organization Development" title="Job Descriptions" description="Job description placeholder untuk setiap posisi kritikal. Nanti bisa diganti dari OD master atau HRIS." icon={FileText} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        qPlaceholder="Search position atau job description..."
        orgOptions={options.orgOptions}
      />
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Position</th><th className="p-4">Organization</th><th className="p-4">Responsibilities</th><th className="p-4">Requirements</th><th className="p-4">Related Skills</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.position} className="align-top">
                <td className="p-4"><p className="font-medium">{row.position}</p><p className="text-xs text-muted-foreground">{row.department}</p></td>
                <td className="p-4 text-xs leading-5 text-muted-foreground">{row.directorate}<br />{row.division}<br />{row.department}</td>
                <td className="p-4"><ul className="list-disc space-y-1 pl-4">{row.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></td>
                <td className="p-4"><ul className="list-disc space-y-1 pl-4">{row.requirements.map((item) => <li key={item}>{item}</li>)}</ul></td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.relatedSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
