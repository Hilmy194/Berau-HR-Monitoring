import { prisma } from "../prisma";

export type StemType = "STEM" | "Non-STEM";
export type TrainingType = "Inhouse" | "Outhouse";
export type PreAssessmentType =
  | "Wajib - Online Pre-Test SMKP"
  | "Wajib - Self-Assessment Competency Radar"
  | "Wajib - Technical Baseline Exam"
  | "Opsional - Pre-Training Survey"
  | "Tidak Ada Pre-Assessment";

export interface TrainingCatalogItem {
  id: string;
  trainingTitle: string;
  skill: string;
  stemType: StemType;
  trainingType: TrainingType;
  vendor: string;
  cost: number; // Training Fee (IDR)
  flightCost: number; // Tiket Pesawat
  hotelCost: number; // Hotel
  updCost: number; // UPD / Uang Saku
  transportCost: number; // Transportasi Lokal
  totalCost: number; // Total Biaya (IDR)
  budgetCode: string; // WBS / Cost Center
  date: string; // Tanggal / Batch Pelaksanaan
  preAssessmentRequired: PreAssessmentType;
  targetAudience: string;
  description: string;
}

export type TrainingRequestStatus =
  | "PENDING_LEADER_APPROVAL"
  | "APPROVED_BY_LEADER"
  | "REJECTED_BY_LEADER"
  | "REGISTERED"
  | "COMPLETED";

export type TrainingRequestSource =
  | "AI_RECOMMENDED"
  | "LEADER_ASSIGNED"
  | "EMPLOYEE_INITIATED";

export interface EmployeeTrainingRequest {
  id: string;
  employeePersonnelNumber: string;
  employeeName: string;
  department: string;
  catalogItemId?: string;
  trainingTitle: string;
  skill: string;
  stemType: StemType;
  trainingType: TrainingType;
  vendor: string;
  totalCost: number;
  budgetCode: string;
  scheduleDate: string;
  preAssessmentRequired: PreAssessmentType;
  preAssessmentNotes?: string; // SATU-SATUNYA field yang berupa ketik/free-text!
  source: TrainingRequestSource;
  status: TrainingRequestStatus;
  leaderNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export const DUMMY_TRAINING_CATALOG: TrainingCatalogItem[] = [
  {
    id: "TRN-BC-001",
    trainingTitle: "Operational Excellence & Pit Fleet Dispatch Optimization",
    skill: "Operational Excellence",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Tekmira ESDM & Hexagon Mining",
    cost: 12500000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 1500000,
    transportCost: 500000,
    totalCost: 14500000,
    budgetCode: "CC-7120-MINING",
    date: "15 - 19 Mei 2026",
    preAssessmentRequired: "Wajib - Technical Baseline Exam",
    targetAudience: "Mine Operation Supervisor, Dispatch Engineer, Foreman",
    description: "Optimalisasi produktivitas armada pit, mitigasi idle-time haul truck, dan sinkronisasi real-time Fleet Management System.",
  },
  {
    id: "TRN-BC-002",
    trainingTitle: "Geotechnical Slope Stability & Radar Monitoring Analysis",
    skill: "Geotechnical & Exploration",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "ITB Mining Institute",
    cost: 15000000,
    flightCost: 3500000,
    hotelCost: 3000000,
    updCost: 2000000,
    transportCost: 750000,
    totalCost: 24250000,
    budgetCode: "WBS-OPS-TRN-2026",
    date: "10 - 14 Juni 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    targetAudience: "Geotechnical Engineer, Geology Superintendent, Specialist",
    description: "Analisis kestabilan lereng tambang terbuka, interpretasi data radar SSR-XT, mitigasi kelongsoran pit, dan tata kelola air tambang.",
  },
  {
    id: "TRN-BC-003",
    trainingTitle: "Sertifikasi Pengawas Operasional Madya (POM SMKP Minerba)",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "PPSDM Geominerba ESDM",
    cost: 9500000,
    flightCost: 3000000,
    hotelCost: 2500000,
    updCost: 1800000,
    transportCost: 600000,
    totalCost: 17400000,
    budgetCode: "CC-7130-HSE",
    date: "20 - 24 Juli 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    targetAudience: "Superintendent, Manager, Technical Specialist",
    description: "Sertifikasi kompetensi pengawas operasional madya sesuai Permen ESDM No 26/2018 tentang kaidah teknik pertambangan yang baik.",
  },
  {
    id: "TRN-BC-004",
    trainingTitle: "Short-Term & Mid-Term Mine Planning Modeling with Spry",
    skill: "Mine Planning & Tech Services",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Mining Institute Indonesia",
    cost: 14000000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 1200000,
    transportCost: 400000,
    totalCost: 15600000,
    budgetCode: "CC-7140-ENGR",
    date: "18 - 22 Agustus 2026",
    preAssessmentRequired: "Wajib - Technical Baseline Exam",
    targetAudience: "Mine Planner, Mid-Term Engineer, Scheduler",
    description: "Simulasi sequence penambangan batubara, optimasi rasio pengupasan (SR), dumping sequence plan, dan balancing kapasitas crusher.",
  },
  {
    id: "TRN-BC-005",
    trainingTitle: "Heavy Equipment Fleet Health & Predictive Maintenance Analytics",
    skill: "Operational Excellence",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Schneider Electric & Komatsu Training Center",
    cost: 16500000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 1500000,
    transportCost: 500000,
    totalCost: 18500000,
    budgetCode: "CC-7120-MINING",
    date: "14 - 18 September 2026",
    preAssessmentRequired: "Wajib - Technical Baseline Exam",
    targetAudience: "Maintenance Engineer, Reliability Specialist, Section Head",
    description: "Penerapan oil sampling analysis, vibration sensor monitoring, thermography, dan telematics data untuk pencegahan breakdown alat berat.",
  },
  {
    id: "TRN-BC-006",
    trainingTitle: "Applied Python & AI Machine Learning for Mining Operations",
    skill: "Digital Transformation & AI",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "Algoritma Data Science School",
    cost: 9000000,
    flightCost: 2800000,
    hotelCost: 2400000,
    updCost: 1600000,
    transportCost: 500000,
    totalCost: 16300000,
    budgetCode: "WBS-OPS-TRN-2026",
    date: "12 - 16 Oktober 2026",
    preAssessmentRequired: "Wajib - Self-Assessment Competency Radar",
    targetAudience: "Data Analyst, Mining Engineer, Continuous Improvement",
    description: "Otomasi rekapitulasi data shift tambang, pemodelan prediktif konsumsi bahan bakar (fuel burn-rate), dan dashboard machine learning.",
  },
  {
    id: "TRN-BC-007",
    trainingTitle: "Blasting Permit & Advanced Blast Movement Monitoring (BMM)",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Orica Mining Services & PPSDM",
    cost: 10500000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 1200000,
    transportCost: 400000,
    totalCost: 12100000,
    budgetCode: "CC-7130-HSE",
    date: "03 - 07 November 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    targetAudience: "Drill & Blast Engineer, Blaster Foreman, Safety Inspector",
    description: "Perhitungan burden, spacing, decking explosives, kontrol getaran tanah (PPV), serta deteksi pergeseran batas batubara pasca blasting.",
  },
  {
    id: "TRN-BC-008",
    trainingTitle: "Environmental Acid Mine Drainage Mitigation & Soil Rehabilitation",
    skill: "ESG & Environmental Compliance",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "SEAMEO BIOTROP & IPB Mining Center",
    cost: 8500000,
    flightCost: 2700000,
    hotelCost: 2200000,
    updCost: 1500000,
    transportCost: 450000,
    totalCost: 15350000,
    budgetCode: "CC-7150-ENV",
    date: "24 - 28 November 2026",
    preAssessmentRequired: "Opsional - Pre-Training Survey",
    targetAudience: "Environment Supervisor, Reclamation Specialist, Compliance",
    description: "Pengendalian air asam tambang (AAT) aktif & pasif, formulasi bioremediasi tanah pascatambang, dan monitoring baku mutu efluen sungai.",
  },
  {
    id: "TRN-BC-009",
    trainingTitle: "Executive Competency Development Program (ECDP) Leadership",
    skill: "Leadership & Supervisory",
    stemType: "Non-STEM",
    trainingType: "Outhouse",
    vendor: "PPM Manajemen",
    cost: 13500000,
    flightCost: 3200000,
    hotelCost: 2800000,
    updCost: 1900000,
    transportCost: 650000,
    totalCost: 22050000,
    budgetCode: "WBS-HR-LEAD-2026",
    date: "08 - 12 Juni 2026",
    preAssessmentRequired: "Wajib - Self-Assessment Competency Radar",
    targetAudience: "Manager, GM Suksesor, Key Talent Tier 1 & Tier 2",
    description: "Penguatan kepemimpinan strategis, eksekusi visi bisnis lintas fungsi, pengambilan keputusan berbasis risiko, dan talent coaching.",
  },
  {
    id: "TRN-BC-010",
    trainingTitle: "Strategic Financial Acumen & Mining Cost Center Budgeting",
    skill: "Financial & Cost Governance",
    stemType: "Non-STEM",
    trainingType: "Outhouse",
    vendor: "Prasetiya Mulya Executive Learning",
    cost: 11500000,
    flightCost: 3000000,
    hotelCost: 2600000,
    updCost: 1750000,
    transportCost: 600000,
    totalCost: 19450000,
    budgetCode: "CC-7110-FINANCE",
    date: "13 - 17 Juli 2026",
    preAssessmentRequired: "Wajib - Self-Assessment Competency Radar",
    targetAudience: "Operational Lead, Section Head, Department Head",
    description: "Manajemen OPEX & CAPEX pertambangan batubara, analisis variance cost per ton (BBM, OB, Coal Hauling), dan cash flow operasional.",
  },
  {
    id: "TRN-BC-011",
    trainingTitle: "Supervisory Coaching, Psychological Safety & High-Impact Team",
    skill: "Leadership & Supervisory",
    stemType: "Non-STEM",
    trainingType: "Inhouse",
    vendor: "Dale Carnegie Indonesia",
    cost: 7500000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 1000000,
    transportCost: 350000,
    totalCost: 8850000,
    budgetCode: "WBS-HR-LEAD-2026",
    date: "10 - 14 Agustus 2026",
    preAssessmentRequired: "Opsional - Pre-Training Survey",
    targetAudience: "Foreman, Supervisor, Atasan Langsung",
    description: "Teknik coaching 1-on-1, active listening, pemberian umpan balik konstruktif, serta penciptaan rasa aman dalam pelaporan insiden kerja.",
  },
  {
    id: "TRN-BC-012",
    trainingTitle: "ISO 14001:2015 & ISO 45001:2018 Lead Auditor Integrated Mining",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "Non-STEM",
    trainingType: "Outhouse",
    vendor: "SGS Indonesia",
    cost: 8000000,
    flightCost: 2800000,
    hotelCost: 2400000,
    updCost: 1600000,
    transportCost: 500000,
    totalCost: 15300000,
    budgetCode: "CC-7130-HSE",
    date: "07 - 11 September 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    targetAudience: "Audit Internal, Safety Officer, Compliance Specialist",
    description: "Metodologi audit kepatuhan lingkungan dan K3 pertambangan sesuai standar internasional, audit checklist, dan penyusunan CAR/PAR.",
  },
  {
    id: "TRN-BC-013",
    trainingTitle: "Cross-Functional Collaboration & Change Management in Mining",
    skill: "Leadership & Supervisory",
    stemType: "Non-STEM",
    trainingType: "Inhouse",
    vendor: "MarkPlus Institute",
    cost: 6500000,
    flightCost: 0,
    hotelCost: 0,
    updCost: 900000,
    transportCost: 300000,
    totalCost: 7700000,
    budgetCode: "WBS-HR-LEAD-2026",
    date: "05 - 09 Oktober 2026",
    preAssessmentRequired: "Tidak Ada Pre-Assessment",
    targetAudience: "All Leaders, Project Leads, lintas departemen",
    description: "Mereduksi silo-mentality antar departemen tambang, sinkronisasi jadwal Pit vs Port vs Maintenance, dan manajemen perubahan budaya.",
  },
  {
    id: "TRN-BC-014",
    trainingTitle: "Contract Management & Mining Vendor Dispute Negotiation",
    skill: "Financial & Cost Governance",
    stemType: "Non-STEM",
    trainingType: "Outhouse",
    vendor: "Indonesian Legal Mining Forum & PPHBI",
    cost: 8500000,
    flightCost: 2900000,
    hotelCost: 2500000,
    updCost: 1700000,
    transportCost: 550000,
    totalCost: 16150000,
    budgetCode: "CC-7110-FINANCE",
    date: "09 - 13 November 2026",
    preAssessmentRequired: "Opsional - Pre-Training Survey",
    targetAudience: "Contract Specialist, Procurement Lead, Project Manager",
    description: "Penyusunan Service Level Agreement (SLA) kontraktor tambang, penanganan klaim penalti ketersediaan alat, dan mitigasi sengketa komersial.",
  },
  {
    id: "TRN-BC-015",
    trainingTitle: "Sertifikasi Pengawas Operasional Pertama (POP SMKP Minerba)",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "PPSDM Geominerba ESDM",
    cost: 7500000,
    flightCost: 2800000,
    hotelCost: 2300000,
    updCost: 1600000,
    transportCost: 500000,
    totalCost: 14700000,
    budgetCode: "CC-7130-HSE",
    date: "14 - 18 Desember 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    targetAudience: "Foreman, Junior Supervisor, Safety Inspector",
    description: "Sertifikasi kompetensi pengawas operasional lini depan pertambangan sesuai standar K3 ESDM untuk inspeksi, investigasi, dan JSA.",
  },
];

/** Initial fallback in-memory cache to guarantee fast response */
const INITIAL_REQUESTS: EmployeeTrainingRequest[] = [
  {
    id: "REQ-2026-001",
    employeePersonnelNumber: "11000414",
    employeeName: "Sutami Sitorus",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    catalogItemId: "TRN-BC-004",
    trainingTitle: "Short-Term & Mid-Term Mine Planning Modeling with Spry",
    skill: "Mine Planning & Tech Services",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Mining Institute Indonesia",
    totalCost: 15600000,
    budgetCode: "CC-7140-ENGR",
    scheduleDate: "18 - 22 Agustus 2026",
    preAssessmentRequired: "Wajib - Technical Baseline Exam",
    preAssessmentNotes: "Telah menyelesaikan simulasi modul internal Spry level 1, siap mengikuti ujian technical baseline modeling.",
    source: "AI_RECOMMENDED",
    status: "APPROVED_BY_LEADER",
    leaderNotes: "Disetujui. Sangat krusial untuk persiapan suksesi Mine Plan & Technical Services GM.",
    submittedAt: "2026-05-02T10:30:00Z",
    reviewedAt: "2026-05-04T14:15:00Z",
    reviewedBy: "Arya Dhamar Nugraha",
  },
  {
    id: "REQ-2026-002",
    employeePersonnelNumber: "11000414",
    employeeName: "Sutami Sitorus",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    catalogItemId: "TRN-BC-009",
    trainingTitle: "Executive Competency Development Program (ECDP) Leadership",
    skill: "Leadership & Supervisory",
    stemType: "Non-STEM",
    trainingType: "Outhouse",
    vendor: "PPM Manajemen",
    totalCost: 22050000,
    budgetCode: "WBS-HR-LEAD-2026",
    scheduleDate: "08 - 12 Juni 2026",
    preAssessmentRequired: "Wajib - Self-Assessment Competency Radar",
    preAssessmentNotes: "Self-assessment radar kepemimpinan skor 78/100, membutuhkan penguatan pada modul Strategic Business Acumen.",
    source: "LEADER_ASSIGNED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "REQ-2026-003",
    employeePersonnelNumber: "11001519",
    employeeName: "Maurys Irwan",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    catalogItemId: "TRN-BC-002",
    trainingTitle: "Geotechnical Slope Stability & Radar Monitoring Analysis",
    skill: "Geotechnical & Exploration",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "ITB Mining Institute",
    totalCost: 24250000,
    budgetCode: "WBS-OPS-TRN-2026",
    scheduleDate: "10 - 14 Juni 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    preAssessmentNotes: "Pre-test SMKP modul geoteknik diselesaikan dengan predikat memuaskan.",
    source: "AI_RECOMMENDED",
    status: "APPROVED_BY_LEADER",
    leaderNotes: "Disetujui untuk penguatan tata kelola lereng kritis pit Binungan.",
    submittedAt: "2026-05-05T09:20:00Z",
    reviewedAt: "2026-05-06T11:00:00Z",
    reviewedBy: "Arya Dhamar Nugraha",
  },
  {
    id: "REQ-2026-004",
    employeePersonnelNumber: "11000414",
    employeeName: "Sutami Sitorus",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    catalogItemId: "TRN-BC-006",
    trainingTitle: "Applied Python & AI Machine Learning for Mining Operations",
    skill: "Digital Transformation & AI",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "Algoritma Data Science School",
    totalCost: 16300000,
    budgetCode: "WBS-OPS-TRN-2026",
    scheduleDate: "12 - 16 Oktober 2026",
    preAssessmentRequired: "Wajib - Self-Assessment Competency Radar",
    preAssessmentNotes: "Mengajukan mandiri untuk mendukung proyek automasi pelaporan rekonsiliasi cadangan batubara.",
    source: "EMPLOYEE_INITIATED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: "2026-05-15T13:45:00Z",
  },
  {
    id: "REQ-2026-005",
    employeePersonnelNumber: "11000414",
    employeeName: "Sutami Sitorus",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    catalogItemId: "TRN-BC-003",
    trainingTitle: "ISO 14001:2015 & ISO 45001:2018 Lead Auditor Integrated Mining",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "SGS Indonesia",
    totalCost: 15300000,
    budgetCode: "CC-7130-HSE",
    scheduleDate: "07 - 11 September 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    preAssessmentNotes: "Mengajukan mandiri untuk pemenuhan sertifikasi lead auditor terintegrasi tambang.",
    source: "EMPLOYEE_INITIATED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: "2026-05-18T10:00:00Z",
  },
  {
    id: "REQ-2026-006",
    employeePersonnelNumber: "11000661",
    employeeName: "Hifzil Kirmi",
    department: "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    catalogItemId: "TRN-BC-008",
    trainingTitle: "Environmental Acid Mine Drainage Mitigation & Soil Rehabilitation",
    skill: "ESG & Environmental Compliance",
    stemType: "STEM",
    trainingType: "Outhouse",
    vendor: "SEAMEO BIOTROP & IPB Mining Center",
    totalCost: 15350000,
    budgetCode: "CC-7150-ENV",
    scheduleDate: "24 - 28 November 2026",
    preAssessmentRequired: "Opsional - Pre-Training Survey",
    preAssessmentNotes: "Disusun untuk implementasi modul bioremediasi dan mitigasi air asam tambang pit Binungan.",
    source: "EMPLOYEE_INITIATED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: "2026-05-19T09:00:00Z",
  },
  {
    id: "REQ-2026-007",
    employeePersonnelNumber: "11000464",
    employeeName: "Apribowo Rossiyanto",
    department: "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    catalogItemId: "TRN-BC-007",
    trainingTitle: "Blasting Permit & Advanced Blast Movement Monitoring (BMM)",
    skill: "HSE & Mining Safety (SMKP)",
    stemType: "STEM",
    trainingType: "Inhouse",
    vendor: "Orica Mining Services & PPSDM",
    totalCost: 12100000,
    budgetCode: "CC-7130-HSE",
    scheduleDate: "03 - 07 November 2026",
    preAssessmentRequired: "Wajib - Online Pre-Test SMKP",
    preAssessmentNotes: "Diperlukan untuk evaluasi getaran blasting pit dan pemantauan pergeseran batas mine closure.",
    source: "EMPLOYEE_INITIATED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: "2026-05-20T11:30:00Z",
  },
];

const globalForCatalog = globalThis as unknown as {
  inMemoryTrainingRequests?: EmployeeTrainingRequest[];
};

export function getRequestsStore(): EmployeeTrainingRequest[] {
  if (!globalForCatalog.inMemoryTrainingRequests) {
    globalForCatalog.inMemoryTrainingRequests = [...INITIAL_REQUESTS];
  }
  return globalForCatalog.inMemoryTrainingRequests;
}

/** Return all training catalog items */
export async function listTrainingCatalog(filters?: {
  stemType?: string;
  skill?: string;
  trainingType?: string;
  search?: string;
}): Promise<TrainingCatalogItem[]> {
  try {
    const dbRows = await prisma.trainingCatalog.findMany({
      orderBy: { id: "asc" },
    });
    if (dbRows && dbRows.length > 0) {
      let result = dbRows.map(mapDbCatalogToItem);
      if (filters?.stemType && filters.stemType !== "ALL") {
        result = result.filter((r) => r.stemType.toLowerCase() === filters.stemType?.toLowerCase());
      }
      if (filters?.skill && filters.skill !== "ALL") {
        result = result.filter((r) => r.skill.toLowerCase() === filters.skill?.toLowerCase());
      }
      if (filters?.trainingType && filters.trainingType !== "ALL") {
        result = result.filter((r) => r.trainingType.toLowerCase() === filters.trainingType?.toLowerCase());
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (r) =>
            r.trainingTitle.toLowerCase().includes(q) ||
            r.vendor.toLowerCase().includes(q) ||
            r.skill.toLowerCase().includes(q)
        );
      }
      return result;
    }
  } catch (err) {
    console.warn("DB training_catalog query fallback to static:", err);
  }

  // Fallback to static dummy list
  let result = [...DUMMY_TRAINING_CATALOG];
  if (filters?.stemType && filters.stemType !== "ALL") {
    result = result.filter((r) => r.stemType.toLowerCase() === filters.stemType?.toLowerCase());
  }
  if (filters?.skill && filters.skill !== "ALL") {
    result = result.filter((r) => r.skill.toLowerCase() === filters.skill?.toLowerCase());
  }
  if (filters?.trainingType && filters.trainingType !== "ALL") {
    result = result.filter((r) => r.trainingType.toLowerCase() === filters.trainingType?.toLowerCase());
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.trainingTitle.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.skill.toLowerCase().includes(q)
    );
  }
  return result;
}

/** Get single training item by ID */
export async function getTrainingCatalogItemById(id: string): Promise<TrainingCatalogItem | undefined> {
  const catalog = await listTrainingCatalog();
  return catalog.find((c) => c.id === id);
}

/** Find best catalog match based on skill or gap keywords */
export function findBestCatalogMatchForSkill(skillName: string): TrainingCatalogItem {
  const lower = skillName.toLowerCase();
  
  if (lower.includes("mine") || lower.includes("spry") || lower.includes("planning")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-004")!;
  }
  if (lower.includes("geotek") || lower.includes("slope") || lower.includes("lereng")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-002")!;
  }
  if (lower.includes("pom") || lower.includes("pop") || lower.includes("smkp") || lower.includes("safety") || lower.includes("k3")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-003")!;
  }
  if (lower.includes("lead") || lower.includes("ecdp") || lower.includes("manajerial") || lower.includes("strategis")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-009")!;
  }
  if (lower.includes("coach") || lower.includes("team") || lower.includes("supervis")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-011")!;
  }
  if (lower.includes("fleet") || lower.includes("dispatch") || lower.includes("operasional") || lower.includes("excellence")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-001")!;
  }
  if (lower.includes("ai") || lower.includes("python") || lower.includes("data") || lower.includes("digital")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-006")!;
  }
  if (lower.includes("env") || lower.includes("lingkungan") || lower.includes("rehab") || lower.includes("esg")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-008")!;
  }
  if (lower.includes("finance") || lower.includes("biaya") || lower.includes("budget") || lower.includes("cost")) {
    return DUMMY_TRAINING_CATALOG.find((c) => c.id === "TRN-BC-010")!;
  }

  // Default fallback
  return DUMMY_TRAINING_CATALOG[0];
}

/** List all employee training requests */
export async function listEmployeeTrainingRequests(
  employeePersonnelNumber?: string
): Promise<EmployeeTrainingRequest[]> {
  const store = getRequestsStore();

  try {
    const query = employeePersonnelNumber
      ? `SELECT * FROM employee_training_requests WHERE employee_personnel_number = $1 ORDER BY submitted_at DESC`
      : `SELECT * FROM employee_training_requests ORDER BY submitted_at DESC`;

    const dbRows = employeePersonnelNumber
      ? await prisma.$queryRawUnsafe<any[]>(query, employeePersonnelNumber)
      : await prisma.$queryRawUnsafe<any[]>(query);

    if (dbRows && dbRows.length > 0) {
      const dbItems = dbRows.map(mapDbRequestToItem);
      // Sinkronkan ke store memory agar memory selalu memiliki seluruh request terbaru
      for (const item of dbItems) {
        const idx = store.findIndex((r) => r.id.toLowerCase() === item.id.toLowerCase());
        if (idx !== -1) {
          store[idx] = item;
        } else {
          store.push(item);
        }
      }
      return dbItems;
    }
  } catch (err) {
    console.warn("DB employee_training_requests query fallback to in-memory:", err);
  }

  if (employeePersonnelNumber) {
    return store.filter(
      (r) => r.employeePersonnelNumber.toLowerCase() === employeePersonnelNumber.toLowerCase()
    );
  }
  return store;
}

/** Get single training request by ID */
export async function getEmployeeTrainingRequestById(
  id: string
): Promise<EmployeeTrainingRequest | null> {
  const cleanId = id.trim();
  try {
    const dbRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM employee_training_requests WHERE id = $1 OR LOWER(id) = LOWER($1)`,
      cleanId
    );
    if (dbRows && dbRows.length > 0) {
      const item = mapDbRequestToItem(dbRows[0]);
      const store = getRequestsStore();
      const idx = store.findIndex((r) => r.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) store[idx] = item;
      else store.unshift(item);
      return item;
    }
  } catch (err) {
    console.warn("DB getEmployeeTrainingRequestById fallback to in-memory:", err);
  }

  const store = getRequestsStore();
  return store.find((r) => r.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

/** Create a new employee training request */
export async function createEmployeeTrainingRequest(params: {
  employeePersonnelNumber: string;
  employeeName: string;
  department: string;
  catalogItemId: string;
  preAssessmentNotes?: string;
  source?: TrainingRequestSource;
}): Promise<EmployeeTrainingRequest> {
  const catalogItem = await getTrainingCatalogItemById(params.catalogItemId);
  if (!catalogItem) {
    throw new Error(`Katalog training dengan ID ${params.catalogItemId} tidak ditemukan.`);
  }

  const id = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const newRequest: EmployeeTrainingRequest = {
    id,
    employeePersonnelNumber: params.employeePersonnelNumber,
    employeeName: params.employeeName,
    department: params.department,
    catalogItemId: catalogItem.id,
    trainingTitle: catalogItem.trainingTitle,
    skill: catalogItem.skill,
    stemType: catalogItem.stemType,
    trainingType: catalogItem.trainingType,
    vendor: catalogItem.vendor,
    totalCost: catalogItem.totalCost,
    budgetCode: catalogItem.budgetCode,
    scheduleDate: catalogItem.date,
    preAssessmentRequired: catalogItem.preAssessmentRequired,
    preAssessmentNotes: params.preAssessmentNotes || "",
    source: params.source || "EMPLOYEE_INITIATED",
    status: "PENDING_LEADER_APPROVAL",
    submittedAt: now,
  };

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO employee_training_requests (
        id, employee_personnel_number, employee_name, department,
        catalog_item_id, training_title, skill, stem_type, training_type,
        vendor, total_cost, budget_code, schedule_date, pre_assessment_required,
        pre_assessment_notes, source, status, submitted_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )`,
      newRequest.id,
      newRequest.employeePersonnelNumber,
      newRequest.employeeName,
      newRequest.department,
      newRequest.catalogItemId,
      newRequest.trainingTitle,
      newRequest.skill,
      newRequest.stemType,
      newRequest.trainingType,
      newRequest.vendor,
      newRequest.totalCost,
      newRequest.budgetCode,
      newRequest.scheduleDate,
      newRequest.preAssessmentRequired,
      newRequest.preAssessmentNotes || "",
      newRequest.source,
      newRequest.status
    );
  } catch (err) {
    console.warn("DB insert employee_training_requests fallback to in-memory:", err);
  }

  const store = getRequestsStore();
  store.unshift(newRequest);
  return newRequest;
}

/** Update status of training request (Approve / Reject) */
export async function updateTrainingRequestStatus(
  id: string,
  status: "APPROVED_BY_LEADER" | "REJECTED_BY_LEADER",
  leaderNotes?: string,
  reviewerName?: string
): Promise<EmployeeTrainingRequest | null> {
  const cleanId = id.trim();
  const now = new Date().toISOString();

  // 1. Coba update ke PostgreSQL database
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE employee_training_requests 
       SET status = $1, leader_notes = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4 OR LOWER(id) = LOWER($4)`,
      status,
      leaderNotes ?? null,
      reviewerName ?? "Leader / Atasan",
      cleanId
    );

    // Ambil baris ter-update dari DB
    const dbRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM employee_training_requests WHERE id = $1 OR LOWER(id) = LOWER($1)`,
      cleanId
    );

    if (dbRows && dbRows.length > 0) {
      const updatedItem = mapDbRequestToItem(dbRows[0]);
      const store = getRequestsStore();
      const idx = store.findIndex((r) => r.id.toLowerCase() === cleanId.toLowerCase());
      if (idx !== -1) {
        store[idx] = updatedItem;
      } else {
        store.unshift(updatedItem);
      }
      return updatedItem;
    }
  } catch (err) {
    console.warn("DB update employee_training_requests fallback to in-memory:", err);
  }

  // 2. Fallback ke global in-memory store
  const store = getRequestsStore();
  const idx = store.findIndex((r) => r.id.toLowerCase() === cleanId.toLowerCase());
  if (idx !== -1) {
    store[idx] = {
      ...store[idx],
      status,
      leaderNotes: leaderNotes !== undefined ? leaderNotes : store[idx].leaderNotes,
      reviewedBy: reviewerName ?? "Leader / Atasan",
      reviewedAt: now,
    };
    return store[idx];
  }

  return null;
}

/** Seed database with initial catalog if empty */
export async function seedTrainingCatalogTable(): Promise<void> {
  try {
    for (const item of DUMMY_TRAINING_CATALOG) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO training_catalog (
          id, training_title, skill, stem_type, training_type,
          vendor, cost, flight_cost, hotel_cost, upd_cost, transport_cost,
          total_cost, budget_code, schedule_date, pre_assessment_required, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          training_title = EXCLUDED.training_title,
          cost = EXCLUDED.cost,
          total_cost = EXCLUDED.total_cost,
          budget_code = EXCLUDED.budget_code,
          schedule_date = EXCLUDED.schedule_date,
          pre_assessment_required = EXCLUDED.pre_assessment_required,
          updated_at = NOW()`,
        item.id,
        item.trainingTitle,
        item.skill,
        item.stemType,
        item.trainingType,
        item.vendor,
        item.cost,
        item.flightCost,
        item.hotelCost,
        item.updCost,
        item.transportCost,
        item.totalCost,
        item.budgetCode,
        item.date,
        item.preAssessmentRequired,
        item.description
      );
    }
  } catch (err) {
    console.warn("seedTrainingCatalogTable error:", err);
  }
}

// Helpers
function mapDbCatalogToItem(row: any): TrainingCatalogItem {
  return {
    id: row.id,
    trainingTitle: row.trainingTitle ?? row.training_title,
    skill: row.skill,
    stemType: (row.stemType ?? row.stem_type) as StemType,
    trainingType: (row.trainingType ?? row.training_type) as TrainingType,
    vendor: row.vendor,
    cost: Number(row.cost),
    flightCost: Number(row.flightCost ?? row.flight_cost ?? 0),
    hotelCost: Number(row.hotelCost ?? row.hotel_cost ?? 0),
    updCost: Number(row.updCost ?? row.upd_cost ?? 0),
    transportCost: Number(row.transportCost ?? row.transport_cost ?? 0),
    totalCost: Number(row.totalCost ?? row.total_cost),
    budgetCode: row.budgetCode ?? row.budget_code,
    date: row.scheduleDate ?? row.schedule_date,
    preAssessmentRequired: (row.preAssessmentRequired ?? row.pre_assessment_required) as PreAssessmentType,
    targetAudience: row.targetAudience ?? row.target_audience ?? "Staff / Specialist / Leader",
    description: row.description || "",
  };
}

function mapDbRequestToItem(row: any): EmployeeTrainingRequest {
  return {
    id: row.id,
    employeePersonnelNumber: row.employee_personnel_number,
    employeeName: row.employee_name,
    department: row.department,
    catalogItemId: row.catalog_item_id,
    trainingTitle: row.training_title,
    skill: row.skill,
    stemType: row.stem_type as StemType,
    trainingType: row.training_type as TrainingType,
    vendor: row.vendor,
    totalCost: Number(row.total_cost),
    budgetCode: row.budget_code,
    scheduleDate: row.schedule_date,
    preAssessmentRequired: row.pre_assessment_required as PreAssessmentType,
    preAssessmentNotes: row.pre_assessment_notes || "",
    source: row.source as TrainingRequestSource,
    status: row.status as TrainingRequestStatus,
    leaderNotes: row.leader_notes || undefined,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : new Date().toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    reviewedBy: row.reviewed_by || undefined,
  };
}
