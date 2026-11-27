"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Sparkles,
  Users,
  Award,
  Layers,
  Search,
  BookOpen,
  CalendarRange,
  Info,
  Clock,
  DollarSign,
  Tag,
  Building2,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CADENCE_DEVELOPMENT_PROGRAMS,
  CADENCE_TRAININGS,
  ALL_CADENCE_ITEMS,
  getAgendaForDate,
  type CadenceScheduleItem,
  type CadenceCategory,
} from "@/lib/data/development-program-cadence";

// Daftar bulan periode People Capability 2027 Cadence (Nov 2026 s/d Des 2027)
const TIMELINE_MONTHS = [
  { key: "2026-11", label: "Nov 26", fullLabel: "November 2026", year: 2026, monthIndex: 10 },
  { key: "2026-12", label: "Dec 26", fullLabel: "Desember 2026", year: 2026, monthIndex: 11 },
  { key: "2027-01", label: "Jan 27", fullLabel: "Januari 2027", year: 2027, monthIndex: 0 },
  { key: "2027-02", label: "Feb 27", fullLabel: "Februari 2027", year: 2027, monthIndex: 1 },
  { key: "2027-03", label: "Mar 27", fullLabel: "Maret 2027", year: 2027, monthIndex: 2 },
  { key: "2027-04", label: "Apr 27", fullLabel: "April 2027", year: 2027, monthIndex: 3 },
  { key: "2027-05", label: "May 27", fullLabel: "Mei 2027", year: 2027, monthIndex: 4 },
  { key: "2027-06", label: "Jun 27", fullLabel: "Juni 2027", year: 2027, monthIndex: 5 },
  { key: "2027-07", label: "Jul 27", fullLabel: "Juli 2027", year: 2027, monthIndex: 6 },
  { key: "2027-08", label: "Aug 27", fullLabel: "Agustus 2027", year: 2027, monthIndex: 7 },
  { key: "2027-09", label: "Sep 27", fullLabel: "September 2027", year: 2027, monthIndex: 8 },
  { key: "2027-10", label: "Oct 27", fullLabel: "Oktober 2027", year: 2027, monthIndex: 9 },
  { key: "2027-11", label: "Nov 27", fullLabel: "November 2027", year: 2027, monthIndex: 10 },
  { key: "2027-12", label: "Dec 27", fullLabel: "Desember 2027", year: 2027, monthIndex: 11 },
];

const DAYS_OF_WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export interface DevelopmentProgramCalendarProps {
  initialItems?: CadenceScheduleItem[];
}

export function DevelopmentProgramCalendar({ initialItems }: DevelopmentProgramCalendarProps = {}) {
  const [viewMode, setViewMode] = useState<"CALENDAR" | "CADENCE_MATRIX">("CALENDAR");
  const [currentMonthKey, setCurrentMonthKey] = useState<string>("2026-11");
  const [selectedCategory, setSelectedCategory] = useState<CadenceCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>("2026-11-24");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Sumber data: Prioritaskan data dari database jika tersedia
  const allItems = useMemo(() => {
    return initialItems && initialItems.length > 0 ? initialItems : ALL_CADENCE_ITEMS;
  }, [initialItems]);

  const exclusiveDpItems = useMemo(() => allItems.filter((p) => p.category === "EXCLUSIVE_DP"), [allItems]);
  const inclusiveDpItems = useMemo(() => allItems.filter((p) => p.category === "INCLUSIVE_DP"), [allItems]);
  const eventProjectItems = useMemo(() => allItems.filter((p) => p.category === "EVENT_PROJECT"), [allItems]);
  const trainingItems = useMemo(() => allItems.filter((p) => p.category === "TRAINING_CATALOG"), [allItems]);

  // Bulan aktif saat ini
  const activeMonthInfo = useMemo(() => {
    return TIMELINE_MONTHS.find((m) => m.key === currentMonthKey) || TIMELINE_MONTHS[0];
  }, [currentMonthKey]);

  // Navigasi bulan
  const handlePrevMonth = () => {
    const idx = TIMELINE_MONTHS.findIndex((m) => m.key === currentMonthKey);
    if (idx > 0) {
      setCurrentMonthKey(TIMELINE_MONTHS[idx - 1].key);
    }
  };

  const handleNextMonth = () => {
    const idx = TIMELINE_MONTHS.findIndex((m) => m.key === currentMonthKey);
    if (idx < TIMELINE_MONTHS.length - 1) {
      setCurrentMonthKey(TIMELINE_MONTHS[idx + 1].key);
    }
  };

  // Filter agenda berdasarkan kategori & pencarian
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.targetAudience && item.targetAudience.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.vendorOrProvider && item.vendorOrProvider.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [allItems, selectedCategory, searchQuery]);

  // Generate struktur grid kalender bulanan
  const calendarDays = useMemo(() => {
    const { year, monthIndex } = activeMonthInfo;
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

    // Dapatkan hari dalam minggu untuk tanggal 1 (0: Minggu -> 6, 1: Senin -> 0, dst)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Minggu jadi kolom ke-7

    const totalDays = lastDayOfMonth.getDate();
    const days: Array<{
      dayNumber: number;
      dateIso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CadenceScheduleItem[];
    }> = [];

    // Hari dari bulan sebelumnya untuk padding
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonthYear = monthIndex === 0 ? year - 1 : year;
      const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
      const iso = `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: iso === "2026-11-24",
        events: [],
      });
    }

    // Hari dalam bulan aktif
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, "0");
      const monthStr = String(monthIndex + 1).padStart(2, "0");
      const iso = `${year}-${monthStr}-${dayStr}`;

      // Cari event yang aktif pada tanggal ini
      const matchingEvents = filteredItems.filter((item) => {
        return iso >= item.startIso && iso <= item.endIso;
      });

      days.push({
        dayNumber: day,
        dateIso: iso,
        isCurrentMonth: true,
        isToday: iso === "2026-11-24",
        events: matchingEvents,
      });
    }

    // Hari dari bulan berikutnya untuk mengisi grid 35 atau 42 kotak
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthYear = monthIndex === 11 ? year + 1 : year;
      const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
      const iso = `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dayNumber: i,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: iso === "2026-11-24",
        events: [],
      });
    }

    return days;
  }, [activeMonthInfo, filteredItems]);

  // Agenda untuk tanggal yang sedang dipilih
  const selectedAgenda = useMemo(() => {
    if (!selectedDateIso) return null;
    return getAgendaForDate(selectedDateIso, allItems);
  }, [selectedDateIso, allItems]);

  // Handle klik tanggal
  const handleDateClick = (iso: string) => {
    setSelectedDateIso(iso);
    setIsDetailOpen(true);
  };

  // Format tanggal bahasa Indonesia
  const formatIndoDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION & NAVIGATION TABS                                       */}
      {/* ========================================================================= */}
      <Card className="border-border/80 shadow-sm overflow-hidden bg-white">
        <div className="p-4 sm:p-5 border-b bg-gradient-to-r from-emerald-600/10 via-teal-50/50 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
                  <CalendarRange className="h-4 w-4" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  People Capability Cadence &amp; Training Calendar
                </h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  TechConnect GO WIN 2026 - 2027
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Visualisasi terpadu jadwal <strong>Development Program (Exclusive &amp; Inclusive DP)</strong>, <strong>Event &amp; Project</strong>, serta <strong>Katalog Pelatihan</strong> satu tahun ke depan. Klik tanggal untuk melihat agenda detail.
              </p>
            </div>

            {/* Mode Selector Buttons */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("CALENDAR")}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === "CALENDAR"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Kalender Bulanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("CADENCE_MATRIX")}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === "CADENCE_MATRIX"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Cadence Roadmap (Gantt)</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">Exclusive DP</span>
              <p className="text-sm sm:text-base font-black text-slate-900">{exclusiveDpItems.length} Batches</p>
              <span className="text-[10px] text-slate-500">ECDP, MDP, FMDP, ENDP, FADP</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Inclusive DP</span>
              <p className="text-sm sm:text-base font-black text-slate-900">
                {inclusiveDpItems.reduce((acc, curr) => acc + (curr.pax || 0), 0) || 580} Total Pax
              </p>
              <span className="text-[10px] text-slate-500">JNDP, SMDP, MMDP, EMDP</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">Katalog Training</span>
              <p className="text-sm sm:text-base font-black text-slate-900">{trainingItems.length} Sesi Terjadwal</p>
              <span className="text-[10px] text-slate-500">STEM &amp; Non-STEM (POP, POM, AAT, Spry)</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">Event &amp; Project</span>
              <p className="text-sm sm:text-base font-black text-slate-900">{eventProjectItems.length} Inisiatif Strategis</p>
              <span className="text-[10px] text-slate-500">MyLearning 3.0 &amp; Learning Day</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-b flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 text-[11px]">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            <Button
              variant={selectedCategory === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("ALL")}
              className="h-7 text-xs px-2.5"
            >
              Semua ({allItems.length})
            </Button>
            <Button
              variant={selectedCategory === "EXCLUSIVE_DP" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("EXCLUSIVE_DP")}
              className="h-7 text-xs px-2.5 border-purple-200 hover:border-purple-300"
            >
              Exclusive DP
            </Button>
            <Button
              variant={selectedCategory === "INCLUSIVE_DP" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("INCLUSIVE_DP")}
              className="h-7 text-xs px-2.5 border-emerald-200 hover:border-emerald-300"
            >
              Inclusive DP
            </Button>
            <Button
              variant={selectedCategory === "EVENT_PROJECT" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("EVENT_PROJECT")}
              className="h-7 text-xs px-2.5 border-amber-200 hover:border-amber-300"
            >
              Event &amp; Project
            </Button>
            <Button
              variant={selectedCategory === "TRAINING_CATALOG" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("TRAINING_CATALOG")}
              className="h-7 text-xs px-2.5 border-blue-200 hover:border-blue-300"
            >
              Training Katalog
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari program atau training..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: KALENDER BULANAN (DAY-BY-DAY INTERACTIVE)                         */}
        {/* ========================================================================= */}
        {viewMode === "CALENDAR" && (
          <div className="p-4 sm:p-5">
            {/* Month Navigator Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight min-w-[150px] text-center">
                  {activeMonthInfo.fullLabel}
                </h4>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Month Quick Select */}
              <div className="flex items-center gap-2">
                <select
                  value={currentMonthKey}
                  onChange={(e) => setCurrentMonthKey(e.target.value)}
                  className="h-8 text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TIMELINE_MONTHS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.fullLabel}
                    </option>
                  ))}
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentMonthKey("2026-11");
                    setSelectedDateIso("2026-11-24");
                    setIsDetailOpen(true);
                  }}
                  className="h-8 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                >
                  Hari Ini (24 Nov)
                </Button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] mb-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-500">Keterangan:</span>
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span> Exclusive DP
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Inclusive DP
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Training Katalog
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Event &amp; Project
              </span>
              <span className="ml-auto text-slate-400 italic">
                *Klik kotak tanggal untuk membuka rincian agenda
              </span>
            </div>

            {/* Calendar Grid 7 Columns */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b bg-slate-100/80 text-center text-xs font-bold text-slate-600">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div
                    key={day}
                    className={`py-2 border-r last:border-r-0 ${
                      idx >= 5 ? "bg-slate-200/50 text-slate-500" : ""
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 auto-rows-[minmax(95px,auto)] divide-x divide-y divide-slate-200">
                {calendarDays.map((cell, idx) => {
                  const isSelected = selectedDateIso === cell.dateIso;
                  const hasEvents = cell.events.length > 0;
                  const isWeekend = (idx % 7 === 5) || (idx % 7 === 6);

                  return (
                    <div
                      key={cell.dateIso + idx}
                      onClick={() => handleDateClick(cell.dateIso)}
                      className={`p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:bg-emerald-50/40 relative group ${
                        !cell.isCurrentMonth
                          ? "bg-slate-50/60 text-slate-400 opacity-60"
                          : isWeekend
                          ? "bg-slate-50/40"
                          : "bg-white"
                      } ${
                        isSelected
                          ? "ring-2 ring-emerald-500 bg-emerald-50/50 z-10"
                          : ""
                      }`}
                    >
                      {/* Top Header of Cell: Day Number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold inline-flex items-center justify-center h-5 w-5 rounded-full ${
                            cell.isToday
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : isSelected
                              ? "bg-emerald-100 text-emerald-800"
                              : "text-slate-700"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {hasEvents && (
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">
                            {cell.events.length} item
                          </span>
                        )}
                      </div>

                      {/* Event Badges List in Cell */}
                      <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                        {cell.events.slice(0, 2).map((ev) => {
                          const badgeColor =
                            ev.category === "EXCLUSIVE_DP"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : ev.category === "INCLUSIVE_DP"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ev.category === "EVENT_PROJECT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200";

                          return (
                            <div
                              key={ev.id}
                              className={`text-[9.5px] font-semibold truncate rounded px-1.5 py-0.5 border ${badgeColor} leading-tight`}
                              title={`${ev.name} (${ev.categoryLabel})`}
                            >
                              {ev.code ? `[${ev.code}] ` : ""}{ev.name}
                            </div>
                          );
                        })}

                        {cell.events.length > 2 && (
                          <div className="text-[9px] font-bold text-slate-500 pl-1">
                            +{cell.events.length - 2} lainnya...
                          </div>
                        )}
                      </div>

                      {/* Small Bottom Indicator Dot for Category */}
                      {hasEvents && (
                        <div className="flex items-center gap-1 pt-1 justify-end">
                          {cell.events.some((e) => e.category === "EXCLUSIVE_DP") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                          )}
                          {cell.events.some((e) => e.category === "INCLUSIVE_DP") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          )}
                          {cell.events.some((e) => e.category === "TRAINING_CATALOG") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                          )}
                          {cell.events.some((e) => e.category === "EVENT_PROJECT") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CADENCE ROADMAP (GANTT MATRIX TECHCONNECT GO WIN)                 */}
        {/* ========================================================================= */}
        {viewMode === "CADENCE_MATRIX" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Matriks Cadence People Capability 2026 - 2027 (TechConnect GO WIN)
              </span>
              <span>Geser tabel untuk melihat seluruh 14 bulan pelaksanaan</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                {/* Header Months */}
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold">
                    <th className="px-3 py-2.5 w-64 border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                      Development Program
                    </th>
                    <th className="px-2.5 py-2.5 w-24 text-center border-r border-slate-800">
                      Start Date
                    </th>
                    <th className="px-2.5 py-2.5 w-24 text-center border-r border-slate-800">
                      End Date
                    </th>
                    {TIMELINE_MONTHS.map((m) => (
                      <th
                        key={m.key}
                        className={`px-1 py-2 text-center text-[10px] uppercase font-bold border-r border-slate-800 ${
                          m.key === "2026-11" ? "bg-emerald-800 text-emerald-100" : ""
                        }`}
                      >
                        {m.label}
                      </th>
                    ))}
                    <th className="px-2.5 py-2.5 w-16 text-center">Pax*</th>
                  </tr>
                </thead>

                {/* Body Table */}
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* GROUP 1: EXCLUSIVE DP */}
                  <tr className="bg-purple-900 text-white font-bold text-xs">
                    <td colSpan={18} className="px-3 py-1.5">
                      Exclusive DP ({exclusiveDpItems.length} Program)
                    </td>
                  </tr>
                  {exclusiveDpItems.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedDateIso(p.startIso);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-purple-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-purple-50/40 z-10 flex items-center justify-between">
                        <span>{p.name}</span>
                        <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600" />
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.startDateDisplay}
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.endDateDisplay}
                      </td>
                      {TIMELINE_MONTHS.map((m) => {
                        const isActive = p.activeMonths.includes(m.key);
                        return (
                          <td
                            key={m.key}
                            className={`p-0.5 border-r border-slate-100 text-center ${
                              isActive ? "bg-cyan-100" : ""
                            }`}
                          >
                            {isActive && (
                              <div className="h-5 w-full rounded bg-cyan-400/80 shadow-2xs" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-2 text-center font-bold text-slate-800 font-mono">
                        {p.pax ?? "-"}
                      </td>
                    </tr>
                  ))}

                  {/* GROUP 2: INCLUSIVE DP */}
                  <tr className="bg-emerald-800 text-white font-bold text-xs">
                    <td colSpan={18} className="px-3 py-1.5">
                      Inclusive DP ({inclusiveDpItems.length} Program)
                    </td>
                  </tr>
                  {inclusiveDpItems.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedDateIso(p.startIso);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-emerald-50/40 z-10 flex items-center justify-between">
                        <span>{p.name}</span>
                        <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600" />
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.startDateDisplay}
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.endDateDisplay}
                      </td>
                      {TIMELINE_MONTHS.map((m) => {
                        const isActive = p.activeMonths.includes(m.key);
                        return (
                          <td
                            key={m.key}
                            className={`p-0.5 border-r border-slate-100 text-center ${
                              isActive ? "bg-cyan-100" : ""
                            }`}
                          >
                            {isActive && (
                              <div className="h-5 w-full rounded bg-cyan-400/80 shadow-2xs" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-2 text-center font-bold text-slate-800 font-mono">
                        {p.pax ?? "-"}
                      </td>
                    </tr>
                  ))}

                  {/* GROUP 3: EVENT & PROJECT */}
                  <tr className="bg-slate-800 text-white font-bold text-xs">
                    <td colSpan={18} className="px-3 py-1.5">
                      Event &amp; Project ({eventProjectItems.length} Inisiatif)
                    </td>
                  </tr>
                  {eventProjectItems.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedDateIso(p.startIso);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-amber-50/40 z-10 flex items-center justify-between">
                        <span>{p.name}</span>
                        <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-amber-600" />
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.startDateDisplay}
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.endDateDisplay}
                      </td>
                      {TIMELINE_MONTHS.map((m) => {
                        const isActive = p.activeMonths.includes(m.key);
                        return (
                          <td
                            key={m.key}
                            className={`p-0.5 border-r border-slate-100 text-center ${
                              isActive ? "bg-cyan-100" : ""
                            }`}
                          >
                            {isActive && (
                              <div className="h-5 w-full rounded bg-cyan-400/80 shadow-2xs" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-2 text-center text-xs text-slate-500 font-medium">
                        {p.remarks ? "Project" : "-"}
                      </td>
                    </tr>
                  ))}

                  {/* GROUP 4: TRAINING KATALOG BERAU COAL */}
                  <tr className="bg-blue-800 text-white font-bold text-xs">
                    <td colSpan={18} className="px-3 py-1.5 flex items-center justify-between">
                      <span>Jadwal Pelatihan (Katalog Training Berau Coal) ({trainingItems.length} Sesi)</span>
                      <span className="text-[10px] font-normal text-blue-200">STEM &amp; Non-STEM Courses</span>
                    </td>
                  </tr>
                  {trainingItems.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedDateIso(p.startIso);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 flex items-center justify-between">
                        <span className="truncate max-w-[200px]" title={p.name}>
                          {p.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 text-blue-700">
                          {p.stemType}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.startDateDisplay}
                      </td>
                      <td className="px-2.5 py-2 text-center text-[11px] text-slate-600 font-mono border-r border-slate-200">
                        {p.endDateDisplay}
                      </td>
                      {TIMELINE_MONTHS.map((m) => {
                        const isActive = p.activeMonths.includes(m.key);
                        return (
                          <td
                            key={m.key}
                            className={`p-0.5 border-r border-slate-100 text-center ${
                              isActive ? "bg-blue-100" : ""
                            }`}
                          >
                            {isActive && (
                              <div className="h-5 w-full rounded bg-blue-500/80 shadow-2xs" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-2 text-center font-bold text-slate-800 font-mono">
                        {p.pax ?? "20"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400 italic text-right">
              *) Jadwal dapat disesuaikan (The schedule is subject to change at any time) berdasarkan kesiapan komite suksesi dan kuota operasional site.
            </p>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 2. POPUP MODAL DETAIL AGENDA PER TANGGAL YANG DIKLIK                      */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
              <CalendarIcon className="h-4 w-4" />
              <span>Agenda Harian People Capability &amp; Training</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {selectedDateIso ? formatIndoDate(selectedDateIso) : "Detail Agenda"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Menampilkan seluruh program pengembangan dan pelatihan aktif pada tanggal ini.
            </DialogDescription>
          </DialogHeader>

          {/* Isi Agenda Hari Ini */}
          <div className="space-y-4 py-2">
            {selectedAgenda && selectedAgenda.totalEvents > 0 ? (
              <>
                {/* 1. SEKSI DEVELOPMENT PROGRAMS */}
                {selectedAgenda.developmentPrograms.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        Development Program ({selectedAgenda.developmentPrograms.length})
                      </span>
                      <Badge className="bg-purple-100 text-purple-800 text-[10px]">
                        Corporate Cadence
                      </Badge>
                    </h5>

                    <div className="space-y-2">
                      {selectedAgenda.developmentPrograms.map((dp) => (
                        <div
                          key={dp.id}
                          className="bg-white p-3.5 rounded-xl border border-purple-200/90 shadow-2xs space-y-2 hover:border-purple-400 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  className={
                                    dp.category === "EXCLUSIVE_DP"
                                      ? "bg-purple-600 text-white text-[10px]"
                                      : dp.category === "INCLUSIVE_DP"
                                      ? "bg-emerald-600 text-white text-[10px]"
                                      : "bg-amber-600 text-white text-[10px]"
                                  }
                                >
                                  {dp.categoryLabel}
                                </Badge>
                                <span className="font-bold text-sm text-slate-900">{dp.name}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Provider: <strong>{dp.vendorOrProvider}</strong>
                              </p>
                            </div>
                            {dp.pax && (
                              <Badge variant="outline" className="font-mono text-xs border-slate-300">
                                👥 {dp.pax} Pax
                              </Badge>
                            )}
                          </div>

                          {dp.description && (
                            <p className="text-xs text-slate-600 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                              {dp.description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                            <div>
                              <span className="text-slate-400">Periode Cadence:</span>{" "}
                              <strong className="text-slate-800">{dp.startDateDisplay} s/d {dp.endDateDisplay}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Sasaran Peserta:</span>{" "}
                              <span className="text-slate-700 font-medium">{dp.targetAudience}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SEKSI PELATIHAN DARI KATALOG */}
                {selectedAgenda.trainings.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        Pelatihan / Training Terjadwal ({selectedAgenda.trainings.length})
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">
                        Katalog Training Berau Coal
                      </Badge>
                    </h5>

                    <div className="space-y-2">
                      {selectedAgenda.trainings.map((trn) => (
                        <div
                          key={trn.id}
                          className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-2 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-blue-600 text-white text-[10px]">
                                  {trn.stemType}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-slate-600">
                                  {trn.trainingType}
                                </Badge>
                                <span className="font-bold text-sm text-slate-900">{trn.name}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Lembaga / Vendor: <strong>{trn.vendorOrProvider}</strong>
                              </p>
                            </div>
                            {trn.estimatedCost && (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Total Biaya</span>
                                <span className="font-bold text-xs text-emerald-700">
                                  Rp {trn.estimatedCost.toLocaleString("id-ID")}
                                </span>
                              </div>
                            )}
                          </div>

                          {trn.description && (
                            <p className="text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                              {trn.description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                            <div>
                              <span className="text-slate-400">Jadwal Sesi:</span>{" "}
                              <strong className="text-slate-800">{trn.startDateDisplay}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Kode Budget / WBS:</span>{" "}
                              <span className="font-mono text-slate-800 font-bold">{trn.budgetCode}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Target Karyawan:</span>{" "}
                              <span className="text-slate-700 font-medium">{trn.targetAudience}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-700 hover:text-blue-800">
                              <Link href="/trainings">
                                <span>Ajukan Training Ini (POV Karyawan)</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Tidak Ada Jadwal Pelatihan atau Development Program
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Pada tanggal {selectedDateIso ? formatIndoDate(selectedDateIso) : ""} tidak ada sesi yang dijadwalkan. Silakan klik tanggal lain yang memiliki penanda warna pada kalender.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
