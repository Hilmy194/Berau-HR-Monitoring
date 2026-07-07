import { BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { ModuleHero, TableShell } from "@/components/admin/hr-module-ui";
import { CascadingFilterBar } from "@/components/admin/cascading-filter-bar";
import { getEmployeeFilterOptions, listLearningRecommendations } from "@/lib/services/hr-modules.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Learning IDP - Berau Coal HR" };

export default async function LearningIdpPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const [rows, options] = await Promise.all([listLearningRecommendations(filters), getEmployeeFilterOptions()]);
  return (
    <div className="space-y-6">
      <ModuleHero eyebrow="Learning" title="Individual Development Plan" description="Rekomendasi IDP berbasis gap, kebutuhan promosi, dan kebutuhan rotasi. Nanti dapat diperkaya oleh AI dari Talent Card." icon={BookOpenCheck} />
      <CascadingFilterBar
        q={filters.q}
        selectedDirectorate={filters.directorate}
        selectedDivision={filters.division}
        selectedDepartment={filters.department}
        selectedEmployee={filters.employee}
        qPlaceholder="Search employee atau position..."
        orgOptions={options.orgOptions}
        employees={options.employees}
        showEmployee
      />
      <section className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-emerald-700">70%</p>
            <p className="mt-1 font-semibold">Project / OJT</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Stretch assignment, improvement project, dan exposure pekerjaan nyata.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-blue-700">20%</p>
            <p className="mt-1 font-semibold">Coaching / Mentoring</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Pendampingan atasan, mentor role tujuan, dan review progress berkala.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-violet-700">10%</p>
            <p className="mt-1 font-semibold">Certification / Formal</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Training, sertifikasi, atau kelas formal untuk menutup gap spesifik.</p>
          </CardContent>
        </Card>
      </section>
      <TableShell>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Employee</th><th className="p-4">Current Position</th><th className="p-4">Target Position</th><th className="p-4">Directorate</th><th className="p-4">Division</th><th className="p-4">Department</th><th className="p-4">Current Position Gap</th><th className="p-4">Promotion Gap</th><th className="p-4">70% Project/OJT</th><th className="p-4">20% Coaching</th><th className="p-4">10% Certification</th><th className="p-4">Success Metric</th><th className="p-4">Timeline</th><th className="p-4">Priority</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={`${row.employeeName}-${row.recommendationName}`} className="align-top">
                <td className="p-4 font-medium"><Link href={`/admin/employee-management/${row.profileId}`} className="hover:text-emerald-700 hover:underline">{row.employeeName}</Link></td>
                <td className="p-4">{row.currentPosition}</td>
                <td className="p-4">{row.targetPosition}</td>
                <td className="p-4">{row.directorate}</td>
                <td className="p-4">{row.division}</td>
                <td className="p-4">{row.department}</td>
                <td className="p-4 text-muted-foreground">{row.currentPositionGap}</td>
                <td className="p-4 text-muted-foreground">{row.promotionGap}</td>
                <td className="p-4 min-w-72 text-muted-foreground">{row.projectOjtPlan}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.coachingPlan}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.certificationPlan}</td>
                <td className="p-4 min-w-64 text-muted-foreground">{row.successMetric}</td>
                <td className="p-4"><Badge variant="outline">{row.timeline}</Badge></td>
                <td className="p-4"><Badge>{row.priority}</Badge></td>
                <td className="p-4"><Badge variant="secondary">{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
