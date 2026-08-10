"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DIRECTORATES } from "@/lib/constants";

type OrgOption = {
  directorate: string;
  division: string;
  department: string;
};

type PositionOption = OrgOption & {
  position: string;
};

export function CascadingFilterBar({
  q,
  selectedDirectorate,
  selectedDivision,
  selectedDepartment,
  selectedPosition,
  selectedEmployee,
  qPlaceholder = "Search...",
  orgOptions,
  employees = [],
  positions = [],
  positionOptions = [],
  showPosition = false,
  showEmployee = false,
  hiddenFields = {},
  resetHref = "?",
}: {
  q?: string;
  selectedDirectorate?: string;
  selectedDivision?: string;
  selectedDepartment?: string;
  selectedPosition?: string;
  selectedEmployee?: string;
  qPlaceholder?: string;
  orgOptions: OrgOption[];
  employees?: string[];
  positions?: string[];
  positionOptions?: PositionOption[];
  showPosition?: boolean;
  showEmployee?: boolean;
  hiddenFields?: Record<string, string>;
  resetHref?: string;
}) {
  const [directorate, setDirectorate] = useState(selectedDirectorate ?? "");
  const [division, setDivision] = useState(selectedDivision ?? "");
  const [department, setDepartment] = useState(selectedDepartment ?? "");

  const directorates = useMemo(
    () => Array.from(new Set([...DIRECTORATES, ...orgOptions.map((item) => item.directorate)])).sort(),
    [orgOptions]
  );

  const divisions = useMemo(
    () => Array.from(new Set(orgOptions
      .filter((item) => !directorate || item.directorate === directorate)
      .map((item) => item.division))).sort(),
    [directorate, orgOptions]
  );

  const departments = useMemo(
    () => Array.from(new Set(orgOptions
      .filter((item) => (!directorate || item.directorate === directorate) && (!division || item.division === division))
      .map((item) => item.department))).sort(),
    [directorate, division, orgOptions]
  );

  const filteredPositions = useMemo(() => {
    const source = positionOptions.length
      ? positionOptions
          .filter((item) =>
            (!directorate || item.directorate === directorate)
            && (!division || item.division === division)
            && (!department || item.department === department)
          )
          .map((item) => item.position)
      : positions;
    return Array.from(new Set(source.filter(Boolean))).sort();
  }, [department, directorate, division, positionOptions, positions]);

  return (
    <form className="rounded-xl border bg-white p-4 shadow-sm">
      {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder={qPlaceholder}
          className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2"
        />
        <select
          name="directorate"
          value={directorate}
          onChange={(event) => {
            setDirectorate(event.target.value);
            setDivision("");
            setDepartment("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua direktorat</option>
          {directorates.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="division"
          value={division}
          onChange={(event) => {
            setDivision(event.target.value);
            setDepartment("");
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua divisi</option>
          {divisions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Semua department</option>
          {departments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {showEmployee && (
          <select name="employee" defaultValue={selectedEmployee ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2">
            <option value="">Semua employee</option>
            {employees.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showPosition && (
          <select name="position" defaultValue={selectedPosition ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm xl:col-span-2">
            <option value="">Semua position</option>
            {filteredPositions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={resetHref}>Reset</Link>
        </Button>
        <Button size="sm" className="text-slate-950">Apply Filter</Button>
      </div>
    </form>
  );
}
