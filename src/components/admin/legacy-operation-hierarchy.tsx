import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  OrganizationHierarchyFunctionalArea,
  OrganizationHierarchyJobFamily,
  OrganizationHierarchyPosition,
} from "@/lib/services/organization-development.service";

type OperationHierarchy = {
  id: string;
  positionCount: number;
  functionalAreas: OrganizationHierarchyFunctionalArea[];
};

export function LegacyOperationHierarchy({ hierarchy }: { hierarchy: OperationHierarchy | null }) {
  if (!hierarchy) {
    return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Data struktur organisasi tidak ditemukan.</div>;
  }

  const families = flattenOperationFamilies(hierarchy.functionalAreas);
  return (
    <section>
      <details open className="group rounded-xl border bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold">
          <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open:rotate-90" />Operational</span>
          <Badge className="bg-emerald-700 hover:bg-emerald-700">{hierarchy.positionCount} positions</Badge>
        </summary>
        <div className="space-y-3 border-t bg-slate-50/70 p-3">
          {families.map((family) => <JobFamilyGroup key={family.id} family={family} />)}
        </div>
      </details>
    </section>
  );
}

function JobFamilyGroup({ family }: { family: OrganizationHierarchyJobFamily }) {
  const positions = family.levels.flatMap((level) => level.positions);
  return (
    <details open={family.name === "OHS"} className="group/family overflow-hidden rounded-xl border bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold">
        <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open/family:rotate-90" />{family.name}</span>
        <Badge variant="outline" className="bg-white">{family.positionCount} positions</Badge>
      </summary>
      <div className="grid gap-3 border-t bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-3">
        {positions.map((position) => <PositionCard key={position.id} position={position} />)}
      </div>
    </details>
  );
}

function PositionCard({ position }: { position: OrganizationHierarchyPosition }) {
  return (
    <article className="min-w-0 rounded-xl border bg-white p-4 shadow-sm">
      <Link href={`/organization-development/positions/${position.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline">
        {position.positionName}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">{position.positionGroup}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {position.currentHolders.length ? position.currentHolders.map((holder, index) => (
          <Badge key={`${holder}-${index}`} variant="success" className="font-medium">{holder}</Badge>
        )) : <Badge variant="warning">Vacant</Badge>}
        {position.vacantCount > 0 && position.currentHolders.length > 0 ? <Badge variant="warning">{position.vacantCount} vacant</Badge> : null}
      </div>
    </article>
  );
}

function flattenOperationFamilies(areas: OrganizationHierarchyFunctionalArea[]) {
  const families = areas.flatMap((area) => area.jobFamilies);
  const order = [
    "Geology & Exploration",
    "Mine Planning",
    "Mining Infrastructure & Project",
    "Mining Operation",
    "OHS",
    "OSREL",
    "System Compliance & Environment",
  ];
  return families.sort((a, b) => {
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    return (aIndex < 0 ? order.length : aIndex) - (bIndex < 0 ? order.length : bIndex) || a.name.localeCompare(b.name);
  });
}
