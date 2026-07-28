import { BookOpenCheck, Building, FileText, Network } from "lucide-react";
import { DataSourceStrip, ModuleHero, ModuleMenuCard } from "@/components/admin/hr-module-ui";
import { DATA_SOURCES, listJobDescriptions, listOrgUnits, listPositionSkills } from "@/lib/services/hr-modules.service";

export const metadata = { title: "Organization Development - Berau Coal HR" };

export default function OrganizationDevelopmentPage() {
  const orgUnits = listOrgUnits();
  const skills = listPositionSkills();
  const jobDescriptions = listJobDescriptions();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Job architecture, struktur, dan skill requirement"
        description="OD menjadi sumber definisi posisi, job description, dan required skills yang dipakai Talent GAP, Mobility, dan Learning/IDP."
        icon={Network}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <ModuleMenuCard title="Struktur Organisasi" href="/organization-development/organization-structure" icon={Building} description="Direktorat, divisi, departemen, dan posisi." meta={`${orgUnits.length} units`} />
        <ModuleMenuCard title="Skills" href="/organization-development/skills" icon={BookOpenCheck} description="Daftar skill yang dibutuhkan tiap posisi." meta={`${skills.length} roles`} />
        <ModuleMenuCard title="Job Descriptions" href="/organization-development/job-descriptions" icon={FileText} description="Responsibilities, requirements, dan skill terkait." meta={`${jobDescriptions.length} JDs`} />
      </section>
      <DataSourceStrip sources={DATA_SOURCES} />
    </div>
  );
}
