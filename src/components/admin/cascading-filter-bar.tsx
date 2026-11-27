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
    <form className="rounded-xl border bg-white px-3 py-2.5 shadow-xs">
      {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={qPlaceholder}
          className="h-8 min-w-[190px] flex-[1.4] rounded-md border bg-background px-2.5 text-xs"
        />
        <select
          name="directorate"
          value={directorate}
          onChange={(event) => {
            setDirectorate(event.target.value);
            setDivision("");
            setDepartment("");
          }}
          className="h-8 min-w-[125px] flex-1 max-w-[175px] rounded-md border bg-background px-2 text-xs"
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
          className="h-8 min-w-[120px] flex-1 max-w-[170px] rounded-md border bg-background px-2 text-xs"
        >
          <option value="">Semua divisi</option>
          {divisions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-8 min-w-[130px] flex-1 max-w-[175px] rounded-md border bg-background px-2 text-xs"
        >
          <option value="">Semua departemen</option>
          {departments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        {showDpYear && (
          <select
            name="dpYear"
            defaultValue={selectedDpYear ?? ""}
            className="h-8 min-w-[115px] max-w-[145px] rounded-md border bg-background px-2 text-xs"
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
            className="h-8 min-w-[120px] max-w-[150px] rounded-md border bg-background px-2 text-xs"
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
            className="h-8 min-w-[120px] max-w-[155px] rounded-md border bg-background px-2 text-xs font-medium text-slate-900"
          >
            <option value="">Semua status talent</option>
            <option value="talent">Talent</option>
            <option value="non_talent">Bukan Talent</option>
          </select>
        )}

        {showStatus && (
          <select name="status" defaultValue={selectedStatus ?? ""} className="h-8 min-w-[115px] max-w-[150px] rounded-md border bg-background px-2 text-xs">
            <option value="">Semua status</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showEmployee && (
          <select name="employee" defaultValue={selectedEmployee ?? ""} className="h-8 min-w-[130px] flex-1 max-w-[180px] rounded-md border bg-background px-2 text-xs">
            <option value="">Semua employee</option>
            {employees.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        {showPosition && (
          <select name="position" defaultValue={selectedPosition ?? ""} className="h-8 min-w-[130px] flex-1 max-w-[185px] rounded-md border bg-background px-2 text-xs">
            <option value="">Semua position</option>
            {filteredPositions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
            <Link href={resetHref}>Reset</Link>
          </Button>
          <Button size="sm" className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            Terapkan
          </Button>
        </div>
      </div>
    </form>
  );
}
