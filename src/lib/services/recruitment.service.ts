export type RecruitmentCandidate = {
  id: string;
  candidateName: string;
  position: string;
  businessUnit: string;
  department: string;
  division: string;
  directorate: string;
  status:
    | "Sourcing"
    | "Screening CV"
    | "Psikotes"
    | "User Interview"
    | "HR Interview"
    | "Medical Check-Up (MCU)"
    | "Offering Letter"
    | "Hired";
  appliedDate: string;
  email: string;
  phone: string;
  source: string;
  sourceCategory?: string;
  workableUrl?: string;
  notes?: string;
};

export type RecruitmentFilters = {
  q?: string;
  bu?: string;
  department?: string;
  position?: string;
  source?: string;
  status?: string;
};

export const RECRUITMENT_STAGES = [
  "Sourcing",
  "Screening CV",
  "Psikotes",
  "User Interview",
  "HR Interview",
  "Medical Check-Up (MCU)",
  "Offering Letter",
  "Hired",
] as const;

export const RECRUITMENT_CANDIDATES: RecruitmentCandidate[] = [
  {
    id: "REC-2026-001",
    candidateName: "Aditya Pratama",
    position: "Mining Section Superintendent",
    businessUnit: "PT Berau Coal - Site Lati",
    department: "LATI MINE OPERATION DEPARTMENT",
    division: "MINE OPERATION & SUPPORT DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "User Interview",
    appliedDate: "2026-09-12",
    email: "aditya.pratama@gmail.com",
    phone: "081234567890",
    source: "LinkedIn",
    notes: "Pengalaman 7 tahun di open-pit coal mining, kandidat kuat.",
  },
  {
    id: "REC-2026-002",
    candidateName: "Rina Kartika Sari",
    position: "Talent Acquisition Specialist",
    businessUnit: "PT Berau Coal - HO Jakarta",
    department: "HR OPERATIONS DEPARTMENT",
    division: "HRGS BC DIVISION",
    directorate: "HRGS DIRECTORATE",
    status: "Offering Letter",
    appliedDate: "2026-09-01",
    email: "rina.kartika@outlook.com",
    phone: "081398765432",
    source: "Jobstreet",
    notes: "Offering tahap finalisasi salary package.",
  },
  {
    id: "REC-2026-003",
    candidateName: "Bambang Sudarsono",
    position: "Short Term Mine Plan Senior Engineer",
    businessUnit: "PT Berau Coal - Site Binungan",
    department: "MINE DEV & PRODUCTION CONTROL DEPT",
    division: "MINE PLANNING & TECH. SERVICES DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "Medical Check-Up (MCU)",
    appliedDate: "2026-09-08",
    email: "bambang.sudarsono@gmail.com",
    phone: "081122334455",
    source: "Internal Referral",
    notes: "MCU dijadwalkan di RS Hermina Balikpapan.",
  },
  {
    id: "REC-2026-004",
    candidateName: "Dewi Anggraini",
    position: "Tax Advisor Specialist",
    businessUnit: "PT Berau Coal - HO Jakarta",
    department: "FINANCIAL REPORTING & ACC. DIVISION",
    division: "FINANCIAL REPORTING & ACC. DIVISION",
    directorate: "FINANCE DIRECTORATE",
    status: "Hired",
    appliedDate: "2026-08-15",
    email: "dewi.anggraini@yahoo.com",
    phone: "081567891234",
    source: "LinkedIn",
    notes: "Sudah sign offering, onboarding join date 1 Nov 2026.",
  },
  {
    id: "REC-2026-005",
    candidateName: "Faisal Rahman",
    position: "Geotechnical Engineer",
    businessUnit: "PT Berau Coal - Site Sambarata",
    department: "GEOTECHNICAL & HYDROLOGY DEPT",
    division: "MINE PLANNING & TECH. SERVICES DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "Psikotes",
    appliedDate: "2026-09-20",
    email: "faisal.rahman@gmail.com",
    phone: "081245678901",
    source: "Campus Hiring",
    notes: "Lulusan Teknik Geologi ITB, skor psikotes 88.",
  },
  {
    id: "REC-2026-006",
    candidateName: "Siti Nurhaliza",
    position: "HSE Inspector",
    businessUnit: "PT Berau Coal - Site Lati",
    department: "OHS & ENVIRONMENT DEPT",
    division: "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "HR Interview",
    appliedDate: "2026-09-15",
    email: "siti.nurhaliza.hse@gmail.com",
    phone: "081377889900",
    source: "Jobstreet",
    notes: "Memiliki sertifikasi AK3 Umum dan POP.",
  },
  {
    id: "REC-2026-007",
    candidateName: "Reza Firmansyah",
    position: "Plant Maintenance Specialist",
    businessUnit: "PT Berau Coal - Site Binungan",
    department: "PLANT & EQUIPMENT DEPARTMENT",
    division: "PLANT & ASSET MANAGEMENT DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "User Interview",
    appliedDate: "2026-09-10",
    email: "reza.firmansyah@gmail.com",
    phone: "081299887766",
    source: "LinkedIn",
    notes: "Eksperience 6 tahun heavy equipment maintenance Caterpillar.",
  },
  {
    id: "REC-2026-008",
    candidateName: "Mega Puspita",
    position: "Supply Chain & Procurement Officer",
    businessUnit: "PT Berau Coal - Head Office",
    department: "PROCUREMENT & SCM DEPARTMENT",
    division: "COMMERCIAL & SCM DIVISION",
    directorate: "FINANCE DIRECTORATE",
    status: "Screening CV",
    appliedDate: "2026-09-28",
    email: "mega.puspita@gmail.com",
    phone: "081988776655",
    source: "Company Website",
    notes: "Background SCM mining vendor negotiation.",
  },
  {
    id: "REC-2026-009",
    candidateName: "Hendro Wibowo",
    position: "Drilling & Blasting Supervisor",
    businessUnit: "PT Berau Coal - Site Sambarata",
    department: "SAMBARATA MINE OPERATION DEPT",
    division: "MINE OPERATION & SUPPORT DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "Sourcing",
    appliedDate: "2026-10-01",
    email: "hendro.wibowo@gmail.com",
    phone: "081211223344",
    source: "LinkedIn",
    notes: "Kandidat hasil direct sourcing headhunter.",
  },
  {
    id: "REC-2026-010",
    candidateName: "Anisa Rahmawati",
    position: "Environmental Monitoring Specialist",
    businessUnit: "PT Berau Coal - Site Lati",
    department: "OHS & ENVIRONMENT DEPT",
    division: "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "Psikotes",
    appliedDate: "2026-09-22",
    email: "anisa.rahma@gmail.com",
    phone: "081333445566",
    source: "Jobstreet",
    notes: "Pengalaman di pengelolaan limbah air asam tambang.",
  },
  {
    id: "REC-2026-011",
    candidateName: "Dimas Arya Saputra",
    position: "Civil & Infrastructure Engineer",
    businessUnit: "PT Berau Coal - Site Binungan",
    department: "INFRASTRUCTURE & CIVIL DEPT",
    division: "MINE PLANNING & TECH. SERVICES DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "User Interview",
    appliedDate: "2026-09-14",
    email: "dimas.arya@gmail.com",
    phone: "081766554433",
    source: "Internal Referral",
    notes: "Portofolio jembatan hauling dan settling pond sangat baik.",
  },
  {
    id: "REC-2026-012",
    candidateName: "Claudia Vania",
    position: "Corporate Communication Specialist",
    businessUnit: "PT Berau Coal - Head Office",
    department: "EXTERNAL RELATIONS & CSR DEPT",
    division: "COMMUNITY & CORPORATE AFFAIRS DIV",
    directorate: "HRGS DIRECTORATE",
    status: "Screening CV",
    appliedDate: "2026-09-29",
    email: "claudia.vania@gmail.com",
    phone: "081899881122",
    source: "LinkedIn",
    notes: "Berpengalaman di stakeholder & media relations industri tambang.",
  },
  {
    id: "REC-2026-013",
    candidateName: "Yusuf Maulana",
    position: "IT Infrastructure & Security Specialist",
    businessUnit: "PT Berau Coal - Head Office",
    department: "IT INFRASTRUCTURE DEPARTMENT",
    division: "INFORMATION TECHNOLOGY DIVISION",
    directorate: "FINANCE DIRECTORATE",
    status: "Medical Check-Up (MCU)",
    appliedDate: "2026-09-05",
    email: "yusuf.maulana@gmail.com",
    phone: "081277665544",
    source: "LinkedIn",
    notes: "Hasil interview technical sangat memuaskan.",
  },
  {
    id: "REC-2026-014",
    candidateName: "Lestari Wahyuni",
    position: "HR Training & Learning Specialist",
    businessUnit: "PT Berau Coal - HO Jakarta",
    department: "LEARNING & PEOPLE DEV DEPT",
    division: "HRGS BC DIVISION",
    directorate: "HRGS DIRECTORATE",
    status: "Hired",
    appliedDate: "2026-08-20",
    email: "lestari.wahyuni@gmail.com",
    phone: "081355443322",
    source: "Company Website",
    notes: "Sudah tanda tangan kontrak kerja, join date 15 Okt 2026.",
  },
  {
    id: "REC-2026-015",
    candidateName: "Fajar Nugroho",
    position: "Dispatch & Fleet Management Officer",
    businessUnit: "PT Berau Coal - Site Sambarata",
    department: "SAMBARATA MINE OPERATION DEPT",
    division: "MINE OPERATION & SUPPORT DIVISION",
    directorate: "OPERATION & HSE DIRECTORATE",
    status: "HR Interview",
    appliedDate: "2026-09-18",
    email: "fajar.nugroho@gmail.com",
    phone: "081266778899",
    source: "Jobstreet",
    notes: "Menguasai sistem FMS Modular Mining & Caterpillar MineStar.",
  },
];

import { fetchWorkableCandidates } from "@/lib/services/integrations/workable/workable.client";

export async function getAllRecruitmentCandidates(): Promise<RecruitmentCandidate[]> {
  try {
    const realCandidates = await fetchWorkableCandidates();
    if (realCandidates && realCandidates.length > 0) {
      return realCandidates;
    }
  } catch (err) {
    console.error("Failed to fetch real recruitment data, falling back to mock:", err);
  }
  return RECRUITMENT_CANDIDATES;
}

export async function listRecruitmentCandidates(filters: RecruitmentFilters = {}): Promise<RecruitmentCandidate[]> {
  const allCandidates = await getAllRecruitmentCandidates();
  const query = (filters.q ?? "").trim().toLocaleLowerCase("id-ID");

  return allCandidates.filter((candidate) => {
    if (filters.bu && candidate.businessUnit !== filters.bu) return false;
    if (filters.department && candidate.department !== filters.department) return false;
    if (filters.position && candidate.position !== filters.position) return false;
    if (filters.source && candidate.source !== filters.source) return false;
    if (filters.status && candidate.status !== filters.status) return false;

    if (!query) return true;

    return (
      candidate.candidateName.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.position.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.businessUnit.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.department.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.email.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.source.toLocaleLowerCase("id-ID").includes(query) ||
      candidate.status.toLocaleLowerCase("id-ID").includes(query)
    );
  });
}

export async function getRecruitmentStatistics(candidates: RecruitmentCandidate[]) {
  const total = candidates.length;

  // 1. Processes by Department
  const deptCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    const deptName = c.department
      .replace(/DEPARTMENT|DEPT|DIVISION|DIV/gi, "")
      .trim();
    deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
  });

  const processesByDepartment = Object.entries(deptCounts)
    .map(([department, count]) => ({
      department: department.length > 20 ? `${department.slice(0, 18)}...` : department,
      fullDepartment: department,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Candidates by Source Channel (LinkedIn, Uploaded/Sourced, Search with AI, etc.)
  const sourceCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    const src = c.source || "Other / Direct";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const sourceColors = ["#0284c7", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#64748b", "#06b6d4"];

  const candidatesBySource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: total ? Math.round((value / total) * 100) : 0,
      fill: sourceColors[idx % sourceColors.length],
    }));

  // 3. Step by Recruitment
  const stageCounts: Record<string, number> = {};
  RECRUITMENT_STAGES.forEach((stage) => {
    stageCounts[stage] = 0;
  });
  candidates.forEach((c) => {
    if (stageCounts[c.status] !== undefined) {
      stageCounts[c.status] += 1;
    }
  });

  const stageColors: Record<string, string> = {
    Sourcing: "#94a3b8",
    "Screening CV": "#64748b",
    Psikotes: "#38bdf8",
    "User Interview": "#0284c7",
    "HR Interview": "#6366f1",
    "Medical Check-Up (MCU)": "#f59e0b",
    "Offering Letter": "#10b981",
    Hired: "#059669",
  };

  const stepByRecruitment = RECRUITMENT_STAGES.map((step) => ({
    step,
    shortStep: step === "Medical Check-Up (MCU)" ? "MCU" : step === "Screening CV" ? "Screening" : step === "User Interview" ? "User Intv" : step === "HR Interview" ? "HR Intv" : step === "Offering Letter" ? "Offering" : step,
    count: stageCounts[step] ?? 0,
    percentage: total ? Math.round(((stageCounts[step] ?? 0) / total) * 100) : 0,
    fill: stageColors[step] || "#3b82f6",
  }));

  const activeProcesses = candidates.filter(
    (c) => c.status !== "Hired"
  ).length;

  const inInterview = candidates.filter(
    (c) => c.status === "User Interview" || c.status === "HR Interview"
  ).length;

  const offeringAndHired = candidates.filter(
    (c) => c.status === "Offering Letter" || c.status === "Hired"
  ).length;

  return {
    total,
    activeProcesses,
    inInterview,
    offeringAndHired,
    processesByDepartment,
    candidatesBySource,
    stepByRecruitment,
  };
}

export async function getRecruitmentFilterOptions() {
  const allCandidates = await getAllRecruitmentCandidates();
  const bus = Array.from(new Set(allCandidates.map((c) => c.businessUnit))).sort();
  const departments = Array.from(new Set(allCandidates.map((c) => c.department))).sort();
  const positions = Array.from(new Set(allCandidates.map((c) => c.position))).sort();
  const sources = Array.from(new Set(allCandidates.map((c) => c.source).filter(Boolean))).sort();
  const statuses = [...RECRUITMENT_STAGES];

  return {
    bus,
    departments,
    positions,
    sources,
    statuses,
  };
}
