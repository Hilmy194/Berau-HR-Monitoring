"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type OrgItem = {
  id: string;
  name: string;
  directorateId?: string;
  divisionId?: string;
};

type LevelOption = {
  value: string;
  label: string;
};

export function OdOrgFilterForm({
  search,
  selectedDirectorateId,
  selectedDivisionId,
  selectedDepartmentId,
  selectedCompetencyCategory,
  selectedLevel,
  selectedStatus,
  selectedLimit,
  directorates,
  divisions,
  departments,
  competencyCategories = [],
  levels = [],
  showCompetencyCategory = false,
  showJobDescriptionStatus = false,
  searchPlaceholder,
  resetHref,
  limitOptions,
}: {
  search?: string;
  selectedDirectorateId?: string;
  selectedDivisionId?: string;
  selectedDepartmentId?: string;
  selectedCompetencyCategory?: string;
  selectedLevel?: string;
  selectedStatus?: string;
  selectedLimit?: string;
  directorates: OrgItem[];
  divisions: OrgItem[];
  departments: OrgItem[];
  competencyCategories?: string[];
  levels?: LevelOption[];
  showCompetencyCategory?: boolean;
  showJobDescriptionStatus?: boolean;
  searchPlaceholder: string;
  resetHref: string;
  limitOptions: string[];
}) {
  const [directorateId, setDirectorateId] = useState(selectedDirectorateId ?? "");
  const [divisionId, setDivisionId] = useState(selectedDivisionId ?? "");
  const [departmentId, setDepartmentId] = useState(selectedDepartmentId ?? "");

  const filteredDivisions = useMemo(
    () => divisions.filter((item) => !directorateId || item.directorateId === directorateId),
    [directorateId, divisions]
  );

  const filteredDepartments = useMemo(
    () => departments.filter((item) =>
      (!directorateId || item.directorateId === directorateId)
      && (!divisionId || item.divisionId === divisionId)
    ),
    [directorateId, divisionId, departments]
  );

  return (
    <form className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input name="search" defaultValue={search} placeholder={searchPlaceholder} className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm" />
        </div>
        <select
          name="directorateId"
          value={directorateId}
          onChange={(event) => {
            setDirectorateId(event.target.value);
            setDivisionId("");
            setDepartmentId("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua direktorat</option>
          {directorates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select
          name="divisionId"
          value={divisionId}
          onChange={(event) => {
            setDivisionId(event.target.value);
            setDepartmentId("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua divisi</option>
          {filteredDivisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select name="departmentId" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Semua department</option>
          {filteredDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select name="level" defaultValue={selectedLevel ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Semua jenjang posisi</option>
          {levels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {showCompetencyCategory && (
          <select name="competencyCategory" defaultValue={selectedCompetencyCategory ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Semua kategori competency</option>
            {competencyCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showJobDescriptionStatus && (
          <select name="jobDescriptionStatus" defaultValue={selectedStatus ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Semua status JD</option>
            <option value="mapped">Mapped</option>
            <option value="missing">Missing</option>
          </select>
        )}
        <select name="limit" defaultValue={selectedLimit ?? limitOptions[0]} className="h-10 rounded-md border bg-background px-3 text-sm">
          {limitOptions.map((item) => <option key={item} value={item}>{item} rows</option>)}
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button asChild variant="outline" size="sm"><Link href={resetHref}>Reset</Link></Button>
        <Button size="sm" className="text-slate-950">Apply Filter</Button>
      </div>
    </form>
  );
}
