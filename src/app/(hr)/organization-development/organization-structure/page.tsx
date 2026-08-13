import Link from "next/link";
import { Building, ChevronRight, Pencil, Users } from "lucide-react";
import { ModuleHero } from "@/components/admin/hr-module-ui";
import { Badge } from "@/components/ui/badge";
import {
  getOrganizationHierarchy,
  type OrganizationHierarchyFunctionalArea,
  type OrganizationHierarchyJobFamily,
  type OrganizationHierarchyLevel,
  type OrganizationHierarchyPosition,
} from "@/lib/services/organization-development.service";

export const metadata = { title: "Organization Structure - Harmoni" };

export default async function OrganizationStructurePage() {
  const directorates = await getOrganizationHierarchy();

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Organization Development"
        title="Struktur Organisasi"
        description="Struktur position-based dari data organisasi aktual. Mining disusun berdasarkan job family dan level; posisi yang sama menaungi seluruh incumbent dan slot vacant."
        icon={Building}
      />
      <div className="flex justify-end">
        <Link href="/organization-development/positions" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
          <Pencil className="h-4 w-4" /> Edit mapping posisi
        </Link>
      </div>
      <section className="space-y-3">
        {directorates.map((directorate) => (
          <details key={directorate.id} open={directorate.name === "OPERATION & HSE DIRECTORATE"} className="group rounded-lg border bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 font-bold">
              <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open:rotate-90" />{directorate.name}</span>
              <SummaryBadges positions={directorate.positionCount} incumbents={directorate.incumbentCount} vacant={directorate.vacantCount} />
            </summary>
            <div className="space-y-3 border-t bg-slate-50 p-4">
              {directorate.functionalAreas.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                  Belum ada struktur posisi yang ter-mapping untuk direktorat ini.
                </p>
              ) : directorate.functionalAreas.map((area) => <FunctionalAreaGroup key={area.id} area={area} />)}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}

function FunctionalAreaGroup({ area }: { area: OrganizationHierarchyFunctionalArea }) {
  return (
    <details open={area.name === "Mining"} className="group/area rounded-lg border bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-3 font-semibold">
        <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open/area:rotate-90" />Functional Area: {area.name}</span>
        <SummaryBadges positions={area.positionCount} incumbents={area.incumbentCount} vacant={area.vacantCount} compact />
      </summary>
      <div className="space-y-3 border-t bg-slate-50 p-3">
        {area.jobFamilies.map((family) => <JobFamilyGroup key={family.id} family={family} />)}
      </div>
    </details>
  );
}

function JobFamilyGroup({ family }: { family: OrganizationHierarchyJobFamily }) {
  return (
    <details className="group/family rounded-lg border bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-3 font-semibold">
        <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open/family:rotate-90" />Job Family: {family.name}</span>
        <SummaryBadges positions={family.positionCount} incumbents={family.incumbentCount} vacant={family.vacantCount} compact />
      </summary>
      <div className="space-y-3 border-t bg-slate-50 p-3">
        {family.levels.map((level) => <LevelGroup key={level.name} level={level} />)}
      </div>
    </details>
  );
}

function LevelGroup({ level }: { level: OrganizationHierarchyLevel }) {
  return (
    <details className="group/level rounded-lg border bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 font-semibold">
        <span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open/level:rotate-90" />Level: {level.name}</span>
        <Badge variant="outline">{level.positionCount} posisi unik</Badge>
      </summary>
      <div className="grid gap-3 border-t bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-3">
        {level.positions.map((position) => <PositionCard key={position.id} position={position} />)}
      </div>
    </details>
  );
}

function PositionCard({ position }: { position: OrganizationHierarchyPosition }) {
  const holderCount = position.currentHolders.length;
  return (
    <article className="min-w-0 rounded-lg border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/organization-development/positions/${position.id}`} className="font-semibold hover:text-emerald-700 hover:underline">
            {position.positionName}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{position.positionGroup} · {position.slotCount} slot</p>
        </div>
        <Link href={`/organization-development/positions/${position.id}`} title="Edit mapping posisi" className="shrink-0 rounded-md border p-2 text-muted-foreground hover:bg-slate-50 hover:text-slate-950">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {holderCount > 0 ? <Badge variant="success">{holderCount} incumbent</Badge> : <Badge variant="warning">Vacant</Badge>}
        {position.vacantCount > 0 && holderCount > 0 ? <Badge variant="warning">{position.vacantCount} vacant slot</Badge> : null}
      </div>

      {holderCount > 0 && (
        <details className="group/holders mt-3 border-t pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-700">
            <Users className="h-4 w-4 text-emerald-600" />
            Lihat nama incumbent
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition group-open/holders:rotate-90" />
          </summary>
          <ol className="mt-2 max-h-52 space-y-1 overflow-y-auto text-xs leading-5 text-slate-600">
            {position.currentHolders.map((holder, index) => <li key={`${holder}-${index}`}>{index + 1}. {holder}</li>)}
          </ol>
        </details>
      )}
    </article>
  );
}

function SummaryBadges({ positions, incumbents, vacant, compact = false }: { positions: number; incumbents: number; vacant: number; compact?: boolean }) {
  return (
    <span className="flex flex-wrap gap-2">
      <Badge variant="secondary">{positions} {compact ? "posisi" : "posisi unik"}</Badge>
      {incumbents > 0 && <Badge variant="success">{incumbents} incumbent</Badge>}
      {vacant > 0 && <Badge variant="warning">{vacant} vacant slot</Badge>}
    </span>
  );
}
