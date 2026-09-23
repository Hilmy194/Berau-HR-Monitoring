import { Building, Database, ShieldCheck, TriangleAlert } from "lucide-react";
import { HrCoreOrgChart } from "@/components/admin/hr-core-org-chart";
import { LegacyOperationHierarchy } from "@/components/admin/legacy-operation-hierarchy";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Card, CardContent } from "@/components/ui/card";
import { getOrganizationHierarchy } from "@/lib/services/organization-development.service";
import { getOrganizationStructureForest } from "@/lib/services/organization-structure.service";

export const metadata = { title: "Struktur Organisasi - Harmoni" };
export const dynamic = "force-dynamic";

export default async function OrganizationStructurePage() {
  const forest = await getOrganizationStructureForest();
  const integrated = forest.source === "HR_CORE";
  const legacyOperation = integrated
    ? null
    : (await getOrganizationHierarchy()).find((item) => item.name === "OPERATION & HSE DIRECTORATE") ?? null;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`Organization Development · ${integrated ? "HR Core" : "Data sementara"}`}
        title="Struktur Organisasi"
        description={integrated
          ? "Struktur org-unit resmi per Business Unit yang sudah terintegrasi dengan HR Core."
          : "Struktur Operation sementara dari snapshot data sebelumnya sambil menunggu integrasi HR Core aktif."}
        icon={Building}
      />

      {integrated ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Info icon={Database} label="Sumber" value="HR Core · SAP OM/SWP" />
          <Info icon={ShieldCheck} label="Status" value="Terintegrasi · read-only" />
          <Info icon={Building} label="Bentuk struktur" value="Forest · multi-root" />
        </div>
      ) : null}

      {!integrated ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex gap-3 p-4 text-amber-950">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-bold">Mode data sementara</h2>
              <p className="mt-1 text-sm leading-6">{forest.fallbackReason} Data ini hanya mencakup struktur Operation dan tidak dianggap sebagai struktur resmi terbaru.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {integrated ? (
        <HrCoreOrgChart
          roots={forest.roots}
          totalUnits={forest.totalUnits}
          businessUnits={forest.businessUnits}
          snapshot={forest.snapshot}
          source={forest.source}
        />
      ) : <LegacyOperationHierarchy hierarchy={legacyOperation} />}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">{label}</span><span className="block text-sm font-bold">{value}</span></span></CardContent></Card>
  );
}
