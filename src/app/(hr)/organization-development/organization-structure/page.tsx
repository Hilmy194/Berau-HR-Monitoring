import Link from "next/link";
import { Building, ChevronRight, UserRound } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { listEmployeeMaster, listOrgUnits } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Organization Structure - Berau Coal HR" };

export default async function OrganizationStructurePage() {
  const [orgUnits, employees] = await Promise.all([listOrgUnits(), listEmployeeMaster()]);
  const directorates = Array.from(new Set(orgUnits.map((unit) => unit.directorate))).sort();

  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Organization Development" title="Struktur Organisasi" description="Hierarchy Direktorat → Divisi → Department → Position → Employee. Setiap level dapat expand/collapse." icon={Building} />
      <section className="space-y-3">
        {directorates.map((directorate) => (
          <details key={directorate} open className="group rounded-2xl border bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold">
              <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open:rotate-90" />{directorate}</span>
              <Badge variant="secondary">{orgUnits.filter((unit) => unit.directorate === directorate).length} departments</Badge>
            </summary>
            <div className="space-y-3 border-t bg-slate-50 p-4">
              {Array.from(new Set(orgUnits.filter((unit) => unit.directorate === directorate).map((unit) => unit.division))).sort().map((division) => (
                <details key={division} className="group/div rounded-xl border bg-white">
                  <summary className="flex cursor-pointer list-none items-center gap-2 p-3 font-semibold">
                    <ChevronRight className="h-4 w-4 transition group-open/div:rotate-90" /> {division}
                  </summary>
                  <div className="space-y-3 border-t p-3">
                    {orgUnits.filter((unit) => unit.directorate === directorate && unit.division === division).map((department) => (
                      <details key={department.department} className="group/dept rounded-xl border bg-slate-50">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 font-medium">
                          <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open/dept:rotate-90" />{department.department}</span>
                          <Badge variant="outline">{department.positions.length} positions</Badge>
                        </summary>
                        <div className="grid gap-3 border-t p-3 md:grid-cols-2">
                          {department.positions.map((position) => {
                            const positionEmployees = employees.filter((employee) => employee.currentPosition === position || employee.department === department.department);
                            return (
                              <div key={position} className="rounded-xl border bg-white p-3">
                                <p className="font-semibold">{position}</p>
                                <div className="mt-3 space-y-2">
                                  {positionEmployees.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Belum ada employee pada dummy data.</p>
                                  ) : positionEmployees.slice(0, 4).map((employee) => (
                                    <Link key={employee.profileId} href={`/admin/employee-management/${employee.profileId}`} className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm hover:border-primary hover:bg-emerald-50">
                                      <UserRound className="h-4 w-4 text-emerald-700" />
                                      <span className="font-medium">{employee.name}</span>
                                      <span className="ml-auto text-xs text-muted-foreground">{employee.currentLevel}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
