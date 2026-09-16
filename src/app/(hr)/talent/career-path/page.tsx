import Link from "next/link";
import { Eye, Milestone } from "lucide-react";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { listEmployeeDirectory, type EmployeeDirectoryItem } from "@/lib/services/employee-directory.service";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Career Path - Harmoni" };

export default async function CareerPathPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const employees = await listEmployeeDirectory();
  const filteredEmployees = filterEmployees(employees, filters);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Talent"
        title="Career Path"
        description="Pilih employee dari Talent Directory untuk membuka halaman career path per orang."
        icon={Milestone}
      />

      <EmployeeFilter filters={filters} employees={employees} />

      <TableShell>
        <table className="w-full min-w-[1160px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Last Promotion</th><th className="p-4 text-right">Career Path</th></tr>
          </thead>
          <tbody className="divide-y">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="align-top hover:bg-emerald-50/50">
                <td className="p-4 font-medium">
                  <Link href={`/admin/employee-management/${employee.id}`} className="hover:text-emerald-700 hover:underline">{employee.name}</Link>
                  <p className="text-xs text-muted-foreground">{employee.nik ?? "No NIK"} / {employee.email}</p>
                </td>
                <td className="p-4">{employee.position}</td>
                <td className="p-4">{employee.directorate}</td>
                <td className="p-4">{employee.division}</td>
                <td className="p-4">{employee.department}</td>
                <td className="p-4">{employee.lastPromotionDate ? formatDate(employee.lastPromotionDate) : "Belum diisi"}</td>
                <td className="p-4 text-right">
                  <Link href={employeeCareerHref(filters, employee.id)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                    <Eye className="h-3.5 w-3.5" />
                    Lihat Career Path
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {!filteredEmployees.length && (
        <section className="rounded-xl border border-dashed bg-white px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
          Tidak ada employee yang sesuai dengan filter.
        </section>
      )}
    </div>
  );
}

function EmployeeFilter({ filters, employees }: { filters: Record<string, string | undefined>; employees: EmployeeDirectoryItem[] }) {
  const directorates = uniqueSorted(employees.map((employee) => employee.directorate));
  const divisions = uniqueSorted(employees
    .filter((employee) => !filters.directorate || employee.directorate === filters.directorate)
    .map((employee) => employee.division));
  const departments = uniqueSorted(employees
    .filter((employee) => (!filters.directorate || employee.directorate === filters.directorate) && (!filters.division || employee.division === filters.division))
    .map((employee) => employee.department));
  const positions = uniqueSorted(employees
    .filter((employee) =>
      (!filters.directorate || employee.directorate === filters.directorate)
      && (!filters.division || employee.division === filters.division)
      && (!filters.department || employee.department === filters.department)
    )
    .map((employee) => employee.position));

  return (
    <form className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input name="peopleQ" defaultValue={filters.peopleQ} placeholder="Cari employee, NIK, posisi" className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2" />
        <SelectField name="directorate" value={filters.directorate} label="Semua direktorat" options={directorates} />
        <SelectField name="division" value={filters.division} label="Semua divisi" options={divisions} />
        <SelectField name="department" value={filters.department} label="Semua department" options={departments} />
        <SelectField name="position" value={filters.position} label="Semua posisi" options={positions} />
        <select name="peopleLimit" defaultValue={filters.peopleLimit ?? "80"} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="20">20 rows</option>
          <option value="40">40 rows</option>
          <option value="80">80 rows</option>
          <option value="120">120 rows</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Link href="/talent/career-path" className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold hover:bg-slate-50">Reset</Link>
        <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-slate-950 hover:bg-primary/90">Apply Filter</button>
      </div>
    </form>
  );
}

function SelectField({ name, value, label, options }: { name: string; value?: string; label: string; options: string[] }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function employeeCareerHref(filters: Record<string, string | undefined>, employeeId: string) {
  const params = new URLSearchParams();
  for (const key of ["peopleQ", "directorate", "division", "department", "position", "peopleLimit"]) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/talent/career-path/${employeeId}?${query}` : `/talent/career-path/${employeeId}`;
}

function filterEmployees(employees: EmployeeDirectoryItem[], filters: Record<string, string | undefined>) {
  const keyword = String(filters.peopleQ ?? "").trim().toLocaleLowerCase("id-ID");
  return employees
    .filter((employee) => !keyword || [
      employee.name,
      employee.nik,
      employee.email,
      employee.position,
      employee.directorate,
      employee.division,
      employee.department,
    ].some((value) => String(value ?? "").toLocaleLowerCase("id-ID").includes(keyword)))
    .filter((employee) => !filters.directorate || employee.directorate === filters.directorate)
    .filter((employee) => !filters.division || employee.division === filters.division)
    .filter((employee) => !filters.department || employee.department === filters.department)
    .filter((employee) => !filters.position || employee.position === filters.position)
    .slice(0, Math.min(200, Math.max(10, Number(filters.peopleLimit ?? 80) || 80)));
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter((value) => value && value !== "-")))
    .sort((a, b) => a.localeCompare(b));
}
