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
  selectedStatus,
  selectedJoinYear,
  selectedDpYear,
  selectedTalent,
  qPlaceholder = "Search...",
  orgOptions,
  employees = [],
  positions = [],
  positionOptions = [],
  showPosition = false,
  showEmployee = false,
  showStatus = false,
  showJoinYear = false,
  showDpYear = false,
  showTalent = false,
  statuses = [],
  joinYears = [],
  dpYears = [],
  hiddenFields = {},
  resetHref = "?",
}: {
  q?: string;
  selectedDirectorate?: string;
  selectedDivision?: string;
  selectedDepartment?: string;
  selectedPosition?: string;
  selectedEmployee?: string;
  selectedStatus?: string;
  selectedJoinYear?: string;
  selectedDpYear?: string;
  selectedTalent?: string;
  qPlaceholder?: string;
  orgOptions: OrgOption[];
  employees?: string[];
  positions?: string[];
  positionOptions?: PositionOption[];
  showPosition?: boolean;
  showEmployee?: boolean;
  showStatus?: boolean;
  showJoinYear?: boolean;
  showDpYear?: boolean;
  showTalent?: boolean;
  statuses?: string[];
  joinYears?: string[];
  dpYears?: string[];
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
    <form className="rounded-xl border bg-white p-3.5 sm:p-4 shadow-sm">
      {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <input
          name="q"
          defaultValue={q}
          placeholder={qPlaceholder}
          className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm col-span-1 sm:col-span-2"
        />
        <select
          name="directorate"
          value={directorate}
          onChange={(event) => {
            setDirectorate(event.target.value);
            setDivision("");
            setDepartment("");
          }}
          className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
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
          className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
        >
          <option value="">Semua divisi</option>
          {divisions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
        >
          <option value="">Semua departemen</option>
          {departments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        {showDpYear && (
          <select
            name="dpYear"
            defaultValue={selectedDpYear ?? ""}
            className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
          >
            <option value="">Semua tahun DP</option>
            {dpYears.map((item) => (
              <option key={item} value={item}>
                Tahun DP: {item}
              </option>
            ))}
          </select>
        )}

        {showJoinYear && (
          <select
            name="joinYear"
            defaultValue={selectedJoinYear ?? ""}
            className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
          >
            <option value="">Semua tahun join</option>
            {joinYears.map((item) => (
              <option key={item} value={item}>
                Tahun Join: {item}
              </option>
            ))}
          </select>
        )}

        {showTalent && (
          <select
            name="talent"
            defaultValue={selectedTalent ?? ""}
            className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm font-medium text-slate-900"
          >
            <option value="">Semua status talent</option>
            <option value="talent">Talent</option>
            <option value="non_talent">Bukan Talent</option>
          </select>
        )}

        {showStatus && (
          <select name="status" defaultValue={selectedStatus ?? ""} className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm">
            <option value="">Semua status</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showEmployee && (
          <select name="employee" defaultValue={selectedEmployee ?? ""} className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm sm:col-span-2">
            <option value="">Semua employee</option>
            {employees.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showPosition && (
          <select name="position" defaultValue={selectedPosition ?? ""} className="h-9 rounded-md border bg-background px-3 text-xs sm:text-sm sm:col-span-2">
            <option value="">Semua position</option>
            {filteredPositions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Filter data berdasarkan organisasi, tahun DP, dan tahun bergabung.
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={resetHref}>Reset Filter</Link>
          </Button>
          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            Terapkan Filter
          </Button>
        </div>
      </div>
    </form>
  );
}
