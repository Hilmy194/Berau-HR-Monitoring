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
  // Guaranteed inline styles to prevent Tailwind purge issues and ensure exact slide colors
  styleBg: string;
  styleText: string;
  styleBorder: string;
  styleBadgeBg: string;
  styleBadgeText: string;
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
    bgGradient: "bg-blue-900 text-white",
    borderClass: "border-blue-500",
    textClass: "text-white",
    badgeClass: "bg-white/20 text-white",
    styleBg: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)",
    styleText: "#ffffff",
    styleBorder: "2px solid #3b82f6",
    styleBadgeBg: "rgba(255, 255, 255, 0.22)",
    styleBadgeText: "#ffffff",
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
    badgeColor: "#2563eb",
    bgGradient: "bg-blue-700 text-white",
    borderClass: "border-blue-400",
    textClass: "text-white",
    badgeClass: "bg-white/20 text-white",
    styleBg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    styleText: "#ffffff",
    styleBorder: "2px solid #60a5fa",
    styleBadgeBg: "rgba(255, 255, 255, 0.22)",
    styleBadgeText: "#ffffff",
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
    bgGradient: "bg-sky-600 text-white",
    borderClass: "border-sky-400",
    textClass: "text-white",
    badgeClass: "bg-white/25 text-white",
    styleBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #38bdf8",
    styleBadgeBg: "rgba(255, 255, 255, 0.25)",
    styleBadgeText: "#ffffff",
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
    bgGradient: "bg-sky-500 text-white",
    borderClass: "border-sky-300",
    textClass: "text-white",
    badgeClass: "bg-white/25 text-white",
    styleBg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #7dd3fc",
    styleBadgeBg: "rgba(255, 255, 255, 0.25)",
    styleBadgeText: "#ffffff",
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
    badgeColor: "#65a30d",
    bgGradient: "bg-lime-700 text-white",
    borderClass: "border-lime-500",
    textClass: "text-white",
    badgeClass: "bg-white/25 text-white",
    styleBg: "linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #a3e635",
    styleBadgeBg: "rgba(255, 255, 255, 0.25)",
    styleBadgeText: "#ffffff",
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
    badgeColor: "#84cc16",
    bgGradient: "bg-lime-600 text-white",
    borderClass: "border-lime-400",
    textClass: "text-white",
    badgeClass: "bg-black/20 text-white",
    styleBg: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #bef264",
    styleBadgeBg: "rgba(0, 0, 0, 0.22)",
    styleBadgeText: "#ffffff",
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
    badgeColor: "#bef264",
    bgGradient: "bg-lime-200 text-slate-900",
    borderClass: "border-lime-400",
    textClass: "text-slate-900",
    badgeClass: "bg-white text-emerald-950",
    styleBg: "linear-gradient(135deg, #d9f99d 0%, #bef264 100%)",
    styleText: "#14532d",
    styleBorder: "1px solid #84cc16",
    styleBadgeBg: "#ffffff",
    styleBadgeText: "#14532d",
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
    badgeColor: "#bef264",
    bgGradient: "bg-lime-200 text-slate-900",
    borderClass: "border-lime-400",
    textClass: "text-slate-900",
    badgeClass: "bg-white text-emerald-950",
    styleBg: "linear-gradient(135deg, #d9f99d 0%, #bef264 100%)",
    styleText: "#14532d",
    styleBorder: "1px solid #84cc16",
    styleBadgeBg: "#ffffff",
    styleBadgeText: "#14532d",
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
    badgeColor: "#d9f99d",
    bgGradient: "bg-lime-100 text-slate-900",
    borderClass: "border-lime-300",
    textClass: "text-slate-900",
    badgeClass: "bg-white text-emerald-950",
    styleBg: "linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)",
    styleText: "#14532d",
    styleBorder: "1px solid #a3e635",
    styleBadgeBg: "#ffffff",
    styleBadgeText: "#14532d",
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
    bgGradient: "bg-amber-400 text-amber-950",
    borderClass: "border-amber-500",
    textClass: "text-amber-950",
    badgeClass: "bg-white text-amber-950",
    styleBg: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    styleText: "#451a03",
    styleBorder: "1px solid #d97706",
    styleBadgeBg: "#ffffff",
    styleBadgeText: "#78350f",
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
    badgeColor: "#f97316",
    bgGradient: "bg-orange-500 text-white",
    borderClass: "border-orange-400",
    textClass: "text-white",
    badgeClass: "bg-black/20 text-white",
    styleBg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #fb923c",
    styleBadgeBg: "rgba(0, 0, 0, 0.22)",
    styleBadgeText: "#ffffff",
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
    bgGradient: "bg-red-600 text-white",
    borderClass: "border-red-500",
    textClass: "text-white",
    badgeClass: "bg-black/20 text-white",
    styleBg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    styleText: "#ffffff",
    styleBorder: "1px solid #ef4444",
    styleBadgeBg: "rgba(0, 0, 0, 0.22)",
    styleBadgeText: "#ffffff",
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

