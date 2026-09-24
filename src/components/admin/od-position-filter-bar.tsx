"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type OrgItem = {
  id: string;
  name: string;
  directorateId?: string;
  divisionId?: string;
};

type PositionItem = {
  id: string;
  code?: string;
  name: string;
  label: string;
  level: string;
  directorateId: string;
  directorate: string;
  divisionId: string;
  division: string;
  departmentId: string;
  department: string;
};

export function OdPositionFilterBar({
  q,
  selectedDirectorateId,
  selectedDivisionId,
  selectedDepartmentId,
  selectedPositionId,
  selectedLevel,
  selectedCompetencyCategory,
  selectedLimit,
  directorates,
  divisions,
  departments,
  positions,
  competencyCategories = [],
  hiddenFields = {},
  showSearch = true,
  showLevel = false,
  showCompetencyCategory = false,
  showLimit = false,
  positionRequired = false,
  searchablePosition = false,
  searchPlaceholder = "Search position...",
  submitLabel = "Apply Filter",
  resetHref,
}: {
  q?: string;
  selectedDirectorateId?: string;
  selectedDivisionId?: string;
  selectedDepartmentId?: string;
  selectedPositionId?: string;
  selectedLevel?: string;
  selectedCompetencyCategory?: string;
  selectedLimit?: string;
  directorates: OrgItem[];
  divisions: OrgItem[];
  departments: OrgItem[];
  positions: PositionItem[];
  competencyCategories?: string[];
  hiddenFields?: Record<string, string>;
  showSearch?: boolean;
  showLevel?: boolean;
  showCompetencyCategory?: boolean;
  showLimit?: boolean;
  positionRequired?: boolean;
  searchablePosition?: boolean;
  searchPlaceholder?: string;
  submitLabel?: string;
  resetHref: string;
}) {
  const [directorateId, setDirectorateId] = useState(selectedDirectorateId ?? "");
  const [divisionId, setDivisionId] = useState(selectedDivisionId ?? "");
  const [departmentId, setDepartmentId] = useState(selectedDepartmentId ?? "");
  const [positionId, setPositionId] = useState(selectedPositionId ?? "");
  const [positionQuery, setPositionQuery] = useState("");
  const [level, setLevel] = useState(selectedLevel ?? "");

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

  const organizationPositions = useMemo(
    () => positions.filter((item) =>
      (!directorateId || item.directorateId === directorateId)
      && (!divisionId || item.divisionId === divisionId)
      && (!departmentId || item.departmentId === departmentId)
    ),
    [departmentId, directorateId, divisionId, positions]
  );

  const levels = useMemo(
    () => Array.from(new Set(organizationPositions.map((item) => item.level).filter(Boolean))).sort(comparePositionLevels),
    [organizationPositions]
  );

  const filteredPositions = useMemo(() => {
    const query = positionQuery.trim().toLocaleLowerCase("id-ID");
    return organizationPositions.filter((item) => {
      if (level && item.level !== level) return false;
      if (!query) return true;
      return [item.code, item.name, item.label, item.level, item.directorate, item.division, item.department]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(query));
    });
  }, [level, organizationPositions, positionQuery]);

  return (
    <form className="rounded-xl border bg-white p-4 shadow-sm">
      {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {showSearch && (
          <input
            name="q"
            defaultValue={q}
            placeholder={searchPlaceholder}
            className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2"
          />
        )}
        <select
          name="directorateId"
          value={directorateId}
          onChange={(event) => {
            setDirectorateId(event.target.value);
            setDivisionId("");
            setDepartmentId("");
            setPositionId("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua direktorat</option>
          {directorates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        {showLevel && (
          <select
            name="level"
            value={level}
            onChange={(event) => {
              setLevel(event.target.value);
              setPositionId("");
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Semua level</option>
            {levels.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {searchablePosition && (
          <div className="xl:col-span-2">
            <input
              type="search"
              value={positionQuery}
              onChange={(event) => {
                setPositionQuery(event.target.value);
                setPositionId("");
              }}
              placeholder="Cari nama, level, kode, atau unit posisi..."
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">{filteredPositions.length} posisi ditemukan</p>
          </div>
        )}
        <select
          name="divisionId"
          value={divisionId}
          onChange={(event) => {
            setDivisionId(event.target.value);
            setDepartmentId("");
            setPositionId("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua divisi</option>
          {filteredDivisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select
          name="departmentId"
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(event.target.value);
            setPositionId("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua department</option>
          {filteredDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select
          name="target"
          value={positionId}
          required={positionRequired}
          onChange={(event) => setPositionId(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2"
        >
          <option value="">{positionRequired ? "Pilih posisi" : "Semua posisi"}</option>
          {filteredPositions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {showCompetencyCategory && (
          <select name="competencyCategory" defaultValue={selectedCompetencyCategory ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Semua competency categories</option>
            {competencyCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showLimit && (
          <select name="limit" defaultValue={selectedLimit ?? "80"} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="20">20 rows</option>
            <option value="40">40 rows</option>
            <option value="80">80 rows</option>
          </select>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button asChild variant="outline" size="sm"><Link href={resetHref}>Reset</Link></Button>
        <Button size="sm" className="text-slate-950">{submitLabel}</Button>
      </div>
    </form>
  );
}

function comparePositionLevels(a: string, b: string) {
  const order = ["GM", "Sr Manager / Manager", "Superintendent / Sr Specialist", "Supervisor / Specialist", "Engineer / Officer", "Foreman", "Operator", "Unmapped"];
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);
  return (aIndex < 0 ? order.length : aIndex) - (bIndex < 0 ? order.length : bIndex) || a.localeCompare(b);
}
