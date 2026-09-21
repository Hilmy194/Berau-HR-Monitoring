import { Building, Database, ShieldCheck } from "lucide-react";
import { HrCoreOrgChart } from "@/components/admin/hr-core-org-chart";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { isHrCoreConfigured } from "@/lib/hr-core";
import { getOrganizationForest } from "@/lib/services/hr-core-organization.service";

export const metadata = { title: "Struktur Organisasi - Harmoni" };
export const dynamic = "force-dynamic";

export default async function OrganizationStructurePage() {
  const configured = isHrCoreConfigured();
  const forest = configured ? await getOrganizationForest().catch((error: unknown) => {
    console.error("[HR_CORE_PAGE_ERROR]", error instanceof Error ? error.message : "Unknown error");
    return null;
  }) : null;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development · HR Core"
        title="Struktur Organisasi"
        description="Forest org-unit resmi per Business Unit yang sudah di-onboard. Identitas unit dan posisi selalu menggunakan kode SAP, sementara data diperbarui melalui snapshot malam hari."
        icon={Building}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Info icon={Database} label="Sumber" value="HR Core · SAP OM/SWP" />
        <Info icon={ShieldCheck} label="Akses" value="Read-only dan scoped per BU" />
        <Info icon={Building} label="Bentuk struktur" value="Forest · multi-root" />
      </div>

      {forest ? (
        <HrCoreOrgChart roots={forest.roots} totalUnits={forest.totalUnits} businessUnits={forest.businessUnits} snapshot={forest.snapshot} />
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <h2 className="font-bold text-amber-950">{configured ? "HR Core sedang tidak tersedia" : "Koneksi HR Core belum dikonfigurasi"}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
              {configured
                ? "Periksa konektivitas network, role read-only, dan status view core. Detail koneksi sengaja tidak ditampilkan di browser."
                : "Isi HR_CORE_HOST, HR_CORE_PORT, HR_CORE_DATABASE, HR_CORE_USER, dan HR_CORE_PASSWORD pada secret environment server. Password tidak boleh memakai prefix NEXT_PUBLIC_."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">{label}</span><span className="block text-sm font-bold">{value}</span></span></CardContent></Card>
  );
}
