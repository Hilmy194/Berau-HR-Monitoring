import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrganizationDevelopmentFilterOptions, getPositions } from "@/lib/services/organization-development.service";

export const metadata = { title: "Position Directory - Berau Coal HR" };

export default async function PositionDirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [{ rows, pagination }, options] = await Promise.all([
    getPositions(filters),
    getOrganizationDevelopmentFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Organization Development" title="Position Directory" description="Daftar position-based data: job level, organisasi, job description status, dan competency priority." icon={BriefcaseBusiness} />
      <form className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input name="search" defaultValue={filters.search ?? filters.q} placeholder="Search position, code, job description, or competency" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm" />
          </div>
          <Select name="directorateId" value={filters.directorateId} label="All directorates" items={options.directorates} />
          <Select name="divisionId" value={filters.divisionId} label="All divisions" items={options.divisions} />
          <Select name="departmentId" value={filters.departmentId} label="All departments" items={options.departments} />
          <SelectText name="positionGroup" value={filters.positionGroup} label="All position groups" items={options.positionGroups} />
          <SelectText name="competencyCategory" value={filters.competencyCategory} label="All competency categories" items={options.competencyCategories} />
          <select name="sortBy" defaultValue={filters.sortBy ?? "positionName"} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="positionName">Sort by position</option>
            <option value="positionGroup">Sort by group</option>
            <option value="status">Sort by status</option>
          </select>
          <select name="sortOrder" defaultValue={filters.sortOrder ?? "asc"} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/organization-development/positions">Reset</Link></Button>
          <Button size="sm" className="text-slate-950">Apply Filter</Button>
        </div>
      </form>

      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Position Name</th>
              <th className="p-4">Position Group</th>
              <th className="p-4">Directorate</th>
              <th className="p-4">Division</th>
              <th className="p-4">Department / Unit</th>
              <th className="p-4">Competencies</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No positions match the selected filters.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="p-4"><p className="font-semibold">{row.positionName}</p><p className="text-xs text-muted-foreground">{row.positionCode}</p></td>
                <td className="p-4">{row.positionGroup}</td>
                <td className="p-4">{row.directorate.name}</td>
                <td className="p-4">{row.division.name}</td>
                <td className="p-4">{row.department.name}</td>
                <td className="p-4"><Badge variant="outline">{row.competencyCount}</Badge></td>
                <td className="p-4"><Badge variant={row.hasJobDescription && row.competencyCount > 0 ? "success" : "warning"}>{row.hasJobDescription && row.competencyCount > 0 ? "Complete" : "Incomplete"}</Badge></td>
                <td className="p-4"><Button asChild variant="outline" size="sm"><Link href={`/organization-development/positions/${row.id}`}>Detail <ArrowRight className="h-4 w-4" /></Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
        <span className="text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString("id-ID")} positions</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Link href={pageHref(filters, pagination.page - 1)}><ArrowLeft className="h-4 w-4" /> Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}>
            <Link href={pageHref(filters, pagination.page + 1)}>Next <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Select({ name, value, label, items }: { name: string; value?: string; label: string; items: Array<{ id: string; name: string }> }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
  );
}

function SelectText({ name, value, label, items }: { name: string; value?: string; label: string; items: string[] }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {items.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}

function pageHref(filters: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  params.set("page", String(Math.max(1, page)));
  return `/organization-development/positions?${params.toString()}`;
}
