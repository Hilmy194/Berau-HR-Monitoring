"use client";

import { useMemo } from "react";
import { Check, Sparkles, Star, Trophy, Users } from "lucide-react";
import {
  BOX_12_DEFINITIONS,
  type Box12Definition,
} from "@/lib/services/talent-pool.service";
import { cn } from "@/lib/utils";

interface TalentPool12BoxGridProps {
  boxCounts: Record<number, number>;
  selectedBox: number | null;
  onSelectBox: (boxNumber: number | null) => void;
}

export function TalentPool12BoxGrid({
  boxCounts,
  selectedBox,
  onSelectBox,
}: TalentPool12BoxGridProps) {
  // Ordered matrix rows and columns
  // Row 1: Progression (> 2.33) -> [Box 10, Box 7, Box 3, Box 1]
  // Row 2: Grow (1.67 - 2.33)   -> [Box 11, Box 8, Box 4, Box 2]
  // Row 3: Stay (< 1.67)         -> [Box 12, Box 9, Box 6, Box 5]
  const matrixLayout: number[][] = [
    [10, 7, 3, 1],
    [11, 8, 4, 2],
    [12, 9, 6, 5],
  ];

  const rowHeaders = [
    { label: "Progression (High)", sub: "> 2.33" },
    { label: "Grow (Medium)", sub: "1.67 – 2.33" },
    { label: "Stay (Low)", sub: "< 1.67" },
  ];

  const colHeaders = [
    { label: "Low", sub: "< 3.0" },
    { label: "Medium", sub: "3.0 – 4.49" },
    { label: "High", sub: "4.5 – 5.49" },
    { label: "Very High (A, A+)", sub: "≥ 5.5" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header bar with legend badges */}
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              Matrix 12 Grids (People Review Method)
            </h3>
            {selectedBox !== null && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Box {selectedBox} Terpilih
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Klik pada salah satu kotak untuk memfilter daftar karyawan. Klik kembali atau tombol reset untuk menampilkan seluruh kandidat.
          </p>
        </div>

        {/* Legend / Group Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-900/15 px-2.5 py-1 font-bold text-blue-900 border border-blue-900/30">
            <Star className="h-3 w-3 text-blue-700" /> III. Global Talent (Box 1-2)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-600/15 px-2.5 py-1 font-bold text-sky-900 border border-sky-600/30">
            <Trophy className="h-3 w-3 text-sky-700" /> II. Top Talent (Box 3-4)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/15 px-2.5 py-1 font-bold text-emerald-900 border border-emerald-600/30">
            <Sparkles className="h-3 w-3 text-emerald-700" /> Reward High Performer (Box 5-6)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-lime-500/20 px-2.5 py-1 font-bold text-lime-950 border border-lime-500/40">
            <Users className="h-3 w-3 text-lime-700" /> I. Talent Pool (Box 7-8)
          </span>
          {selectedBox !== null && (
            <button
              onClick={() => onSelectBox(null)}
              className="ml-auto text-xs font-bold text-primary underline hover:text-primary/80"
            >
              Reset Filter Box
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Top Column Labels (Performance) */}
          <div className="mb-2 grid grid-cols-[130px_repeat(4,1fr)] gap-2.5 text-center">
            <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100 p-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span>Potential (Y) \</span>
              <span className="text-[10px] text-slate-500 font-normal">Performance (X)</span>
            </div>
            {colHeaders.map((col, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-lg p-2 text-center border",
                  idx === 3
                    ? "bg-blue-50/70 border-blue-200 text-blue-950 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 font-semibold"
                )}
              >
                <p className="text-xs">{col.label}</p>
                <p className="text-[10px] font-normal text-slate-500">{col.sub}</p>
              </div>
            ))}
          </div>

          {/* Matrix Rows (Potential) */}
          <div className="space-y-2.5">
            {matrixLayout.map((rowBoxes, rowIndex) => {
              const rowHeader = rowHeaders[rowIndex];
              return (
                <div
                  key={rowIndex}
                  className="grid grid-cols-[130px_repeat(4,1fr)] gap-2.5"
                >
                  {/* Left Row Label */}
                  <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {rowHeader.label}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      {rowHeader.sub}
                    </p>
                  </div>

                  {/* 4 Cells in Row */}
                  {rowBoxes.map((boxNum) => {
                    const box = BOX_12_DEFINITIONS[boxNum];
                    const count = boxCounts[boxNum] || 0;
                    const isSelected = selectedBox === boxNum;
                    const isDimmed = selectedBox !== null && !isSelected;
                    const isDarkText = box.styleText !== "#ffffff";

                    return (
                      <button
                        key={boxNum}
                        type="button"
                        onClick={() => onSelectBox(isSelected ? null : boxNum)}
                        style={{
                          background: box.styleBg,
                          color: box.styleText,
                          border: box.styleBorder,
                        }}
                        className={cn(
                          "group relative flex min-h-[112px] flex-col justify-between rounded-xl p-3 text-left transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:brightness-105",
                          isSelected && "ring-4 ring-offset-2 ring-primary scale-[1.02] shadow-xl z-10 brightness-110",
                          isDimmed && "opacity-35 grayscale-[25%] hover:opacity-85 hover:grayscale-0 hover:scale-[1.01]"
                        )}
                      >
                        {/* Box Number & Badge Group */}
                        <div className="flex items-start justify-between gap-1.5">
                          <span
                            style={{
                              backgroundColor: isDarkText ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 0, 0, 0.28)",
                              color: box.styleText,
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-black shadow-inner"
                          >
                            {box.boxNumber}
                          </span>

                          <span
                            style={{
                              backgroundColor: box.styleBadgeBg,
                              color: box.styleBadgeText,
                              border: isDarkText ? "1px solid rgba(0, 0, 0, 0.15)" : "1px solid rgba(255, 255, 255, 0.3)",
                            }}
                            className="rounded-full px-2.5 py-0.5 text-[10.5px] font-black shadow-sm transition-transform group-hover:scale-105"
                          >
                            {count} Orang
                          </span>
                        </div>

                        {/* Box Name & Details */}
                        <div className="mt-2.5">
                          <h4
                            style={{ color: box.styleText }}
                            className="text-xs font-black tracking-tight leading-tight drop-shadow-sm"
                          >
                            {box.name}
                          </h4>
                          <p
                            style={{ color: box.styleText }}
                            className="mt-0.5 text-[9.5px] font-medium opacity-90 leading-tight"
                          >
                            {box.group !== "Other" ? box.group : `${box.potentialLevel.split(" ")[0]} • ${box.performanceLevel}`}
                          </p>
                        </div>

                        {/* Active Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-950 shadow-md">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

