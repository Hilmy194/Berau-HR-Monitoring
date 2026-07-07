import { listTalentDevelopmentCandidates, rankTalentCandidates } from "./talent-development.service";

export type ModuleFilters = {
  q?: string;
  directorate?: string;
  division?: string;
  department?: string;
  position?: string;
  employee?: string;
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
  joinDate: string;
  employmentStatus: string;
  lastPromotionDate: string;
  currentSkills: string[];
  careerHistory: string[];
  developmentPrograms: string[];
  successor: string;
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
  { directorate: "Operations", division: "Mining", department: "Mining Operations", positions: ["Mining Operations Manager", "Pit Superintendent", "Production Supervisor", "Mine Operations Officer"] },
  { directorate: "Operations", division: "Hauling & CPP", department: "Coal Processing Plant", positions: ["CPP Manager", "Process Plant Superintendent", "CPP Supervisor", "Port & Hauling Coordinator"] },
  { directorate: "Mining", division: "Mine Technical", department: "Mine Planning", positions: ["Mine Planning Manager", "Long Term Planning Engineer", "Short Term Planning Engineer", "Survey Superintendent"] },
  { directorate: "Mining", division: "Geology", department: "Geology", positions: ["Geology Manager", "Resource Geologist", "Grade Control Specialist", "Exploration Officer"] },
  { directorate: "Engineering", division: "Plant Engineering", department: "Plant Maintenance", positions: ["Plant Maintenance Manager", "Reliability Engineer", "Maintenance Planner", "HE Mechanic Supervisor"] },
  { directorate: "Engineering", division: "Project Engineering", department: "Engineering Project", positions: ["Engineering Project Manager", "Civil Project Engineer", "Electrical Engineer", "Project Control Specialist"] },
  { directorate: "HSE", division: "Safety", department: "HSE", positions: ["HSE Manager", "Safety Superintendent", "Emergency Response Coordinator", "HSE Officer"] },
  { directorate: "HSE", division: "Environment", department: "Environment", positions: ["Environment Manager", "Reclamation Specialist", "Water Management Engineer", "Biodiversity Officer"] },
  { directorate: "Supply Chain", division: "Procurement", department: "Supply Chain", positions: ["Supply Chain Manager", "Procurement Specialist", "Warehouse Supervisor", "Contract Administrator"] },
  { directorate: "HRGA", division: "Human Capital", department: "Human Resources", positions: ["HR Manager", "HR Business Partner", "People Development Specialist", "Recruitment Officer"] },
  { directorate: "Finance", division: "Accounting & Control", department: "Finance", positions: ["Finance Business Partner Manager", "Senior Management Accountant", "Budget Analyst", "Internal Audit Specialist"] },
  { directorate: "IT", division: "Digital & Infrastructure", department: "Information Technology", positions: ["IT Manager", "Business Analyst", "Infrastructure Engineer", "Data Analyst"] },
  { directorate: "Commercial", division: "Marketing & Sales", department: "Commercial", positions: ["Commercial Manager", "Coal Marketing Specialist", "Customer Contract Officer", "Market Analyst"] },
  { directorate: "Corporate Affairs", division: "Community & Legal", department: "Community Development", positions: ["Community Development Manager", "CSR Specialist", "External Relations Officer", "Legal Counsel"] },
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
    const department = candidate.department ?? "Belum diisi";
    const unit = resolveOrgUnit(department, candidate.currentPosition ?? "");
    return {
      profileId: candidate.id,
      employeeId: candidate.nik ?? candidate.id,
      name: candidate.name,
      currentPosition: candidate.currentPosition ?? "Belum diisi",
      currentLevel: candidate.track.jobLevel ?? inferCareerLevel(candidate.currentPosition ?? ""),
      department,
      division: unit.division,
      directorate: unit.directorate,
      joinDate: candidate.joinDate.toISOString(),
      employmentStatus: "Permanent",
      lastPromotionDate: estimateLastPromotion(candidate.joinDate, candidate.yearsOfService),
      currentSkills: candidate.track.technical ?? [],
      careerHistory: candidate.track.careerHistory ?? [candidate.currentPosition ?? "Belum diisi"],
      developmentPrograms: candidate.track.certifications ?? [],
      successor: "Menunggu mapping",
    };
  });

  return mapped.map((employee) => ({
    ...employee,
    successor: findSuccessor(employee, mapped),
  }));
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
  return {
    orgOptions: orgUnits.map(({ directorate, division, department }) => ({ directorate, division, department })),
    directorates: Array.from(new Set(orgUnits.map((row) => row.directorate))).sort(),
    divisions: Array.from(new Set(orgUnits.map((row) => row.division))).sort(),
    departments: Array.from(new Set(orgUnits.map((row) => row.department))).sort(),
  };
}

export async function getEmployeeFilterOptions() {
  const employees = await listEmployeeMaster();
  return {
    ...getFilterOptions(),
    employees: employees.map((employee) => employee.name).sort(),
  };
}

export async function listPromotionEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.map((employee) => ({
    ...employee,
    timeInCurrentPosition: calculateYears(employee.lastPromotionDate),
  }));
}

export async function listDevelopmentProgramEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees
    .filter((employee) => employee.developmentPrograms.length > 0)
    .map((employee, index) => ({
      profileId: employee.profileId,
      employeeName: employee.name,
      currentPosition: employee.currentPosition,
      directorate: employee.directorate,
      division: employee.division,
      department: employee.department,
      developmentProgramType: index % 3 === 0 ? "Certification" : index % 3 === 1 ? "Leadership Program" : "Technical Academy",
      programName: employee.developmentPrograms[0] ?? "Operational Excellence Program",
      joinYear: 2024 + (index % 3),
      status: index % 4 === 0 ? "Planned" : index % 4 === 1 ? "In Progress" : "Completed",
    }));
}

export async function listRotationRecommendations(targetPosition = "Mining Operations Manager", filters: ModuleFilters = {}) {
  const candidates = await listTalentDevelopmentCandidates();
  const ranked = rankTalentCandidates(candidates, targetPosition);
  const employees = await listEmployeeMaster();
  const targetSkills = getRequiredSkills(targetPosition);
  const targetJob = jobDescriptions.find((row) => row.position === targetPosition);

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
      currentPosition: candidate.currentPosition ?? "Belum diisi",
      directorate: employee?.directorate ?? resolveOrgUnit(candidate.department ?? "", candidate.currentPosition ?? "").directorate,
      division: employee?.division ?? resolveOrgUnit(candidate.department ?? "", candidate.currentPosition ?? "").division,
      department: candidate.department ?? "Belum diisi",
      matchedSkills: fallbackMatched,
      missingSkills,
      developmentNeed: missingSkills.length ? `IDP: ${missingSkills.slice(0, 2).join(", ")}` : "Maintain readiness melalui stretch assignment",
      matchScore: candidate.matchScore,
      recommendationNote: candidate.readiness === "Ready now"
        ? `Kandidat kuat untuk ${targetPosition}; validasi dengan JD: ${targetJob?.responsibilities[0] ?? "role scope"}.`
        : `Kandidat potensial; tutup gap ${missingSkills[0] ?? "scope posisi"} sebelum rotasi.`,
    };
  }).filter((row) => filterEmployees([{
    profileId: row.profileId,
    employeeId: row.profileId,
    name: row.candidateName,
    currentPosition: row.currentPosition,
    currentLevel: "",
    department: row.department,
    division: row.division,
    directorate: row.directorate,
    joinDate: "",
    employmentStatus: "",
    lastPromotionDate: "",
    currentSkills: [],
    careerHistory: [],
    developmentPrograms: [],
    successor: "",
  }], filters).length > 0).slice(0, 10);
}

export async function listSkillGapEmployees(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.map((employee) => buildGapRow(employee, employee.currentPosition));
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
      status: index % 3 === 0 ? "Planned" : index % 3 === 1 ? "In Progress" : "Not Started",
    };
  });
}

export async function listCoachingGovernance(filters: ModuleFilters = {}) {
  const employees = filterEmployees(await listEmployeeMaster(), filters);
  return employees.slice(0, 12).map((employee, index) => ({
    profileId: employee.profileId,
    employeeName: employee.name,
    currentPosition: employee.currentPosition,
    directorate: employee.directorate,
    division: employee.division,
    department: employee.department,
    coach: employee.successor !== "Belum ada kandidat" ? employee.successor : "Line Manager",
    sessionCadence: index % 2 === 0 ? "Bi-weekly" : "Monthly",
    activeGoal: index % 3 === 0 ? "Improve cost control decision making" : index % 3 === 1 ? "Strengthen field leadership" : "Close competency gap from IDP",
    lastDiscussion: index % 2 === 0 ? "Reviewed progress and blockers on OJT project." : "Aligned next milestone and stakeholder support.",
    followUp: index % 2 === 0 ? "Submit project progress before next coaching." : "Schedule field observation with mentor.",
    nextSession: index % 2 === 0 ? "Next 14 days" : "Next month",
    status: index % 4 === 0 ? "Needs Attention" : index % 4 === 1 ? "On Track" : "Scheduled",
  }));
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
  const currentSkills = employee.currentSkills;
  const skillGap = requiredSkills.filter((required) => !currentSkills.some((current) => skillMatches(current, required))).slice(0, 4);
  return {
    profileId: employee.profileId,
    employeeName: employee.name,
    currentPosition: employee.currentPosition,
    targetPosition,
    directorate: employee.directorate,
    division: employee.division,
    department: employee.department,
    requiredSkills,
    currentSkills,
    skillGap,
    gapSummary: skillGap.length === 0 ? "Skill utama sudah selaras." : `Perlu penguatan pada ${skillGap.slice(0, 2).join(" dan ")}.`,
  };
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
    ?? { directorate: department === "Operations" ? "Operations" : "Corporate Services", division: department, department, positions: [] };
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

function recommendationFor(gap: string, index: number) {
  const prefix = ["Coaching", "Mentoring", "Training", "Certification", "Project Assignment"][index % 5];
  if (/cost|budget|financial/i.test(gap)) return `${prefix}: Mine Cost & Budget Control`;
  if (/safety|hse|risk/i.test(gap)) return `${prefix}: Safety Leadership & Risk Control`;
  if (/data|analysis|analytics/i.test(gap)) return `${prefix}: Advanced Data Analysis`;
  return `${prefix}: ${gap} Development Sprint`;
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

function skillMatches(current: string, required: string) {
  const a = normalize(current);
  const b = normalize(required);
  return a.includes(b) || b.includes(a) || overlap(a.split(""), b.split("")) > 4;
}

function overlap(a: string[], b: string[]) {
  const set = new Set(a.map(normalize));
  return b.map(normalize).filter((item) => set.has(item)).length;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
