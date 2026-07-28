"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Mail,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import type { EmployeeDirectoryItem } from "@/lib/services/employee-directory.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, getInitials } from "@/lib/utils";

const ALL = "__all__";

export function EmployeeDirectory({ employees }: { employees: EmployeeDirectoryItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [directorate, setDirectorate] = useState(ALL);
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);

  const directorates = useMemo(
    () => Array.from(new Set(employees.map((item) => item.directorate).filter(Boolean) as string[])).sort(),
    [employees]
  );
  const divisions = useMemo(
    () => Array.from(new Set(employees
      .filter((item) => directorate === ALL || item.directorate === directorate)
      .map((item) => item.division)
      .filter(Boolean) as string[])).sort(),
    [directorate, employees]
  );
  const departments = useMemo(
    () => Array.from(new Set(employees
      .filter((item) => (directorate === ALL || item.directorate === directorate) && (division === ALL || item.division === division))
      .map((item) => item.department)
      .filter(Boolean) as string[])).sort(),
    [directorate, division, employees]
  );
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    return employees.filter((employee) => {
      const matchesQuery = !keyword || [employee.name, employee.email, employee.directorate, employee.division, employee.department, employee.position]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(keyword));
      return matchesQuery
        && (directorate === ALL || employee.directorate === directorate)
        && (division === ALL || employee.division === division)
        && (department === ALL || employee.department === department);
    });
  }, [department, directorate, division, employees, query]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-700 via-primary to-emerald-300" />
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Direktori
              </p>
              <p className="mt-1 text-sm text-slate-500">Cari dan saring data karyawan sebelum membuka halaman talent card.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-slate-900">{filtered.length}</span> dari {employees.length}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari employee, posisi, direktorat, divisi, department..."
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>
            <Select value={directorate} onValueChange={(value) => {
              setDirectorate(value);
              setDivision(ALL);
              setDepartment(ALL);
            }}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/70 text-slate-900 lg:w-auto">
                <SelectValue placeholder="Semua direktorat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua direktorat</SelectItem>
                {directorates.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={division} onValueChange={(value) => {
              setDivision(value);
              setDepartment(ALL);
            }}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/70 text-slate-900 lg:w-auto">
                <SelectValue placeholder="Semua divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua divisi</SelectItem>
                {divisions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/70 text-slate-900 lg:w-auto">
                <SelectValue placeholder="Semua departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua departemen</SelectItem>
                {departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {employees.length === 0 ? (
        <EmptyState title="Belum ada data karyawan" description="Daftar karyawan akan tampil setelah sumber data employee master terhubung." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Karyawan tidak ditemukan" description="Coba ubah kata kunci atau filter yang digunakan." />
      ) : (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(260px,1.4fr)_150px_150px_150px_150px_44px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 xl:grid">
            <span>Karyawan</span>
            <span>Direktorat</span>
            <span>Divisi</span>
            <span>Departemen</span>
            <span>Last Promotion</span>
            <span className="sr-only">Aksi</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} onOpen={() => router.push(`/admin/employee-management/${employee.id}`)} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function EmployeeRow({ employee, onOpen }: { employee: EmployeeDirectoryItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left outline-none transition-all hover:bg-emerald-50/70 focus-visible:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 xl:grid-cols-[minmax(260px,1.4fr)_150px_150px_150px_150px_44px]"
      aria-label={`Buka halaman talent card ${employee.name}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11 border border-slate-200 shadow-sm">
          {employee.photoUrl && <AvatarImage src={employee.photoUrl} alt={employee.name} />}
          <AvatarFallback className="bg-emerald-50 text-sm font-semibold text-emerald-700">{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{employee.name}</p>
            <Badge variant="outline" className="hidden shrink-0 rounded-full border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-500 sm:inline-flex">
              {employee.employmentStatus || "Talent profile"}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">{employee.position || "Posisi belum tersedia"}</p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-600 xl:flex">
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{employee.directorate || "Belum diisi"}</span>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-600 xl:flex">
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{employee.division || "Belum diisi"}</span>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-600 xl:flex">
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{employee.department || "Belum diisi"}</span>
      </div>
      <div className="hidden items-center gap-2 text-sm text-slate-600 xl:flex">
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
        <span>{employee.lastPromotionDate ? formatDate(employee.lastPromotionDate) : "Belum diisi"}</span>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-14 text-xs text-slate-500 lg:hidden">
        <span className="inline-flex items-center gap-1.5">
        <Building2 className="h-3.5 w-3.5" /> {employee.directorate || "Belum diisi"} / {employee.division || "Belum diisi"} / {employee.department || "Belum diisi"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> {employee.email || "Belum diisi"}
        </span>
      </div>

      <span className="row-start-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-slate-950 xl:col-start-6 xl:row-auto">
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-slate-300 bg-white">
      <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"><UsersRound className="h-7 w-7" /></div>
        <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
