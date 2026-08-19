import { DIRECTORATES } from "@/lib/constants";
import { listTalentDevelopmentCandidates, rankTalentCandidates } from "./talent-development.service";

export type ModuleFilters = {
  q?: string;
  directorate?: string;
  division?: string;
  department?: string;
  position?: string;
  employee?: string;
  window?: string;
};

export type EmployeeMaster = {
  profileId: string;
  employeeId: string;
  name: string;
  currentPosition: string;
  currentLevel: string;
  department: string;
  division: string;
  directorate: string;
  supervisorName: string;
  joinDate: string;
  birthDate: string | null;
  retirementAge: number | null;
  retirementExtendedUntil: string | null;
  retirementNotes: string | null;
  employmentStatus: string;
  lastPromotionDate: string;
  currentPositionDuration: string | null;
  performance: number[];
  jobDescription: string;
  workLocation: string;
  aspiration: string;
  currentSkills: string[];
  behavioralSkills: string[];
  certifications: string[];
  projects: string[];
  projectImpact: string;
  supervisorNotes: string;
  assessment: { iq?: number; eq?: number; leadership?: number };
  strength: string[];
  weakness: string[];
  careerHistory: string[];
  developmentPrograms: string[];
  patScore: number | null;
  patComment: string;
  successor: string;
  talentClass: string;
  promotionStatus: string;
  nextPromotionPic: string;
};

const POSITION_NAME_FIXES: Record<string, string> = {
  "Mine Plan & Technical Ser": "Mine Plan & Technical Services GM",
  "Operation Support General": "Operation Support General Manager",
  "Mine Operation & Support": "Mine Operation & Support GM",
  "Operation Compliance Mana": "Operation Compliance Manager",
  "Operation HSE & Supp Rel": "Operation HSE & Support Relation GM",
  "Mining Technology Sr Mana": "Mining Technology Senior Manager",
  "Sambarata Mine Operation": "Sambarata Mine Operation Manager",
  "Mid Term Mine Plan Manage": "Mid Term Mine Plan Manager",
  "Operation Support & Relat": "Operation Support & Relation GM",
  "System Compliance & Envir": "System Compliance & Environment GM",
  "Geotechnic & Hydrology Ma": "Geotechnic & Hydrology Manager",
  "Survey & Geospatial Info.": "Survey & Geospatial Information Manager",
  "Binungan Mine Operation A": "Binungan Mine Operation Area 3 Manager",
  "Geology & Exploration Man": "Geology & Exploration Manager",
  "Environment, Mine Closure": "Environment, Mine Closure & DAS Senior Manager",
  "ER & Safety Services Mana": "ER & Safety Services Manager",
  "Quality & Risk Management": "Quality & Risk Management System Manager",
  "Short Term Mine Plan Mana": "Short Term Mine Plan Manager",
  "Land Management And Devel": "Land Management And Development Manager",
  "HSE Certification & Train": "HSE Certification & Training Manager",
  "Gurimbang Mine Operation": "Gurimbang Mine Operation Manager",
  "Occupational Health & Saf": "Occupational Health & Safety GM",
  "Senior Manager Safety & H": "Senior Manager Safety & Health",
  "Technical Services Senior": "Technical Services Senior Manager",
};

export type OrgUnit = {
  directorate: string;
  division: string;
  department: string;
  positions: string[];
};

export type PositionSkill = {
  position: string;
  department: string;
  division: string;
  directorate: string;
  requiredSkills: string[];
  proficiencyLevel: "Basic" | "Intermediate" | "Advanced" | "Expert";
  description: string;
};

export type JobDescription = {
  position: string;
  department: string;
  division: string;
  directorate: string;
  responsibilities: string[];
  requirements: string[];
  relatedSkills: string[];
};

export const DATA_SOURCES = [
  { name: "SAP HR", scope: "Employee master, position, organization, career history", status: "Mocked" },
  { name: "MCU", scope: "Health fit status and HSE medical eligibility", status: "Placeholder" },
  { name: "Payroll", scope: "Grade, job level, payroll-related employee attributes", status: "Placeholder" },
  { name: "Performance", scope: "Performance rating, potential, readiness trend", status: "Mocked via talentData" },
  { name: "LMS", scope: "Training history, certification, learning plan status", status: "Placeholder" },
  { name: "Manual HR Input", scope: "Validation notes, succession decision, panel comments", status: "Placeholder" },
] as const;

const orgUnits: OrgUnit[] = [
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Mining", department: "Mining Operations", positions: ["Mining Operations Manager", "Pit Superintendent", "Production Supervisor", "Mine Operations Officer"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Hauling & CPP", department: "Coal Processing Plant", positions: ["CPP Manager", "Process Plant Superintendent", "CPP Supervisor", "Port & Hauling Coordinator"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Mine Planning", department: "Mine Planning", positions: ["Mine Planning Manager", "Long Term Planning Engineer", "Short Term Planning Engineer", "Survey Superintendent"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Geology & Exploration", department: "Geology", positions: ["Geology Manager", "Resource Geologist", "Grade Control Specialist", "Exploration Officer"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Mining Infrastructure & Project", department: "Engineering Project", positions: ["Engineering Project Manager", "Civil Project Engineer", "Electrical Engineer", "Project Control Specialist"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Safety", department: "HSE", positions: ["HSE Manager", "Safety Superintendent", "Emergency Response Coordinator", "HSE Officer"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Environment", department: "Environment", positions: ["Environment Manager", "Reclamation Specialist", "Water Management Engineer", "Biodiversity Officer"] },
  { directorate: "OPERATION & HSE DIRECTORATE", division: "Hauling & CPP", department: "Hauling & Logistics", positions: ["Logistics Superintendent", "Hauling Supervisor", "Port & Hauling Coordinator", "Road Maintenance Supervisor"] },
  { directorate: "FINANCE DIRECTORATE", division: "Accounting & Control", department: "Finance", positions: ["Finance Business Partner Manager", "Senior Management Accountant", "Budget Analyst", "Internal Audit Specialist"] },
  { directorate: "FINANCE DIRECTORATE", division: "Internal Audit", department: "Internal Audit", positions: ["Internal Audit Manager", "Senior Internal Auditor", "IT Auditor", "Compliance Auditor"] },
  { directorate: "MARKETING DIRECTORATE", division: "Marketing & Sales", department: "Commercial", positions: ["Commercial Manager", "Coal Marketing Specialist", "Customer Contract Officer", "Market Analyst"] },
  { directorate: "LEGAL DIRECTORATE", division: "Legal & Compliance", department: "Legal & Compliance", positions: ["Legal & Compliance Manager", "Senior Legal Counsel", "Compliance Specialist", "Contract Counsel"] },
  { directorate: "HRGS DIRECTORATE", division: "Human Capital", department: "Human Resources", positions: ["HR Manager", "HR Business Partner", "People Development Specialist", "Recruitment Officer"] },
  { directorate: "HRGS DIRECTORATE", division: "Learning & Development", department: "Learning & Development", positions: ["People Development Manager", "Learning Design Specialist", "Technical Trainer", "Assessment Specialist"] },
  { directorate: "HRGS DIRECTORATE", division: "Community Relation", department: "Community Development", positions: ["Community Development Manager", "CSR Specialist", "External Relations Officer"] },
];

const positionSkills: PositionSkill[] = [
  skill("Mining Operations Manager", "Mining Operations", ["Mine production planning", "Fleet productivity", "Contractor management", "HSE leadership", "Cost control"], "Expert", "Memimpin target produksi tambang dengan kontrol keselamatan, biaya, produktivitas alat, dan koordinasi kontraktor."),
  skill("Pit Superintendent", "Mining Operations", ["Pit control", "Daily mine plan execution", "Supervisor coaching", "Dispatch coordination", "Safety inspection"], "Expert", "Mengendalikan operasi pit harian agar sesuai sequence, kualitas batubara, dan target produksi."),
  skill("Production Supervisor", "Mining Operations", ["Shift management", "Equipment allocation", "Coal quality awareness", "Frontline safety", "Problem solving"], "Advanced", "Mengawasi tim shift produksi, alokasi alat, dan eksekusi aktivitas mining harian."),
  skill("Mine Planning Manager", "Mine Planning", ["Long term mine planning", "Reserve optimization", "Scheduling", "Geotechnical awareness", "Stakeholder alignment"], "Expert", "Mengelola rencana tambang jangka menengah-panjang agar selaras dengan cadangan, target produksi, dan keekonomian."),
  skill("Plant Maintenance Manager", "Plant Maintenance", ["Maintenance strategy", "Reliability engineering", "Shutdown planning", "SAP PM", "Safety leadership"], "Expert", "Menjamin availability heavy equipment dan plant melalui strategi maintenance yang terukur."),
  skill("Reliability Engineer", "Plant Maintenance", ["Failure analysis", "RCM", "Condition monitoring", "Maintenance analytics", "Root cause analysis"], "Advanced", "Menganalisis reliability equipment dan mengurangi downtime melalui improvement berbasis data."),
  skill("HSE Manager", "HSE", ["Risk management", "Incident investigation", "Safety culture", "Compliance audit", "Emergency response"], "Expert", "Memimpin sistem manajemen keselamatan, kepatuhan, dan budaya safety operasi tambang."),
  skill("Environment Manager", "Environment", ["Reclamation planning", "Water management", "Environmental compliance", "Biodiversity", "Mine closure"], "Expert", "Mengelola kepatuhan lingkungan, reklamasi, dan pengendalian dampak operasi tambang."),
  skill("Supply Chain Manager", "Supply Chain", ["Strategic sourcing", "Contract management", "Warehouse control", "Vendor performance", "Procurement governance"], "Expert", "Menjamin ketersediaan material, jasa, dan kontrak kritikal untuk operasi tambang."),
  skill("HR Manager", "Human Resources", ["Workforce planning", "Talent management", "Industrial relations", "People analytics", "Coaching"], "Advanced", "Mengelola strategi SDM, hubungan industrial, dan pipeline talent untuk kebutuhan operasi tambang."),
  skill("Finance Business Partner Manager", "Finance", ["Budgeting", "Mine cost analysis", "Financial modeling", "SAP FICO", "Business partnering"], "Advanced", "Mendukung keputusan operasional melalui analisis biaya, budget, dan financial insight."),
  skill("IT Manager", "Information Technology", ["IT service management", "Cybersecurity", "Mining system support", "Data platform", "Vendor management"], "Advanced", "Mengelola layanan teknologi, infrastruktur, dan sistem digital pendukung operasi."),
  skill("Commercial Manager", "Commercial", ["Coal market analysis", "Contract negotiation", "Customer management", "Sales planning", "Pricing strategy"], "Expert", "Mengelola pemasaran batubara, kontrak pelanggan, dan analisis pasar."),
  skill("Community Development Manager", "Community Development", ["Stakeholder engagement", "CSR program design", "Conflict resolution", "Social impact measurement", "Government relations"], "Advanced", "Mengelola hubungan masyarakat, program CSR, dan risiko sosial sekitar area operasi."),
  skill("Mine Production Superintendent", "Mining Operations", ["Mine production planning", "Fleet productivity", "Pit control", "HSE leadership", "Cost control"], "Expert", "Mengendalikan produksi tambang harian dan mingguan agar memenuhi target volume, kualitas, biaya, dan keselamatan."),
  skill("HR Business Partner", "Human Resources", ["Workforce planning", "Talent management", "Industrial relations", "People analytics", "Business partnering"], "Advanced", "Menjadi partner fungsi operasi dalam isu people, organisasi, hubungan industrial, dan pipeline talent."),
  skill("Maintenance Supervisor", "Plant Maintenance", ["Heavy equipment maintenance", "Reliability engineering", "Shutdown planning", "SAP PM", "Root cause analysis"], "Advanced", "Mengawasi pekerjaan maintenance agar availability alat dan plant terjaga."),
  skill("Senior Management Accountant", "Finance", ["Budgeting", "Mine cost analysis", "Financial modeling", "SAP FICO", "Business partnering"], "Advanced", "Mengelola analisis biaya dan budget untuk mendukung keputusan operasional."),
  skill("Senior Safety Officer", "HSE", ["Risk assessment", "Incident investigation", "SMKP", "Safety culture", "Emergency response"], "Advanced", "Memastikan pengendalian risiko kritikal dan kepatuhan keselamatan di area operasi."),
  skill("Senior Mine Geologist", "Geology", ["Geological modeling", "Coal quality", "Resource estimation", "Mine reconciliation", "Grade control"], "Advanced", "Menjaga akurasi model geologi, kualitas batubara, dan rekonsiliasi resource."),
  skill("Procurement Lead", "Supply Chain", ["Strategic sourcing", "Contract management", "Vendor performance", "SAP MM", "Procurement governance"], "Advanced", "Memimpin sourcing, negosiasi, dan performa vendor untuk kebutuhan operasi."),
  skill("Data & Integration Lead", "Information Technology", ["Data architecture", "SAP integration", "Cloud platform", "Cybersecurity", "IT service management"], "Advanced", "Mengelola integrasi data, platform digital, dan reliability layanan IT."),
  skill("Senior Mine Planning Engineer", "Mine Planning", ["Long-term mine planning", "Deswik", "Reserve optimization", "Scheduling", "Economic evaluation"], "Advanced", "Menyusun rencana tambang yang optimal secara sequence, cadangan, dan keekonomian."),
  skill("Community Development Specialist", "Community Development", ["Social mapping", "CSR program design", "Impact measurement", "Stakeholder engagement", "Conflict resolution"], "Advanced", "Menjalankan program community development berbasis pemetaan sosial dan dampak."),
  skill("CPP Shift Supervisor", "Coal Processing Plant", ["Coal handling", "Plant operations", "Quality control", "Shift management", "Frontline safety"], "Advanced", "Mengawasi operasi shift CPP, throughput, kualitas, dan keselamatan proses."),
  skill("Senior Legal Counsel", "Legal & Compliance", ["Mining law", "Contract law", "Compliance", "Corporate governance", "Legal risk management"], "Advanced", "Menangani legal advice, kontrak, perizinan, dan risiko kepatuhan perusahaan."),
  skill("Environmental Engineer", "Environment", ["Mine rehabilitation", "Water management", "Environmental monitoring", "AMDAL", "Environmental compliance"], "Advanced", "Mengelola monitoring lingkungan, reklamasi, dan kepatuhan AMDAL."),
  skill("Learning Design Specialist", "Learning & Development", ["Competency framework", "Learning design", "Assessment", "LMS analytics", "Facilitation"], "Advanced", "Merancang program pembelajaran, assessment, dan pengembangan kompetensi."),
  skill("Hauling Supervisor", "Hauling & Logistics", ["Hauling operations", "Dispatch", "Road maintenance", "Fatigue management", "Frontline safety"], "Advanced", "Mengawasi aktivitas hauling, dispatch, kondisi jalan, dan risiko fatigue."),
  skill("Senior Internal Auditor", "Internal Audit", ["Risk-based audit", "Data analytics", "Internal control", "Fraud assessment", "Audit reporting"], "Advanced", "Menjalankan audit berbasis risiko dan insight kontrol internal."),
  skill("Senior Surveyor", "Mine Survey", ["Mine surveying", "Drone mapping", "Volume reconciliation", "GIS", "Stockpile reconciliation"], "Advanced", "Memastikan data survey, volume, dan mapping tambang akurat."),
  skill("Corporate Communication Lead", "Corporate Affairs", ["Corporate communication", "Crisis communication", "Media relations", "ESG reporting", "Stakeholder messaging"], "Advanced", "Mengelola komunikasi korporat, isu publik, dan narasi ESG."),
  skill("Civil Project Engineer", "Engineering Project", ["Civil engineering", "Project control", "Contractor supervision", "Cost estimation", "HSE construction"], "Advanced", "Mengelola engineering project sipil dari planning, eksekusi, hingga kontrol biaya dan safety."),
  skill("Coal Marketing Specialist", "Commercial", ["Coal market analysis", "Contract negotiation", "Customer management", "Sales planning", "Pricing strategy"], "Advanced", "Menganalisis pasar dan mendukung kontrak penjualan batubara."),
];

const jobDescriptions: JobDescription[] = positionSkills.map((position) => ({
  position: position.position,
  department: position.department,
  division: position.division,
  directorate: position.directorate,
  responsibilities: [
    `Menetapkan target dan prioritas kerja ${position.department} berbasis RKAB, KPI operasi, risiko, dan kepatuhan.`,
    `Mengelola eksekusi aktivitas ${position.position} lintas fungsi agar aman, efisien, dan terdokumentasi.`,
    "Memonitor KPI, melakukan problem solving, dan memastikan corrective action selesai tepat waktu.",
    "Membina successor, mengembangkan kompetensi tim, dan memastikan knowledge transfer untuk posisi kritikal.",
  ],
  requirements: [
    `Penguasaan ${position.requiredSkills.slice(0, 3).join(", ")}.`,
    "Pengalaman di lingkungan coal mining, kontraktor tambang, industri berat, atau fungsi support operasi.",
    "Mampu menggunakan data operasional/keuangan/HSE untuk menyusun rekomendasi keputusan.",
  ],
  relatedSkills: position.requiredSkills,
}));

export async function listEmployeeMaster(): Promise<EmployeeMaster[]> {
  const candidates = await listTalentDevelopmentCandidates();
  const mapped = candidates.map((candidate) => {
    const department = displayValue(candidate.department);
    const unit = resolveOrgUnit(department, candidate.currentPosition ?? "");
    return {
      profileId: candidate.id,
      employeeId: displayValue(candidate.nik ?? candidate.id),
      name: displayValue(candidate.name),
      currentPosition: normalizePositionName(candidate.currentPosition),
      currentLevel: displayValue(candidate.track.jobLevel ?? inferCareerLevel(candidate.currentPosition ?? "")),
      department,
      division: displayValue(candidate.track.division ?? unit.division),
      directorate: normalizeDirectorate(candidate.track.directorate ?? unit.directorate),
      supervisorName: displayValue(candidate.supervisorName),
      joinDate: candidate.joinDate.toISOString(),
      birthDate: candidate.birthDate?.toISOString() ?? null,
      retirementAge: candidate.retirementAge,
      retirementExtendedUntil: candidate.retirementExtendedUntil?.toISOString() ?? null,
      retirementNotes: candidate.retirementNotes,
      employmentStatus: "Permanent",
      lastPromotionDate: candidate.track.lastPromotionDate ?? estimateLastPromotion(candidate.joinDate, candidate.yearsOfService),
      currentPositionDuration: candidate.track.currentPositionDuration ?? null,
      performance: candidate.track.performance ?? [],
      jobDescription: displayValue(candidate.track.jobDescription),
      workLocation: displayValue(candidate.track.workLocation),
      aspiration: displayValue(candidate.track.aspiration),
      currentSkills: candidate.track.technical ?? [],
      behavioralSkills: candidate.track.behavioral ?? [],
      certifications: candidate.track.certifications ?? [],
      projects: candidate.track.projects ?? [],
      projectImpact: candidate.track.projectImpact ?? "-",
      supervisorNotes: candidate.track.supervisorNotes ?? "-",
      assessment: candidate.track.assessment ?? {},
      strength: candidate.track.strength ?? inferStrengths(candidate.track.technical ?? [], candidate.track.behavioral ?? []),
      weakness: candidate.track.weakness ?? inferWeaknesses(candidate.currentPosition ?? "", candidate.track.technical ?? []),
      careerHistory: candidate.track.careerHistory ?? [displayValue(candidate.currentPosition)],
      developmentPrograms: candidate.track.developmentPrograms ?? [],
      patScore: typeof candidate.track.patScore === "number" ? candidate.track.patScore : average(candidate.track.performance ?? []),
      patComment: displayValue(candidate.track.patComment ?? candidate.track.supervisorNotes),
      successor: "Belum ada kandidat",
      talentClass: candidate.track.talentClass ?? getTalentClass(candidate.track.potential, candidate.track.readiness),
      promotionStatus: normalizePromotionStatus(
        candidate.track.promotionStatus,
        candidate.track.nextPromotionPic,
        candidate.track.promotionStatus ? getPromotionStatus(candidate.track.performance ?? [], candidate.track.potential, candidate.track.readiness) : "-",
      ),
      nextPromotionPic: candidate.track.nextPromotionPic ?? "-",
    };
  });

  return mapped;
}

export function listOrgUnits() {
  return orgUnits;
}

export function listPositionSkills(filters: ModuleFilters = {}) {
  return positionSkills.filter((row) => matchesOrgFilters(row, filters) && matchesKeyword([row.position, row.department, row.division, row.directorate, row.description, ...row.requiredSkills], filters.q));
}

export function listJobDescriptions(filters: ModuleFilters = {}) {
  return jobDescriptions.filter((row) => matchesOrgFilters(row, filters) && matchesKeyword([row.position, row.department, row.division, row.directorate, ...row.responsibilities, ...row.requirements, ...row.relatedSkills], filters.q));
}

export function getFilterOptions() {
  const orgOptions = uniqueOrgOptions(orgUnits.map(({ directorate, division, department }) => ({ directorate, division, department })));
  return {
    orgOptions,
    directorates: [...DIRECTORATES],
    divisions: uniqueSorted(orgOptions.map((row) => row.division)),
    departments: uniqueSorted(orgOptions.map((row) => row.department)),
  };
}

export async function getEmployeeFilterOptions() {
  const employees = await listEmployeeMaster();
  const orgOptions = uniqueOrgOptions(employees.map(({ directorate, division, department }) => ({ directorate, division, department })));

  return {
    orgOptions,
    directorates: [...DIRECTORATES],
    divisions: uniqueSorted(orgOptions.map((row) => row.division)),
    departments: uniqueSorted(orgOptions.map((row) => row.department)),
    employees: uniqueSorted(employees.map((employee) => employee.name)),
    positions: uniqueSorted(employees.map((employee) => employee.currentPosition)),
  };
}

export async function listPromotionEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees
    .filter((employee) => hasPromotionStatus(employee.promotionStatus))
    .map((employee) => ({
      ...employee,
      timeInCurrentPosition: employee.currentPositionDuration ?? calculateYears(employee.lastPromotionDate),
    }));
}

export async function listRetirementMonitoring(filters: ModuleFilters = {}) {
  const candidates = await listTalentDevelopmentCandidates();
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  const includeAll = filters.window === "all";
  const birthDates = new Map(candidates.map((candidate, index) => [
    candidate.id,
    candidate.birthDate ?? estimateBirthDate(candidate.yearsOfService, index),
  ]));

  return employees
    .map((employee) => {
      const birthDate = birthDates.get(employee.profileId) ?? estimateBirthDate(12, 0);
      const currentAge = calculateAge(birthDate);
      const contractualRetirementAge = employee.retirementAge ?? 55;
      const defaultRetirementDate = addYears(birthDate, contractualRetirementAge);
      const effectiveRetirementDate = employee.retirementExtendedUntil
        ? new Date(employee.retirementExtendedUntil)
        : defaultRetirementDate;
      const remainingDays = daysUntil(effectiveRetirementDate);
      const yearsToRetirement = Number((remainingDays / 365).toFixed(1));
      return {
        ...employee,
        birthDate: birthDate.toISOString(),
        currentAge,
        retirementAge: contractualRetirementAge,
        defaultRetirementDate: defaultRetirementDate.toISOString(),
        retirementDate: effectiveRetirementDate.toISOString(),
        extensionStatus: employee.retirementExtendedUntil ? "Extended" : "Default",
        remainingDays,
        yearsToRetirement,
        monitoringWindow: "Default list: 5 tahun mendekati pensiun; status warning dimulai 2 tahun menjelang pensiun",
        remainingTime: formatRemainingTime(remainingDays),
        retirementStatus: getRetirementStatus(remainingDays),
      };
    })
    .filter((employee) => includeAll || employee.yearsToRetirement <= 5)
    .sort((a, b) => new Date(a.retirementDate).getTime() - new Date(b.retirementDate).getTime() || a.name.localeCompare(b.name));
}

export async function listDevelopmentProgramEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees
    .filter((employee) => employee.developmentPrograms.some(isFastTrackProgram))
    .map((employee, index) => ({
      profileId: employee.profileId,
      employeeName: employee.name,
      currentPosition: employee.currentPosition,
      directorate: employee.directorate,
      division: employee.division,
      department: employee.department,
      lastPromotionDate: employee.lastPromotionDate,
      timeInCurrentPosition: employee.currentPositionDuration ?? calculateYears(employee.lastPromotionDate),
      developmentProgramType: "Fast Track / DP",
      programName: employee.developmentPrograms.find(isFastTrackProgram) ?? "DP",
      patScore: employee.patScore,
      patComment: employee.patComment,
      joinYear: new Date(employee.joinDate).getFullYear(),
    }));
}

export async function listRotationRecommendations(targetPosition = "Mining Operations Manager", filters: ModuleFilters = {}) {
  const candidates = await listTalentDevelopmentCandidates();
  const ranked = rankTalentCandidates(candidates, targetPosition);
  const employees = await listEmployeeMaster();
  const targetSkills = getRequiredSkills(targetPosition);
  const targetJob = jobDescriptions.find((row) => row.position === targetPosition);
  const targetLevel = positionLevelRank(targetPosition);

  return ranked.map((candidate) => {
    const employee = employees.find((item) => item.profileId === candidate.id);
    const currentSkills = candidate.track.technical ?? [];
    const matchedSkills = targetSkills.filter((required) => currentSkills.some((current) => skillMatches(current, required)));
    const fallbackMatched = matchedSkills.length ? matchedSkills : currentSkills.slice(0, 3);
    const missingSkills = targetSkills.filter((required) => !fallbackMatched.some((matched) => skillMatches(matched, required))).slice(0, 4);
    return {
      profileId: candidate.id,
      targetPosition,
      candidateName: candidate.name,
      currentPosition: displayValue(candidate.currentPosition),
      directorate: employee?.directorate ?? resolveOrgUnit(candidate.department ?? "", candidate.currentPosition ?? "").directorate,
      division: employee?.division ?? resolveOrgUnit(candidate.department ?? "", candidate.currentPosition ?? "").division,
      department: displayValue(candidate.department),
      matchedSkills: fallbackMatched,
      missingSkills,
      developmentNeed: missingSkills.length ? `IDP: ${missingSkills.slice(0, 2).join(", ")}` : "Maintain readiness melalui stretch assignment",
      matchScore: candidate.matchScore,
      recommendationNote: candidate.readiness === "Ready now"
        ? `Kandidat kuat untuk ${targetPosition}; validasi dengan JD: ${targetJob?.responsibilities[0] ?? "role scope"}.`
        : `Kandidat potensial; tutup gap ${missingSkills[0] ?? "scope posisi"} sebelum mobility.`,
    };
  }).filter((row) => {
    const samePosition = normalize(row.currentPosition) === normalize(targetPosition);
    const candidateLevel = positionLevelRank(row.currentPosition);
    const aboveTarget = Boolean(targetLevel && candidateLevel && candidateLevel > targetLevel);
    if (samePosition || aboveTarget) return false;
    return filterEmployees([{
    profileId: row.profileId,
    employeeId: row.profileId,
    name: row.candidateName,
    currentPosition: row.currentPosition,
    currentLevel: "",
    department: row.department,
    division: row.division,
    directorate: row.directorate,
    supervisorName: "-",
    joinDate: "",
    birthDate: null,
    retirementAge: null,
    retirementExtendedUntil: null,
    retirementNotes: null,
    employmentStatus: "",
    lastPromotionDate: "",
    currentPositionDuration: null,
    performance: [],
    jobDescription: "-",
    workLocation: "-",
    aspiration: "-",
    currentSkills: [],
    behavioralSkills: [],
    certifications: [],
    projects: [],
    projectImpact: "-",
    supervisorNotes: "-",
    assessment: {},
    careerHistory: [],
    strength: [],
    weakness: [],
    developmentPrograms: [],
    patScore: null,
    patComment: "-",
    successor: "",
    talentClass: "",
    promotionStatus: "Pending",
    nextPromotionPic: "-",
  }], filters).length > 0;
  }).slice(0, 10);
}

export async function listSkillGapEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees
    .map((employee) => buildGapRow(employee, employee.currentPosition))
    .sort((a, b) => b.skillGap.length - a.skillGap.length || a.employeeName.localeCompare(b.employeeName));
}

export async function listLearningRecommendations(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.slice(0, 14).map((employee, index) => {
    const promotionTarget = getPromotionTarget(employee.currentPosition);
    const currentGap = buildGapRow(employee, employee.currentPosition);
    const promotionGap = buildGapRow(employee, promotionTarget);
    const primaryGap = promotionGap.skillGap[0] ?? currentGap.skillGap[0] ?? "Leadership impact";
    return {
      profileId: employee.profileId,
      employeeName: employee.name,
      currentPosition: employee.currentPosition,
      targetPosition: promotionTarget,
      directorate: employee.directorate,
      division: employee.division,
      department: employee.department,
      currentPositionGap: currentGap.skillGap.length ? currentGap.skillGap.join(", ") : "No critical gap",
      promotionGap: promotionGap.skillGap.length ? promotionGap.skillGap.join(", ") : "Ready for promotion validation",
      recommendationType: ["Coaching", "Mentoring", "Training", "Certification", "Project Assignment"][index % 5],
      recommendationName: recommendationFor(primaryGap, index),
      projectOjtPlan: projectOjtFor(primaryGap, employee.currentPosition, promotionTarget),
      coachingPlan: coachingFor(primaryGap, employee.currentPosition),
      certificationPlan: certificationFor(primaryGap, employee.currentPosition),
      successMetric: successMetricFor(primaryGap),
      timeline: index % 2 === 0 ? "90 hari" : "6 bulan",
      priority: index % 4 === 0 ? "High" : index % 4 === 1 ? "Medium" : "Low",
      projectStatus: activityStatus(index),
      coachingStatus: activityStatus(index + 1),
      certificationStatus: activityStatus(index + 2),
      status: activityStatus(index + 1),
    };
  });
}

export async function listCoachingGovernance(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.map((employee, index) => ({
    id: `${employee.profileId}-sample-coaching`,
    profileId: employee.profileId,
    employeeName: employee.name,
    currentPosition: employee.currentPosition,
    directorate: employee.directorate,
    division: employee.division,
    department: employee.department,
    coach: "-",
    goals: "-",
    discussion: "-",
    outcome: "-",
    followUp: "-",
    schedule: employee.joinDate,
    progress: "-",
    sessionNumber: index + 1,
    totalSessions: employees.length,
    status: "-",
  })).filter((row) => matchesKeyword([
    row.employeeName,
    row.currentPosition,
    row.department,
    row.division,
    row.directorate,
  ], filters.q));
}

export async function listLearningAlignment(filters: ModuleFilters = {}) {
  const recommendations = await listLearningRecommendations(filters);
  return recommendations.map((item, index) => ({
    profileId: item.profileId,
    employeeName: item.employeeName,
    currentPosition: item.currentPosition,
    directorate: item.directorate,
    division: item.division,
    department: item.department,
    competencyGap: item.promotionGap !== "Ready for promotion validation" ? item.promotionGap : item.currentPositionGap,
    trainingProgram: item.certificationPlan.replace("10% Certification/Formal: ", ""),
    learningProvider: index % 3 === 0 ? "Internal Academy" : index % 3 === 1 ? "External Certification Body" : "LMS Self-paced",
    linkedIdp: item.recommendationName,
    improvementMetric: item.successMetric,
    status: index % 3 === 0 ? "Mapped" : index % 3 === 1 ? "In Progress" : "Pending Enrollment",
  }));
}

export async function listCareerEvolution(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.slice(0, 12).map((employee, index) => {
    const promotionTarget = getPromotionTarget(employee.currentPosition);
    return {
      profileId: employee.profileId,
      employeeName: employee.name,
      currentPosition: employee.currentPosition,
      targetPosition: promotionTarget,
      directorate: employee.directorate,
      division: employee.division,
      department: employee.department,
      joinDate: employee.joinDate,
      lastPromotionDate: employee.lastPromotionDate,
      nextMilestone: index % 3 === 0 ? "Complete OJT project" : index % 3 === 1 ? "Close coaching action items" : "Finish formal certification",
      futureGrowthPath: `${employee.currentPosition} → ${promotionTarget}`,
      readiness: index % 4 === 0 ? "Ready with development" : index % 4 === 1 ? "Long-term pipeline" : "Ready for validation",
    };
  });
}

export function hasActiveFilters(filters: ModuleFilters) {
  return Boolean(filters.q || filters.employee || filters.position || filters.department || filters.division || filters.directorate);
}

function skill(position: string, department: string, requiredSkills: string[], proficiencyLevel: PositionSkill["proficiencyLevel"], description: string): PositionSkill {
  const unit = resolveOrgUnit(department, position);
  return { position, department, division: unit.division, directorate: unit.directorate, requiredSkills, proficiencyLevel, description };
}

function buildGapRow(employee: EmployeeMaster, targetPosition: string) {
  const requiredSkills = getRequiredSkills(targetPosition);
  const jobDescription = getJobDescription(targetPosition);
  const currentSkills = employee.currentSkills;
  const skillGap = requiredSkills.filter((required) => !currentSkills.some((current) => skillMatches(current, required))).slice(0, 4);
  const priorityImprovement = skillGap[0] ?? employee.weakness[0] ?? "Maintain critical role capability";
  return {
    profileId: employee.profileId,
    employeeName: employee.name,
    employeeSummary: `${employee.currentPosition} di ${employee.department} dengan masa kerja ${calculateYears(employee.joinDate)} dan masa posisi ${employee.currentPositionDuration ?? calculateYears(employee.lastPromotionDate)}. Histori: ${employee.careerHistory.slice(0, 2).join(" -> ") || "career history belum lengkap"}.`,
    currentPosition: employee.currentPosition,
    targetPosition,
    directorate: employee.directorate,
    division: employee.division,
    department: employee.department,
    requiredSkills,
    jobDescription,
    currentSkills,
    strength: employee.strength,
    weakness: employee.weakness,
    skillGap,
    aiGapAnalysis: buildAiGapAnalysis(employee, requiredSkills, skillGap, jobDescription),
    priorityImprovement,
    recommendedAction: recommendationFor(priorityImprovement, employee.name.length),
    actionPlan70: projectOjtFor(priorityImprovement, employee.currentPosition, targetPosition),
    actionPlan20: coachingFor(priorityImprovement, employee.currentPosition),
    actionPlan10: certificationFor(priorityImprovement, employee.currentPosition),
    gapSummary: skillGap.length === 0 ? "Skill utama sudah selaras." : `Perlu penguatan pada ${skillGap.slice(0, 2).join(" dan ")}.`,
  };
}

function getJobDescription(position: string) {
  const job = jobDescriptions.find((row) => row.position === position)
    ?? jobDescriptions.find((row) => normalize(position).includes(normalize(row.department)) || normalize(row.position).includes(normalize(position)));
  return job?.responsibilities.slice(0, 3) ?? [
    "Menjalankan scope posisi saat ini sesuai KPI fungsi, risiko, dan kepatuhan.",
    "Menggunakan data operasional untuk problem solving dan rekomendasi perbaikan.",
    "Berkoordinasi lintas fungsi untuk memastikan target kerja tercapai.",
  ];
}

function buildAiGapAnalysis(employee: EmployeeMaster, requiredSkills: string[], skillGap: string[], jobDescription: string[]) {
  const strengths = employee.strength.slice(0, 2).join(", ") || "strength utama belum lengkap";
  const weaknesses = employee.weakness.slice(0, 2).join(", ") || "weakness belum tervalidasi";
  const gapText = skillGap.length ? skillGap.slice(0, 2).join(", ") : "tidak ada gap kritikal";
  return `AI mock menilai ${employee.name} kuat pada ${strengths}, namun perlu menutup ${gapText}. Analisis mempertimbangkan posisi ${employee.currentPosition}, masa kerja ${calculateYears(employee.joinDate)}, masa posisi ${employee.currentPositionDuration ?? calculateYears(employee.lastPromotionDate)}, required skills OD (${requiredSkills.slice(0, 3).join(", ")}), job description OD (${jobDescription[0]}), serta weakness: ${weaknesses}.`;
}

function filterEmployees(employees: EmployeeMaster[], filters: ModuleFilters) {
  return employees.filter((employee) => matchesOrgFilters(employee, filters)
    && (!filters.employee || employee.name === filters.employee)
    && matchesKeyword([employee.name, employee.currentPosition, employee.department, employee.division, employee.directorate, ...employee.currentSkills], filters.q));
}

function matchesOrgFilters(row: { directorate: string; division: string; department: string; position?: string; currentPosition?: string }, filters: ModuleFilters) {
  return (!filters.directorate || row.directorate === filters.directorate)
    && (!filters.division || row.division === filters.division)
    && (!filters.department || row.department === filters.department)
    && (!filters.position || (row.position ?? row.currentPosition) === filters.position);
}

function matchesKeyword(values: Array<string | null | undefined>, keyword?: string) {
  if (!keyword) return true;
  const needle = keyword.toLocaleLowerCase("id-ID");
  return values.some((value) => value?.toLocaleLowerCase("id-ID").includes(needle));
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function uniqueOrgOptions(options: Array<{ directorate: string; division: string; department: string }>) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.directorate || !option.division || !option.department) return false;
    const key = `${option.directorate}::${option.division}::${option.department}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) =>
    a.directorate.localeCompare(b.directorate)
    || a.division.localeCompare(b.division)
    || a.department.localeCompare(b.department)
  );
}

function getRequiredSkills(position: string) {
  return positionSkills.find((row) => row.position === position)?.requiredSkills
    ?? positionSkills.find((row) => normalize(position).includes(normalize(row.department)) || normalize(row.position).includes(normalize(position)))?.requiredSkills
    ?? ["Leadership", "Stakeholder management", "Business acumen", "Data analysis"];
}

function getPromotionTarget(position: string) {
  if (/manager/i.test(position)) return `Head of ${position.replace(/manager/i, "").trim() || "Department"}`;
  if (/superintendent/i.test(position)) return position.replace(/superintendent/i, "Manager");
  if (/supervisor/i.test(position)) return position.replace(/supervisor/i, "Superintendent");
  if (/specialist|engineer|officer|analyst/i.test(position)) return `${position} Supervisor`;
  return `${position} Senior`;
}

function findSuccessor(employee: EmployeeMaster, employees: EmployeeMaster[]) {
  const sameFunction = employees
    .filter((candidate) => candidate.profileId !== employee.profileId && (candidate.department === employee.department || candidate.division === employee.division))
    .sort((a, b) => overlap(b.currentSkills, employee.currentSkills) - overlap(a.currentSkills, employee.currentSkills));
  return sameFunction[0]?.name ?? "Belum ada kandidat";
}

function resolveOrgUnit(department: string, position = "") {
  return orgUnits.find((unit) => unit.department === department)
    ?? orgUnits.find((unit) => unit.positions.includes(position))
    ?? { directorate: "OPERATION & HSE DIRECTORATE", division: department, department, positions: [] };
}

function normalizeDirectorate(value: string | null | undefined) {
  const normalized = displayValue(value).toLocaleLowerCase("id-ID");
  if (/marketing|commercial|sales/.test(normalized)) return "MARKETING DIRECTORATE";
  if (/legal|compliance/.test(normalized)) return "LEGAL DIRECTORATE";
  if (/hr|human|general|corporate|community/.test(normalized)) return "HRGS DIRECTORATE";
  if (/finance|audit|accounting|treasury|budget/.test(normalized)) return "FINANCE DIRECTORATE";
  return "OPERATION & HSE DIRECTORATE";
}

function inferCareerLevel(position: string) {
  if (/GM|Head/i.test(position)) return "GM/Head";
  if (/Manager/i.test(position)) return "Manager";
  if (/Superintendent/i.test(position)) return "Superintendent";
  if (/Supervisor/i.test(position)) return "Supervisor";
  if (/Specialist|Engineer|Analyst/i.test(position)) return "Specialist";
  if (/Officer/i.test(position)) return "Officer";
  return "Staff";
}

function estimateLastPromotion(joinDate: Date, yearsOfService: number) {
  const date = new Date(joinDate);
  date.setFullYear(date.getFullYear() + Math.max(1, Math.floor(yearsOfService / 2)));
  return date.toISOString();
}

function calculateYears(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return `${Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365)))} tahun`;
}

function positionLevelRank(position: string) {
  const level = inferCareerLevel(position);
  if (level === "GM/Head") return 5;
  if (level === "Manager") return 4;
  if (level === "Superintendent") return 3;
  if (level === "Supervisor") return 2;
  if (level === "Specialist" || level === "Officer" || level === "Staff") return 1;
  return 0;
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function getTalentClass(potential = 70, readiness = 70) {
  if (potential >= 88 && readiness >= 84) return "High Potential";
  if (potential >= 78 && readiness >= 76) return "Core Talent";
  return "Emerging Talent";
}

function getPromotionStatus(performance: number[], potential = 70, readiness = 70): EmployeeMaster["promotionStatus"] {
  const performanceAverage = performance.length ? performance.reduce((sum, value) => sum + value, 0) / performance.length : 70;
  const score = performanceAverage * 0.4 + potential * 0.3 + readiness * 0.3;
  if (score >= 88) return "Completed";
  if (score >= 82) return "Approved";
  if (score < 68) return "Rejected";
  return "Pending";
}

function normalizePromotionStatus(status: string | undefined, nextPromotionPic: string | undefined, fallback: string) {
  const normalized = status?.trim();
  if (normalized && !/^@\d+@$/.test(normalized)) return normalized;
  if (!normalized) return fallback;

  const nextStep = nextPromotionPic?.split("/")[0]?.trim();
  if (nextStep === "Approved Dir.") return "Verified by HROD";
  if (nextPromotionPic?.startsWith("Approved Dir./Bus. Head")) return "Verified by HROD";
  if (nextStep === "Verified by HROD") return "Verified by HRBP";
  if (nextStep === "Approved Div. Head") return "Submitted";
  return fallback;
}

function estimateBirthDate(yearsOfService: number, index: number) {
  const estimatedAge = Math.min(59, Math.max(37, Math.round(yearsOfService + 29 + (index % 8) * 1.7)));
  const date = new Date();
  date.setFullYear(date.getFullYear() - estimatedAge);
  date.setMonth(index % 12, 15);
  return date;
}

function calculateAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed = today.getMonth() > birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRemainingTime(days: number) {
  if (days < 0) return `${Math.abs(days)} hari overdue`;
  if (days < 365) return `${days} hari`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months ? `${years} tahun ${months} bulan` : `${years} tahun`;
}

function getRetirementStatus(remainingDays: number) {
  if (remainingDays < 0) return "Overdue";
  if (remainingDays <= 180) return "Critical";
  if (remainingDays <= 730) return "Warning";
  return "Normal";
}

function recommendationFor(gap: string, index: number) {
  const prefix = ["Coaching", "Mentoring", "Training", "Certification", "Project Assignment"][index % 5];
  if (/cost|budget|financial/i.test(gap)) return `${prefix}: Mine Cost & Budget Control`;
  if (/safety|hse|risk/i.test(gap)) return `${prefix}: Safety Leadership & Risk Control`;
  if (/data|analysis|analytics/i.test(gap)) return `${prefix}: Advanced Data Analysis`;
  return `${prefix}: ${gap} Development Sprint`;
}

function inferStrengths(technical: string[], behavioral: string[]) {
  return [
    technical[0],
    technical[1],
    behavioral[0],
  ].filter((item): item is string => Boolean(item)).slice(0, 3);
}

function inferWeaknesses(position: string, technical: string[]) {
  const current = technical.join(" ");
  const required = getRequiredSkills(position);
  const gaps = required.filter((skill) => !current.toLocaleLowerCase("id-ID").includes(skill.toLocaleLowerCase("id-ID")));
  return (gaps.length ? gaps : ["Cross-functional stakeholder alignment", "Data-driven decision making"]).slice(0, 3);
}

function projectOjtFor(gap: string, currentPosition: string, targetPosition: string) {
  if (/cost|budget|financial/i.test(gap)) return `70% Project/OJT: pimpin cost reduction mini-project pada ${currentPosition} dengan target saving terukur untuk kesiapan ${targetPosition}.`;
  if (/safety|hse|risk/i.test(gap)) return `70% Project/OJT: jalankan safety improvement project lintas shift dan review kontrol risiko kritikal.`;
  if (/data|analysis|analytics/i.test(gap)) return `70% Project/OJT: bangun dashboard KPI operasional sederhana dan gunakan dalam weekly performance review.`;
  return `70% Project/OJT: stretch assignment terkait ${gap} dengan output bisnis yang divalidasi atasan.`;
}

function coachingFor(gap: string, currentPosition: string) {
  if (/leadership|stakeholder|influence/i.test(gap)) return `20% Coaching/Mentoring: mentoring dua mingguan dengan Superintendent/Manager untuk decision making dan stakeholder alignment.`;
  return `20% Coaching/Mentoring: coaching bulanan dengan atasan ${currentPosition} untuk review progress IDP dan obstacle lapangan.`;
}

function certificationFor(gap: string, currentPosition: string) {
  if (/safety|hse|risk/i.test(gap) || /hse|safety/i.test(currentPosition)) return "10% Certification/Formal: refreshment K3/SMKP atau incident investigation.";
  if (/mine|pit|production|planning/i.test(currentPosition)) return "10% Certification/Formal: POP/POM, mine planning, atau short course operational excellence.";
  if (/cost|budget|financial/i.test(gap)) return "10% Certification/Formal: finance for non-finance atau mine cost control.";
  return "10% Certification/Formal: training/certification sesuai gap kompetensi utama.";
}

function successMetricFor(gap: string) {
  if (/cost|budget|financial/i.test(gap)) return "Cost variance membaik atau saving initiative tervalidasi oleh Finance/atasan.";
  if (/safety|hse|risk/i.test(gap)) return "Hazard control close-out rate meningkat dan tidak ada repeat finding kritikal.";
  if (/data|analysis|analytics/i.test(gap)) return "Dashboard dipakai minimal 4 kali dalam review KPI dan menghasilkan action item.";
  return "Output project disetujui atasan dan gap kompetensi turun minimal satu level.";
}

function activityStatus(index: number) {
  return ["Not Started", "On Progress", "Completed"][index % 3];
}

function skillMatches(current: string, required: string) {
  const a = normalize(current);
  const b = normalize(required);
  if (a.includes(b) || b.includes(a)) return true;

  const currentTokens = tokenizeSkill(current);
  const requiredTokens = tokenizeSkill(required);
  if (!currentTokens.length || !requiredTokens.length) return false;

  const matchedRequiredTokens = requiredTokens.filter((requiredToken) =>
    currentTokens.some((currentToken) => currentToken === requiredToken || currentToken.includes(requiredToken) || requiredToken.includes(currentToken))
  );

  return matchedRequiredTokens.length === requiredTokens.length;
}

function overlap(a: string[], b: string[]) {
  const set = new Set(a.map(normalize));
  return b.map(normalize).filter((item) => set.has(item)).length;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenizeSkill(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function displayValue(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim();
  return cleaned || "-";
}

function normalizePositionName(value: string | null | undefined) {
  const cleaned = displayValue(value);
  return POSITION_NAME_FIXES[cleaned] ?? cleaned;
}

function isFastTrackProgram(program: string) {
  return /dp|gdp|ecdp|mdp|cdp|fast/i.test(program.trim());
}

function hasPromotionStatus(status: string) {
  const cleaned = status.trim();
  return Boolean(cleaned && cleaned !== "-" && !/^data sample$/i.test(cleaned));
}
