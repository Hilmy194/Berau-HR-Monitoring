"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, Users, User, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TableShell } from "@/components/admin/hr-module-ui";
import type { DemographicsEmployeeRow } from "@/lib/services/dashboard-analytics.service";

interface DemographicsTableClientProps {
  rows: DemographicsEmployeeRow[];
}

export function DemographicsTableClient({ rows }: DemographicsTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirectorate, setSelectedDirectorate] = useState("ALL");
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique filter options
  const directorates = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.directorate).filter(Boolean))).sort();
  }, [rows]);

  const statuses = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.employmentStatus).filter(Boolean))).sort();
  }, [rows]);

  // Filter logic
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (selectedDirectorate !== "ALL" && row.directorate !== selectedDirectorate) return false;
      if (selectedGender !== "ALL" && row.gender !== selectedGender) return false;
      if (selectedAgeGroup !== "ALL" && row.ageGroup !== selectedAgeGroup) return false;
      if (selectedStatus !== "ALL" && row.employmentStatus !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = row.name.toLowerCase().includes(q);
        const matchNik = row.employeeId.toLowerCase().includes(q);
        const matchPos = row.position.toLowerCase().includes(q);
        const matchDept = row.department.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchPos && !matchDept) return false;
      }

      return true;
    });
  }, [rows, selectedDirectorate, selectedGender, selectedAgeGroup, selectedStatus, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDirectorate("ALL");
    setSelectedGender("ALL");
    setSelectedAgeGroup("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Daftar Karyawan &amp; Data Demografi
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Pencarian dan pemantauan profil seluruh karyawan dengan filter interaktif
            </CardDescription>
          </div>
          <Badge variant="outline" className="h-7 px-3 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 self-start sm:self-auto">
            {filteredRows.length} dari {rows.length} Karyawan
          </Badge>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 pt-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama, NIK, jabatan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 text-xs h-9 bg-slate-50 border-slate-200"
            />
          </div>

          {/* Directorate filter */}
          <div>
            <select
              value={selectedDirectorate}
              onChange={(e) => {
                setSelectedDirectorate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Direktorat</option>
              {directorates.map((dir) => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>
          </div>

          {/* Gender filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Age Group filter */}
          <div>
            <select
              value={selectedAgeGroup}
              onChange={(e) => {
                setSelectedAgeGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Umur</option>
              <option value="< 25">&lt; 25 Tahun</option>
              <option value="25 - 34">25 - 34 Tahun</option>
              <option value="35 - 44">35 - 44 Tahun</option>
              <option value="45 - 54">45 - 54 Tahun</option>
              <option value="55+">55+ Tahun</option>
            </select>
          </div>

          {/* Status filter & Reset */}
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 flex-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              title="Reset Filter"
              className="h-9 px-2.5 text-slate-600 hover:text-slate-900 border-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <TableShell>
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-left uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-semibold">NIK &amp; Karyawan</th>
                <th className="p-3.5 font-semibold">Gender</th>
                <th className="p-3.5 font-semibold">Umur / Kohort</th>
                <th className="p-3.5 font-semibold">Posisi &amp; Level</th>
                <th className="p-3.5 font-semibold">Departemen &amp; Direktorat</th>
                <th className="p-3.5 font-semibold">Status Kerja</th>
                <th className="p-3.5 font-semibold">Masa Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada karyawan yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.profileId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-medium">
                      <Link
                        href={`/admin/employee-management/${row.employeeId}`}
                        className="text-slate-900 hover:text-emerald-700 hover:underline font-semibold block"
                      >
                        {row.name}
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-mono">NIK: {row.employeeId}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.gender === "Perempuan"
                            ? "bg-pink-50 text-pink-700 border border-pink-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <User className="h-3 w-3" />
                        {row.gender}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{row.age} Tahun</p>
                      <p className="text-[10px] text-muted-foreground">{row.generation}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]" title={row.position}>
                        {row.position}
                      </p>
                      <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 font-medium">
                        {row.level}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <p className="text-slate-800 truncate max-w-[200px]" title={row.department}>
                        {row.department}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={row.directorate}>
                        {row.directorate}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          row.employmentStatus === "Permanent"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.employmentStatus === "Contract"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {row.employmentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {row.yearsOfService} Thn
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-muted-foreground">
          <span>
            Halaman {currentPage} dari {totalPages} ({filteredRows.length} data)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
