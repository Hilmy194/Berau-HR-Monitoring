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
  UserRound,
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
  const [department, setDepartment] = useState(ALL);
  const [position, setPosition] = useState(ALL);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((item) => item.department).filter(Boolean) as string[])).sort(),
    [employees]
  );
  const positions = useMemo(
    () => Array.from(new Set(employees.map((item) => item.position).filter(Boolean) as string[])).sort(),
    [employees]
  );
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    return employees.filter((employee) => {
      const matchesQuery = !keyword || [employee.name, employee.email, employee.nik, employee.department, employee.position]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(keyword));
      return matchesQuery
        && (department === ALL || employee.department === department)
        && (position === ALL || employee.position === position);
    });
  }, [department, employees, position, query]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-white/10 bg-slate-900/80 text-white shadow-[0_12px_40px_rgba(2,6,23,0.4)]">
        <div className="h-1 bg-gradient-to-r from-slate-700 via-primary to-emerald-300" />
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Direktori
              </p>
              <p className="mt-1 text-sm text-white/60">Cari dan saring data karyawan sebelum membuka halaman talent card.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
              Menampilkan <span className="font-semibold text-white">{filtered.length}</span> dari {employees.length}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, email, NIK, departemen..."
                className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/35"
              />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-white lg:w-auto">
                <SelectValue placeholder="Semua departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua departemen</SelectItem>
                {departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-white lg:w-auto">
                <SelectValue placeholder="Semua posisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua posisi</SelectItem>
                {positions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
        <Card className="overflow-hidden border-white/10 bg-slate-900/80 text-white shadow-[0_12px_40px_rgba(2,6,23,0.4)]">
          <div className="hidden grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_150px_150px_44px] gap-4 border-b border-white/10 bg-white/5 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 lg:grid">
            <span>Karyawan</span>
            <span>Departemen</span>
            <span>NIK</span>
            <span>Tanggal Bergabung</span>
            <span className="sr-only">Aksi</span>
          </div>
          <div className="divide-y divide-white/10">
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
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left outline-none transition-all hover:bg-primary hover:text-slate-950 focus-visible:bg-primary focus-visible:text-slate-950 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 lg:grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_150px_150px_44px]"
      aria-label={`Buka halaman talent card ${employee.name}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11 border border-white/10 shadow-sm">
          {employee.photoUrl && <AvatarImage src={employee.photoUrl} alt={employee.name} />}
          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary group-hover:bg-slate-950/10 group-hover:text-slate-950">{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-white group-hover:text-slate-950">{employee.name}</p>
            <Badge variant="outline" className="hidden shrink-0 rounded-full border-white/15 bg-white/5 text-[10px] text-white/70 group-hover:border-slate-950/15 group-hover:bg-slate-950/10 group-hover:text-slate-950 sm:inline-flex">
              {employee.employmentStatus || "Talent profile"}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-white/55 group-hover:text-slate-950/75">{employee.position || "Posisi belum tersedia"}</p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-sm text-white/70 group-hover:text-slate-950 lg:flex">
        <Building2 className="h-4 w-4 shrink-0 text-white/35 group-hover:text-slate-950/70" />
        <span className="truncate">{employee.department || "Belum diisi"}</span>
      </div>
      <div className="hidden items-center gap-2 text-sm text-white/70 group-hover:text-slate-950 lg:flex">
        <UserRound className="h-4 w-4 shrink-0 text-white/35 group-hover:text-slate-950/70" />
        <span>{employee.nik || "Belum diisi"}</span>
      </div>
      <div className="hidden items-center gap-2 text-sm text-white/70 group-hover:text-slate-950 lg:flex">
        <CalendarDays className="h-4 w-4 shrink-0 text-white/35 group-hover:text-slate-950/70" />
        <span>{employee.joinDate ? formatDate(employee.joinDate) : "Belum diisi"}</span>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-14 text-xs text-white/55 group-hover:text-slate-950/75 lg:hidden">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> {employee.department || "Belum diisi"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> {employee.email || "Belum diisi"}
        </span>
      </div>

      <span className="row-start-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/45 transition-all group-hover:border-slate-950/15 group-hover:bg-slate-950/10 group-hover:text-slate-950 lg:col-start-5 lg:row-auto">
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-white/10 bg-slate-900/70 text-white">
      <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"><UsersRound className="h-7 w-7" /></div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-white/60">{description}</p>
      </CardContent>
    </Card>
  );
}
