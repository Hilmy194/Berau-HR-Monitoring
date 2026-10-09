"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Layers,
  Mail,
  MessageSquareText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserCheck,
  UsersRound,
} from "lucide-react";
import type { TalentMonitoringEmployeeItem } from "@/lib/services/talent-monitoring.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIRECTORATES } from "@/lib/constants";
import { formatDate, getInitials } from "@/lib/utils";

const ALL = "__all__";
const COMPLETE = "complete";
const INCOMPLETE = "incomplete";
const ASPIRATION_MISSING = "aspiration_missing";
const REVIEW_MISSING = "review_missing";

export function TalentMonitoringDirectory({ employees }: { employees: TalentMonitoringEmployeeItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState(ALL);
  const [directorate, setDirectorate] = useState(ALL);
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [completion, setCompletion] = useState(ALL);

  const directorates = useMemo(
    () => Array.from(new Set([...DIRECTORATES, ...(employees.map((item) => item.directorate).filter(Boolean) as string[])])).sort(),
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

  const scoped = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    return employees.filter((employee) => {
      const matchesQuery = !keyword || [
        employee.name,
        employee.email,
        employee.directorate,
        employee.division,
        employee.department,
        employee.position,
        employee.supervisor,
        employee.golongan,
        employee.tier,
      ].some((value) => value?.toLocaleLowerCase("id-ID").includes(keyword));

      return matchesQuery
        && (tierFilter === ALL || employee.tier === tierFilter)
        && (directorate === ALL || employee.directorate === directorate)
        && (division === ALL || employee.division === division)
        && (department === ALL || employee.department === department);
    });
  }, [department, directorate, division, employees, query, tierFilter]);

  const filtered = useMemo(() => scoped.filter((employee) => {
    const reviewComplete = isReviewComplete(employee);
    const allComplete = employee.aspirationCompleted && reviewComplete;
    if (completion === COMPLETE) return allComplete;
    if (completion === INCOMPLETE) return !allComplete;
    if (completion === ASPIRATION_MISSING) return !employee.aspirationCompleted;
    if (completion === REVIEW_MISSING) return !reviewComplete;
    return true;
  }), [completion, scoped]);

  const tier1Count = useMemo(() => scoped.filter((e) => e.tier === "Tier 1").length, [scoped]);
  const tier2Count = useMemo(() => scoped.filter((e) => e.tier === "Tier 2").length, [scoped]);

  const monitoring = useMemo(() => ({
    aspiration: scoped.filter((employee) => employee.aspirationCompleted).length,
    strength: scoped.filter((employee) => employee.strengthCompleted).length,
    weakness: scoped.filter((employee) => employee.weaknessCompleted).length,
    comment: scoped.filter((employee) => employee.commentCompleted).length,
    review: scoped.filter(isReviewComplete).length,
    complete: scoped.filter((employee) => employee.aspirationCompleted && isReviewComplete(employee)).length,
  }), [scoped]);
  const followUp = scoped.length - monitoring.complete;

  return (
    <div className="space-y-5">
      <section aria-labelledby="monitoring-title" className="space-y-3">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Tier 1 & Tier 2 Talent Retention List
            </p>
            <h3 id="monitoring-title" className="mt-1 text-xl font-bold text-slate-950">Monitoring Talent Retention</h3>
          </div>
          <p className="text-xs text-slate-500">Menampilkan data kandidat kunci retensi talenta Berau Coal.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MonitoringCard
            icon={UsersRound}
            label="Karyawan dipantau"
            value={scoped.length}
            total={employees.length}
            description={`Tier 1: ${tier1Count} orang · Tier 2: ${tier2Count} orang`}
            tone="slate"
          />
          <MonitoringCard
            icon={Target}
            label="Aspiration terisi"
            value={monitoring.aspiration}
            total={scoped.length}
            description={`${scoped.length - monitoring.aspiration} belum mengisi aspiration`}
            tone="blue"
          />
          <MonitoringCard
            icon={MessageSquareText}
            label="People Review lengkap"
            value={monitoring.review}
            total={scoped.length}
            description={`Strength ${monitoring.strength} · Weakness ${monitoring.weakness} · Comment ${monitoring.comment}`}
            tone="emerald"
          />
          <MonitoringCard
            icon={AlertCircle}
            label="Perlu ditindaklanjuti"
            value={followUp}
            total={scoped.length}
            description="Aspiration atau People Review belum lengkap"
            tone="amber"
          />
        </div>
      </section>

      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-700 via-primary to-emerald-300" />
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Talent Retention
              </p>
              <p className="mt-1 text-sm text-slate-500">Saring berdasarkan Tier retensi, departemen, atau status kelengkapan data.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-slate-900">{filtered.length}</span> dari {employees.length}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(240px,1.4fr)_140px_1fr_1fr_1fr_1.1fr]">
            <div className="relative md:col-span-2 lg:col-span-1 2xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, posisi, supervisor, golongan..."
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="h-11 min-w-[130px] rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs sm:text-sm font-medium text-slate-900">
                <SelectValue placeholder="Semua Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua Tier</SelectItem>
                <SelectItem value="Tier 1">👑 Tier 1</SelectItem>
                <SelectItem value="Tier 2">⭐ Tier 2</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directorate} onValueChange={(value) => {
              setDirectorate(value);
              setDivision(ALL);
              setDepartment(ALL);
            }}>
              <SelectTrigger className="h-11 min-w-[160px] rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs sm:text-sm text-slate-900">
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
              <SelectTrigger className="h-11 min-w-[160px] rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs sm:text-sm text-slate-900">
                <SelectValue placeholder="Semua divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua divisi</SelectItem>
                {divisions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-11 min-w-[170px] rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs sm:text-sm text-slate-900">
                <SelectValue placeholder="Semua departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua departemen</SelectItem>
                {departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={completion} onValueChange={setCompletion}>
              <SelectTrigger className="h-11 min-w-[175px] rounded-xl border-slate-200 bg-slate-50/70 px-3 text-xs sm:text-sm text-slate-900">
                <SelectValue placeholder="Semua status data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua status data</SelectItem>
                <SelectItem value={COMPLETE}>Data lengkap</SelectItem>
                <SelectItem value={INCOMPLETE}>Perlu ditindaklanjuti</SelectItem>
                <SelectItem value={ASPIRATION_MISSING}>Aspiration belum diisi</SelectItem>
                <SelectItem value={REVIEW_MISSING}>People Review belum lengkap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {employees.length === 0 ? (
        <EmptyState title="Belum ada data retention list" description="Daftar karyawan retention belum dapat dimuat." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Karyawan tidak ditemukan" description="Coba ubah kata kunci atau filter yang digunakan." />
      ) : (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="w-full">
            <div className="hidden w-full grid-cols-[minmax(220px,1.8fr)_95px_minmax(180px,1.4fr)_minmax(140px,1fr)_105px_125px_100px_36px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 xl:grid">
              <span>Karyawan &amp; Posisi</span>
              <span>Tier / Gol</span>
              <span>Organisasi</span>
              <span>Supervisor</span>
              <span>Aspiration</span>
              <span>People Review</span>
              <span>Kelengkapan</span>
              <span className="sr-only">Aksi</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map((employee) => (
                <TalentMonitoringRow
                  key={employee.uniqueKey}
                  employee={employee}
                  onOpen={() => {
                    if (!employee.id.startsWith("ret-")) {
                      router.push(`/admin/employee-management/${employee.id}`);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function TalentMonitoringRow({
  employee,
  onOpen,
}: {
  employee: TalentMonitoringEmployeeItem;
  onOpen: () => void;
}) {
  const reviewFields = [employee.strengthCompleted, employee.weaknessCompleted, employee.commentCompleted];
  const reviewCount = reviewFields.filter(Boolean).length;
  const completedFields = reviewCount + Number(employee.aspirationCompleted);
  const isClickable = !employee.id.startsWith("ret-");

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!isClickable}
      className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left outline-none transition-all sm:px-5 xl:grid-cols-[minmax(220px,1.8fr)_95px_minmax(180px,1.4fr)_minmax(140px,1fr)_105px_125px_100px_36px] ${
        isClickable ? "hover:bg-emerald-50/70 focus-visible:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary cursor-pointer" : "cursor-default"
      }`}
      aria-label={`Buka halaman talent card ${employee.name}`}
    >
      {/* Karyawan & Title */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="h-9 w-9 shrink-0 border border-slate-200 shadow-sm">
          {employee.photoUrl && <AvatarImage src={employee.photoUrl} alt={employee.name} />}
          <AvatarFallback className={employee.tier === "Tier 1" ? "bg-amber-100 text-xs font-semibold text-amber-900" : "bg-emerald-50 text-xs font-semibold text-emerald-700"}>
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">{employee.name}</p>
          <p className="truncate text-[11px] text-slate-500 font-medium">{employee.position || "Posisi belum tersedia"}</p>
        </div>
      </div>

      {/* Tier & Golongan */}
      <div className="hidden min-w-0 flex-col gap-0.5 xl:flex">
        <Badge
          variant="outline"
          className={
            employee.tier === "Tier 1"
              ? "w-fit rounded-full border-amber-300 bg-amber-50 px-2 py-0 text-[10px] font-bold text-amber-800"
              : "w-fit rounded-full border-blue-200 bg-blue-50 px-2 py-0 text-[10px] font-semibold text-blue-700"
          }
        >
          {employee.tier === "Tier 1" ? "👑 Tier 1" : "⭐ Tier 2"}
        </Badge>
        {employee.golongan && (
          <span className="text-[10px] text-slate-500">Gol: <strong className="text-slate-700">{employee.golongan}</strong></span>
        )}
      </div>

      {/* Organisasi (Direktorat / Divisi / Dept) */}
      <div className="hidden min-w-0 flex-col gap-0.5 xl:flex">
        <p className="truncate text-xs font-medium text-slate-800" title={employee.directorate || ""}>
          {employee.directorate || "-"}
        </p>
        <p className="truncate text-[10px] text-slate-500" title={`${employee.division || "-"} · ${employee.department || "-"}`}>
          {employee.division ? `${employee.division}` : ""}{employee.department ? ` · ${employee.department}` : ""}
        </p>
      </div>

      {/* Supervisor */}
      <div className="hidden min-w-0 flex-col xl:flex">
        <p className="truncate text-xs font-medium text-slate-700" title={employee.supervisor || "-"}>
          {employee.supervisor || "-"}
        </p>
        <span className="text-[10px] text-slate-400">Direct supervisor</span>
      </div>

      {/* Aspiration */}
      <div className="hidden xl:block">
        <StatusBadge complete={employee.aspirationCompleted} completeLabel="Terisi" incompleteLabel="Belum" />
      </div>

      {/* People Review */}
      <div className="hidden xl:block">
        <StatusBadge complete={reviewCount === 3} completeLabel="Lengkap (3/3)" incompleteLabel={`${reviewCount}/3 terisi`} />
        <p className="mt-0.5 text-[9px] text-slate-400">
          S {mark(employee.strengthCompleted)} · W {mark(employee.weaknessCompleted)} · C {mark(employee.commentCompleted)}
        </p>
      </div>

      {/* Kelengkapan Progress */}
      <div className="hidden xl:block">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-slate-700">{completedFields}/4</span>
          <span className="text-slate-400">{Math.round((completedFields / 4) * 100)}%</span>
        </div>
        <Progress value={(completedFields / 4) * 100} className="mt-1 h-1 bg-slate-100" />
      </div>

      {/* Mobile Responsive Details */}
      <div className="col-span-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-11 text-[11px] text-slate-500 xl:hidden">
        <Badge
          variant="outline"
          className={
            employee.tier === "Tier 1"
              ? "rounded-full border-amber-300 bg-amber-50 px-2 py-0 text-[10px] font-bold text-amber-800"
              : "rounded-full border-blue-200 bg-blue-50 px-2 py-0 text-[10px] font-semibold text-blue-700"
          }
        >
          {employee.tier} {employee.golongan ? `(${employee.golongan})` : ""}
        </Badge>
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" /> {employee.directorate || "-"} / {employee.department || "-"}
        </span>
        {employee.supervisor && (
          <span className="text-slate-600">Spv: {employee.supervisor}</span>
        )}
        <StatusBadge complete={employee.aspirationCompleted} completeLabel="Aspiration" incompleteLabel="Aspiration (-)" />
        <StatusBadge complete={reviewCount === 3} completeLabel="Review (3/3)" incompleteLabel={`Review (${reviewCount}/3)`} />
      </div>

      {/* Arrow Action */}
      <span className={`row-start-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all xl:col-start-8 xl:row-auto ${
        isClickable ? "group-hover:border-primary group-hover:bg-primary group-hover:text-slate-950" : "opacity-30"
      }`}>
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function MonitoringCard({
  icon: Icon,
  label,
  value,
  total,
  description,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  total: number;
  description: string;
  tone: "slate" | "blue" | "emerald" | "amber";
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {value}
              <span className="ml-1 text-sm font-medium text-slate-400">/{total}</span>
            </p>
          </div>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={percentage} className="h-1.5 flex-1 bg-slate-100" />
          <span className="text-xs font-semibold text-slate-600">{percentage}%</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  complete,
  completeLabel,
  incompleteLabel,
}: {
  complete: boolean;
  completeLabel: string;
  incompleteLabel: string;
}) {
  return (
    <span
      className={
        complete
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
      }
    >
      {complete ? <CheckCircle2 className="h-3 w-3" /> : <ClipboardCheck className="h-3 w-3" />}
      {complete ? completeLabel : incompleteLabel}
    </span>
  );
}

function isReviewComplete(employee: TalentMonitoringEmployeeItem) {
  return employee.strengthCompleted && employee.weaknessCompleted && employee.commentCompleted;
}

function mark(complete: boolean) {
  return complete ? "✓" : "–";
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-slate-300 bg-white">
      <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <UsersRound className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
