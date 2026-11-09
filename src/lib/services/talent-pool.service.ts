import { prisma } from "@/lib/prisma";
import { isTalentRetentionName } from "@/lib/data/talent-retention-list";

export type Box12Id =
  | "box_1"
  | "box_2"
  | "box_3"
  | "box_4"
  | "box_5"
  | "box_6"
  | "box_7"
  | "box_8"
  | "box_9"
  | "box_10"
  | "box_11"
  | "box_12";

export interface Box12Definition {
  boxNumber: number;
  id: Box12Id;
  name: string;
  potentialLevel: "Progression (High)" | "Grow (Medium)" | "Stay (Low)";
  potentialRange: string;
  performanceLevel: "Very High" | "High" | "Medium" | "Low";
  performanceRange: string;
  group: "Global Talent" | "Top Talent" | "Talent Pool" | "Reward High Performer" | "Other";
  row: 1 | 2 | 3; // 1 = Progression, 2 = Grow, 3 = Stay
  col: 1 | 2 | 3 | 4; // 1 = Low, 2 = Medium, 3 = High, 4 = Very High
  badgeColor: string;
  bgGradient: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

export const BOX_12_DEFINITIONS: Record<number, Box12Definition> = {
  1: {
    boxNumber: 1,
    id: "box_1",
    name: "STAR Leaders",
    potentialLevel: "Progression (High)",
    potentialRange: "> 2.33",
    performanceLevel: "Very High",
    performanceRange: "≥ 5.5",
    group: "Global Talent",
    row: 1,
    col: 4,
    badgeColor: "#1e3a8a",
    bgGradient: "bg-gradient-to-br from-blue-900 to-indigo-950 text-white",
    borderClass: "border-blue-600/60 ring-2 ring-blue-500/30",
    textClass: "text-white",
    badgeClass: "bg-blue-800 text-blue-100 border border-blue-600",
  },
  2: {
    boxNumber: 2,
    id: "box_2",
    name: "Future Leaders",
    potentialLevel: "Grow (Medium)",
    potentialRange: "1.67 – 2.33",
    performanceLevel: "Very High",
    performanceRange: "≥ 5.5",
    group: "Global Talent",
    row: 2,
    col: 4,
    badgeColor: "#1e40af",
    bgGradient: "bg-gradient-to-br from-blue-800 to-indigo-900 text-white",
    borderClass: "border-blue-500/60 ring-2 ring-blue-400/30",
    textClass: "text-white",
    badgeClass: "bg-blue-700 text-blue-100 border border-blue-500",
  },
  3: {
    boxNumber: 3,
    id: "box_3",
    name: "Emerging Leaders",
    potentialLevel: "Progression (High)",
    potentialRange: "> 2.33",
    performanceLevel: "High",
    performanceRange: "4.5 – 5.49",
    group: "Top Talent",
    row: 1,
    col: 3,
    badgeColor: "#0284c7",
    bgGradient: "bg-gradient-to-br from-sky-600 to-cyan-700 text-white",
    borderClass: "border-sky-400/50",
    textClass: "text-white",
    badgeClass: "bg-sky-500 text-white border border-sky-300/40",
  },
  4: {
    boxNumber: 4,
    id: "box_4",
    name: "Growing Talent",
    potentialLevel: "Grow (Medium)",
    potentialRange: "1.67 – 2.33",
    performanceLevel: "High",
    performanceRange: "4.5 – 5.49",
    group: "Top Talent",
    row: 2,
    col: 3,
    badgeColor: "#0ea5e9",
    bgGradient: "bg-gradient-to-br from-sky-500 to-cyan-600 text-white",
    borderClass: "border-sky-300/50",
    textClass: "text-white",
    badgeClass: "bg-sky-400 text-slate-900 border border-sky-200/50",
  },
  5: {
    boxNumber: 5,
    id: "box_5",
    name: "Experts",
    potentialLevel: "Stay (Low)",
    potentialRange: "< 1.67",
    performanceLevel: "Very High",
    performanceRange: "≥ 5.5",
    group: "Reward High Performer",
    row: 3,
    col: 4,
    badgeColor: "#15803d",
    bgGradient: "bg-gradient-to-br from-emerald-700 to-green-800 text-white",
    borderClass: "border-emerald-500/50",
    textClass: "text-white",
    badgeClass: "bg-emerald-600 text-emerald-100 border border-emerald-400",
  },
  6: {
    boxNumber: 6,
    id: "box_6",
    name: "Solid Contributor",
    potentialLevel: "Stay (Low)",
    potentialRange: "< 1.67",
    performanceLevel: "High",
    performanceRange: "4.5 – 5.49",
    group: "Reward High Performer",
    row: 3,
    col: 3,
    badgeColor: "#22c55e",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-green-600 text-white",
    borderClass: "border-emerald-400/50",
    textClass: "text-white",
    badgeClass: "bg-emerald-400 text-emerald-950 border border-emerald-200",
  },
  7: {
    boxNumber: 7,
    id: "box_7",
    name: "Diamond in the Rough",
    potentialLevel: "Progression (High)",
    potentialRange: "> 2.33",
    performanceLevel: "Medium",
    performanceRange: "3 – 4.49",
    group: "Talent Pool",
    row: 1,
    col: 2,
    badgeColor: "#84cc16",
    bgGradient: "bg-gradient-to-br from-lime-500 to-emerald-600 text-slate-950",
    borderClass: "border-lime-400/60",
    textClass: "text-slate-950",
    badgeClass: "bg-lime-300 text-slate-950 border border-lime-500/50",
  },
  8: {
    boxNumber: 8,
    id: "box_8",
    name: "Steady Performer",
    potentialLevel: "Grow (Medium)",
    potentialRange: "1.67 – 2.33",
    performanceLevel: "Medium",
    performanceRange: "3 – 4.49",
    group: "Talent Pool",
    row: 2,
    col: 2,
    badgeColor: "#a3e635",
    bgGradient: "bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950",
    borderClass: "border-lime-300/60",
    textClass: "text-slate-950",
    badgeClass: "bg-lime-200 text-slate-950 border border-lime-400/50",
  },
  9: {
    boxNumber: 9,
    id: "box_9",
    name: "Average Workers",
    potentialLevel: "Stay (Low)",
    potentialRange: "< 1.67",
    performanceLevel: "Medium",
    performanceRange: "3 – 4.49",
    group: "Other",
    row: 3,
    col: 2,
    badgeColor: "#bef264",
    bgGradient: "bg-gradient-to-br from-lime-300 to-green-400 text-slate-950",
    borderClass: "border-lime-200/70",
    textClass: "text-slate-950",
    badgeClass: "bg-lime-100 text-slate-950 border border-lime-300",
  },
  10: {
    boxNumber: 10,
    id: "box_10",
    name: "Underutilized / Misplaced",
    potentialLevel: "Progression (High)",
    potentialRange: "> 2.33",
    performanceLevel: "Low",
    performanceRange: "< 3",
    group: "Other",
    row: 1,
    col: 1,
    badgeColor: "#f59e0b",
    bgGradient: "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950",
    borderClass: "border-amber-300/70",
    textClass: "text-slate-950",
    badgeClass: "bg-amber-100 text-amber-950 border border-amber-300",
  },
  11: {
    boxNumber: 11,
    id: "box_11",
    name: "Strugglers",
    potentialLevel: "Grow (Medium)",
    potentialRange: "1.67 – 2.33",
    performanceLevel: "Low",
    performanceRange: "< 3",
    group: "Other",
    row: 2,
    col: 1,
    badgeColor: "#f59e0b",
    bgGradient: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    borderClass: "border-amber-400/60",
    textClass: "text-white",
    badgeClass: "bg-amber-200 text-amber-950 border border-amber-400",
  },
  12: {
    boxNumber: 12,
    id: "box_12",
    name: "Misfits",
    potentialLevel: "Stay (Low)",
    potentialRange: "< 1.67",
    performanceLevel: "Low",
    performanceRange: "< 3",
    group: "Other",
    row: 3,
    col: 1,
    badgeColor: "#dc2626",
    bgGradient: "bg-gradient-to-br from-red-600 to-rose-700 text-white",
    borderClass: "border-red-500/60 ring-1 ring-red-400/30",
    textClass: "text-white",
    badgeClass: "bg-red-800 text-red-100 border border-red-500",
  },
};

/**
 * Resolves raw text from BigQuery talent_class_12_box into canonical Box12Definition.
 */
export function resolveBox12(rawClass?: string | null): Box12Definition | null {
  if (!rawClass) return null;
  const normalized = rawClass.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized.includes("starleader")) return BOX_12_DEFINITIONS[1];
  if (normalized.includes("futureleader")) return BOX_12_DEFINITIONS[2];
  if (normalized.includes("emergingleader")) return BOX_12_DEFINITIONS[3];
  if (normalized.includes("growingtalent")) return BOX_12_DEFINITIONS[4];
  if (normalized.includes("expert")) return BOX_12_DEFINITIONS[5];
  if (normalized.includes("solidcontributor")) return BOX_12_DEFINITIONS[6];
  if (normalized.includes("diamondintherough")) return BOX_12_DEFINITIONS[7];
  if (normalized.includes("steadyperformer")) return BOX_12_DEFINITIONS[8];
  if (normalized.includes("averageworker")) return BOX_12_DEFINITIONS[9];
  if (normalized.includes("underutilised") || normalized.includes("underutilized") || normalized.includes("misplaced")) return BOX_12_DEFINITIONS[10];
  if (normalized.includes("struggler")) return BOX_12_DEFINITIONS[11];
  if (normalized.includes("misfit")) return BOX_12_DEFINITIONS[12];

  return null;
}

export interface TalentPoolCandidate {
  personnelNumber: string;
  name: string;
  position: string;
  jobLevel: string;
  businessUnit: string;
  directorate: string;
  division: string;
  department: string;
  performanceCategory: string;
  potentialCategory: string;
  talentClass12Box: string;
  box: Box12Definition | null;
  boxNumber: number | null;
  pat2025: string | null;
  pat2024: string | null;
  pat2023: string | null;
  iqScore: number | null;
  iqCategory: string | null;
  disc: string | null;
  discCategory: string | null;
  matchupResult: number | null;
  isTalentRetention: boolean;
}

export interface TalentPoolSummary {
  totalCandidates: number;
  totalInRetention: number;
  totalOutsideRetention: number;
  totalTopTalent: number;
  totalGlobalTalent: number;
  totalTalentPool: number;
  totalRewardHighPerformer: number;
  boxCounts: Record<number, number>;
}

export interface TalentPoolData {
  year: number;
  summary: TalentPoolSummary;
  candidates: TalentPoolCandidate[];
}

export async function listTalentPoolCandidates(targetYear: number = 2026): Promise<TalentPoolData> {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      btrim(p.personnel_number) AS personnel_number,
      btrim(p.employee_name) AS employee_name,
      btrim(COALESCE(e.position_name, p.position_name, '-')) AS position_name,
      btrim(COALESCE(e.ps_level, '-')) AS ps_level,
      btrim(COALESCE(p.business_unit, '-')) AS business_unit,
      btrim(COALESCE(NULLIF(e.direktorat, '-'), p.business_unit, '-')) AS direktorat,
      btrim(COALESCE(e.divisi, '-')) AS divisi,
      btrim(COALESCE(e.department, '-')) AS department,
      btrim(COALESCE(p.performance_category, '-')) AS performance_category,
      btrim(COALESCE(p.potential_grow_category, '-')) AS potential_grow_category,
      btrim(COALESCE(p.talent_class_12_box, '-')) AS talent_class_12_box,
      p.pat_2025,
      p.pat_2024,
      p.pat_2023,
      a.iq_score,
      a.iq_category,
      a.disc,
      a.disc_category,
      a.matchup_result
    FROM bq_raw.p_talent_profile p
    LEFT JOIN (
      SELECT DISTINCT ON (btrim(personnel_number))
        personnel_number, position_name, ps_level, direktorat, divisi, department
      FROM bq_raw.p_emps
      ORDER BY btrim(personnel_number), data_period DESC
    ) e ON btrim(e.personnel_number) = btrim(p.personnel_number)
    LEFT JOIN (
      SELECT DISTINCT ON (btrim(personnel_number))
        personnel_number, iq_score, iq_category, disc, disc_category, matchup_result
      FROM bq_raw.p_assessment_history
      ORDER BY btrim(personnel_number), assesment_date DESC
    ) a ON btrim(a.personnel_number) = btrim(p.personnel_number)
    WHERE p.talent_year = ${targetYear}
    ORDER BY p.employee_name ASC
  `);

  const boxCounts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  let totalInRetention = 0;
  let totalOutsideRetention = 0;
  let totalTopTalent = 0;
  let totalGlobalTalent = 0;
  let totalTalentPool = 0;
  let totalRewardHighPerformer = 0;

  const candidates: TalentPoolCandidate[] = rows.map((r) => {
    const isRetention = isTalentRetentionName(r.employee_name);
    if (isRetention) totalInRetention++;
    else totalOutsideRetention++;

    const box = resolveBox12(r.talent_class_12_box);
    const boxNumber = box ? box.boxNumber : null;

    if (boxNumber) {
      boxCounts[boxNumber] = (boxCounts[boxNumber] || 0) + 1;

      // Classify groups
      if (boxNumber === 1 || boxNumber === 2) {
        totalGlobalTalent++;
      }
      if ([1, 2, 3, 4].includes(boxNumber)) {
        totalTopTalent++;
      }
      if ([1, 2, 3, 4, 7, 8].includes(boxNumber)) {
        totalTalentPool++;
      }
      if (boxNumber === 5 || boxNumber === 6) {
        totalRewardHighPerformer++;
      }
    }

    return {
      personnelNumber: r.personnel_number,
      name: r.employee_name,
      position: r.position_name,
      jobLevel: r.ps_level,
      businessUnit: r.business_unit,
      directorate: r.direktorat,
      division: r.divisi,
      department: r.department,
      performanceCategory: r.performance_category,
      potentialCategory: r.potential_grow_category,
      talentClass12Box: r.talent_class_12_box,
      box,
      boxNumber,
      pat2025: r.pat_2025,
      pat2024: r.pat_2024,
      pat2023: r.pat_2023,
      iqScore: r.iq_score ? Number(r.iq_score) : null,
      iqCategory: r.iq_category,
      disc: r.disc,
      discCategory: r.disc_category,
      matchupResult: r.matchup_result !== null && r.matchup_result !== undefined ? Number(r.matchup_result) : null,
      isTalentRetention: isRetention,
    };
  });

  return {
    year: targetYear,
    summary: {
      totalCandidates: candidates.length,
      totalInRetention,
      totalOutsideRetention,
      totalTopTalent,
      totalGlobalTalent,
      totalTalentPool,
      totalRewardHighPerformer,
      boxCounts,
    },
    candidates,
  };
}
