/**
 * Succession Planning Service - PT Berau Coal Harmoni HR Monitoring
 * Manages succession pipelines, readiness tiers, and talent successor mappings.
 */

export type ReadinessLevel = "READY_NOW" | "READY_LATER" | "GENERAL_CANDIDATE";
export type SuccessionSource = "INTERNAL_SUBDIV" | "OUTSIDE_ORGANIZATION" | "GENERAL";

export interface SuccessorCandidate {
  name: string;
  nik?: string;
  currentPosition?: string;
  golongan?: string;
  department?: string;
  readiness: ReadinessLevel;
  source: SuccessionSource;
  priorityOrder?: number;
  notes?: string;
}

export interface SuccessionTarget {
  id: string;
  incumbentName: string;
  incumbentNik?: string;
  positionTitle: string;
  golongan?: string;
  directorate: string;
  division: string;
  department?: string;
  status: "CRITICAL_POSITION" | "MONITORED";
  successors: SuccessorCandidate[];
}

export interface SuccessorAssignment {
  targetIncumbentName: string;
  targetPositionTitle: string;
  targetGolongan?: string;
  targetDirectorate: string;
  targetDivision: string;
  readiness: ReadinessLevel;
  source: SuccessionSource;
  priorityOrder?: number;
  notes?: string;
}

export interface SuccessorDirectoryRow {
  name: string;
  currentPosition?: string;
  golongan?: string;
  department?: string;
  assignments: SuccessorAssignment[];
}

export interface SuccessionSummary {
  totalTargetPositions: number;
  totalUniqueSuccessors: number;
  readyNowCount: number;
  readyLaterCount: number;
  generalCount: number;
}

export const SUCCESSION_DATA: SuccessionTarget[] = [
  {
    id: "target-arya-dhamar",
    incumbentName: "Arya Dhamar Nugraha",
    incumbentNik: "10000055",
    positionTitle: "Mine Plan & Technical Services GM",
    golongan: "6B",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "MINE PLANNING & TECH. SERVICES DIVISION",
    department: "MINE PLANNING & TECH. SERVICES DIVISION",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Sutami Sitorus",
        nik: "11000414",
        currentPosition: "Mine Planning Senior Manager",
        golongan: "5C",
        department: "MINE PLANNING & TECH. SERVICES DIVISION",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 1,
        notes: "Calon Suksesor Prioritas 1",
      },
      {
        name: "Arintoko Saputro",
        currentPosition: "Mine Operation Senior Manager",
        golongan: "5B",
        department: "MINE OPERATION & SUPPORT DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 2,
        notes: "Calon Suksesor Prioritas 2",
      },
      {
        name: "Rahmantha Purba Anggana",
        currentPosition: "Occupational Health & Safety Senior Manager",
        golongan: "5B",
        department: "OCCUPATIONAL HEALTH & SAFETY DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 3,
        notes: "Calon Suksesor Prioritas 3",
      },
      {
        name: "Maurys Irwan",
        nik: "11001519",
        currentPosition: "Technical Services Senior Manager",
        golongan: "5D",
        department: "MINE PLANNING & TECH. SERVICES DIVISION",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 4,
        notes: "Calon Suksesor Prioritas 4",
      },
      {
        name: "Dian Permana Putra",
        currentPosition: "Gurimbang Mine Operation Manager",
        golongan: "5B",
        department: "GURIMBANG MINE OPERATION DEPARTMENT",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 5,
        notes: "Calon Suksesor Prioritas 5 (Dian PP)",
      },
      {
        name: "Alex Prabudi",
        nik: "11000769",
        currentPosition: "Short Term Mine Plan Manager",
        golongan: "5B",
        department: "SHORT TERM MINE PLAN DEPARTMENT",
        readiness: "READY_LATER",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 6,
        notes: "Calon Suksesor Prioritas 6 (Alex P)",
      },
      {
        name: "Lukman Hakim",
        currentPosition: "Geotechnic & Hydrology Manager",
        golongan: "5B",
        department: "GEOTECHNIC & HYDROLOGY DEPT",
        readiness: "READY_LATER",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 7,
        notes: "Calon Suksesor Prioritas 7",
      },
    ],
  },
  {
    id: "target-jimmi-idris",
    incumbentName: "Jimmi Idris",
    positionTitle: "Occupational Health & Safety GM",
    golongan: "6A",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    department: "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Maurys Irwan",
        nik: "11001519",
        currentPosition: "Technical Services Senior Manager",
        golongan: "5D",
        department: "MINE PLANNING & TECH. SERVICES DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 1,
      },
      {
        name: "Sutami Sitorus",
        nik: "11000414",
        currentPosition: "Mine Planning Senior Manager",
        golongan: "5C",
        department: "MINE PLANNING & TECH. SERVICES DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 2,
      },
      {
        name: "Robbi Darman",
        currentPosition: "Binungan Mine Operation Area 3 Mgr",
        golongan: "5B",
        department: "BINUNGAN MINE OPERATION AREA 3 DEPT",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 3,
      },
      {
        name: "Rahmantha Purba Anggana",
        currentPosition: "Occupational Health & Safety Senior Manager",
        golongan: "5B",
        department: "OCCUPATIONAL HEALTH & SAFETY DIVISION",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 4,
      },
      {
        name: "Arintoko Saputro",
        currentPosition: "Mine Operation Senior Manager",
        golongan: "5B",
        department: "MINE OPERATION & SUPPORT DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 5,
      },
      {
        name: "Dian Permana Putra",
        currentPosition: "Gurimbang Mine Operation Manager",
        golongan: "5B",
        department: "GURIMBANG MINE OPERATION DEPARTMENT",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 6,
      },
      {
        name: "Ongky Elisman",
        currentPosition: "Senior Specialist / Manager",
        golongan: "5B",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 7,
      },
      {
        name: "Andi Zulkarnain",
        currentPosition: "Safety / Operations Specialist",
        golongan: "5A",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 8,
      },
    ],
  },
  {
    id: "target-maurys-irwan",
    incumbentName: "Maurys Irwan",
    incumbentNik: "11001519",
    positionTitle: "Technical Services Senior Manager",
    golongan: "5D",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "MINE PLANNING & TECH. SERVICES DIVISION",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Lukman Hakim",
        currentPosition: "Geotechnic & Hydrology Manager",
        golongan: "5B",
        department: "GEOTECHNIC & HYDROLOGY DEPT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        notes: "Internal Subdiv - Ready Now",
      },
      {
        name: "Sindu Umboro",
        currentPosition: "G & H Monitoring & Dev. Senior Engineer",
        golongan: "4F",
        department: "GEOTECHNIC & HYDROLOGY DEPT",
        readiness: "READY_LATER",
        source: "INTERNAL_SUBDIV",
        notes: "Internal Subdiv - Ready Later",
      },
      {
        name: "Erri Jumalis Salam",
        nik: "11000354",
        currentPosition: "Mid Term Mine Plan Manager",
        golongan: "5B",
        department: "MID TERM MINE PLAN DEPARTMENT",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        notes: "Outside Org - Ready Now",
      },
      {
        name: "Rayhan Fajusha",
        currentPosition: "Mine Dev & Production Control Manager",
        golongan: "5B",
        department: "MINE DEV & PRODUCTION CONTROL DEPT",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        notes: "Outside Org - Ready Later",
      },
      {
        name: "Pandu Zea Ardiansyah",
        currentPosition: "BMO 2 Mine Manager",
        golongan: "4F",
        department: "BINUNGAN MINE OPERATION AREA 2 DEPT",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        notes: "Outside Org - Ready Later",
      },
    ],
  },
  {
    id: "target-arintoko-saputro",
    incumbentName: "Arintoko Saputro",
    positionTitle: "Mine Operation Senior Manager",
    golongan: "5B",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "MINE OPERATION & SUPPORT DIVISION",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Dian Permana Putra",
        currentPosition: "Gurimbang Mine Operation Manager",
        golongan: "5B",
        department: "GURIMBANG MINE OPERATION DEPARTMENT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 1,
        notes: "Calon 1",
      },
      {
        name: "Mando Godli . H. Sirait",
        currentPosition: "BMO 1 Mine Manager",
        golongan: "5B",
        department: "BMO AREA 1 DEPARTMENT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 2,
        notes: "Calon 2 (Mando Sirait)",
      },
      {
        name: "Nanang Nur Cahyadi",
        currentPosition: "Sambarata Mine Operation Manager",
        golongan: "5B",
        department: "SAMBARATA MINE OPERATION DEPARTMENT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 3,
        notes: "Calon 3 (Nanang Nur C)",
      },
      {
        name: "Robbi Darman",
        currentPosition: "Binungan Mine Operation Area 3 Mgr",
        golongan: "5B",
        department: "BINUNGAN MINE OPERATION AREA 3 DEPT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 4,
        notes: "Calon 4",
      },
    ],
  },
  {
    id: "target-rahmantha-purba",
    incumbentName: "Rahmantha Purba Anggana",
    positionTitle: "Occupational Health & Safety Senior Manager",
    golongan: "5B",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Ade Manjalo Nababan",
        currentPosition: "Mine Supervisor / Specialist",
        golongan: "4A",
        department: "LATI MINE OPERATION DEPARTMENT",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 1,
      },
      {
        name: "Azwar Fanani",
        currentPosition: "LMO Mine Manager (Act, New)",
        golongan: "4F",
        department: "LATI MINE OPERATION DEPARTMENT",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 2,
      },
      {
        name: "Tri Daryono Agustinus",
        currentPosition: "Agustinus Parapatan Mine Superintendent",
        golongan: "4F",
        department: "BMO AREA 1 DEPARTMENT",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 3,
      },
      {
        name: "Wahyudi",
        currentPosition: "Safety / Operational Superintendent",
        golongan: "4F",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 4,
      },
      {
        name: "Pandu Zea Ardiansyah",
        currentPosition: "BMO 2 Mine Manager",
        golongan: "4F",
        department: "BINUNGAN MINE OPERATION AREA 2 DEPT",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 5,
      },
      {
        name: "Tommy Yulian",
        currentPosition: "Safety Evaluation Specialist",
        golongan: "4D",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 6,
      },
      {
        name: "Saeful Aziz",
        currentPosition: "OHS Engineer",
        golongan: "4C",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 7,
      },
      {
        name: "Arief Hudiantoro",
        currentPosition: "Safety / Environment Specialist",
        golongan: "4D",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 8,
      },
      {
        name: "Ridho Ilham M",
        currentPosition: "OHS Coordinator",
        golongan: "4C",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 9,
      },
      {
        name: "Danang Kurniawan",
        currentPosition: "Safety Systems Engineer",
        golongan: "4C",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 10,
      },
      {
        name: "Anjas Prio Prakoso",
        currentPosition: "Mid Term Mine Plan Sr Engineer",
        golongan: "4F",
        department: "MID TERM MINE PLAN DEPARTMENT",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 11,
      },
      {
        name: "Iqbal Bastimi",
        currentPosition: "Safety Inspector",
        golongan: "4B",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 12,
      },
      {
        name: "Ida Wayan Supriharta",
        currentPosition: "OHS Superintendent",
        golongan: "5A",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 13,
      },
      {
        name: "Muhammad Adi Prasojo",
        currentPosition: "Geotechnical Sr Engineer",
        golongan: "4F",
        department: "GEOTECHNIC & HYDROLOGY DEPT",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 14,
      },
      {
        name: "Davi Tantra",
        currentPosition: "Safety & Emergency Response Specialist",
        golongan: "4D",
        readiness: "GENERAL_CANDIDATE",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 15,
      },
      {
        name: "Okky Warman",
        currentPosition: "Mine Development Senior Specialist",
        golongan: "4E",
        department: "MINE DEV & PRODUCTION CONTROL DEPT",
        readiness: "GENERAL_CANDIDATE",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 16,
      },
    ],
  },
  {
    id: "target-febriwiadi-djali",
    incumbentName: "Febriwiadi Djali",
    incumbentNik: "11000372",
    positionTitle: "System Compliance & Environment GM",
    golongan: "6A",
    directorate: "OPERATION & HSE DIRECTORATE",
    division: "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    department: "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    status: "CRITICAL_POSITION",
    successors: [
      {
        name: "Budi Santoso",
        nik: "11000407",
        currentPosition: "Survey & Geospatial Information Manager",
        golongan: "5A",
        department: "MINE PLANNING & TECH. SERVICES DIVISION",
        readiness: "READY_LATER",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 1,
        notes: "Usulan untuk di assessment suksesi",
      },
      {
        name: "Hifzil Kirmi",
        nik: "11000661",
        currentPosition: "Quality & Risk Management System Manager",
        golongan: "5B",
        department: "QUALITY & RISK MANAGEMENT SYSTEM DEPT",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 2,
        notes: "Usulan untuk di assessment suksesi",
      },
      {
        name: "Arintoko Saputro",
        nik: "11000215",
        currentPosition: "Mine Operation Senior Manager",
        golongan: "5B",
        department: "MINE OPERATION & SUPPORT DIVISION",
        readiness: "READY_NOW",
        source: "OUTSIDE_ORGANIZATION",
        priorityOrder: 3,
        notes: "Usulan untuk di assessment suksesi",
      },
      {
        name: "Apribowo Rossiyanto",
        nik: "11000464",
        currentPosition: "Environment, Mine Closure & DAS Senior Manager",
        golongan: "5C",
        department: "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
        readiness: "READY_NOW",
        source: "INTERNAL_SUBDIV",
        priorityOrder: 4,
        notes: "Usulan untuk di assessment suksesi",
      },
    ],
  },
];

/** Normalized string matching helper for employee names */
export function normalizeSuccessionName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if a candidate name matches a query target */
function matchesName(candidateName: string, queryName: string): boolean {
  const normCand = normalizeSuccessionName(candidateName);
  const normQuery = normalizeSuccessionName(queryName);
  if (!normCand || !normQuery) return false;
  if (normCand === normQuery) return true;
  if (normCand.includes(normQuery) || normQuery.includes(normCand)) return true;

  // Split into token parts for fuzzy checking
  const candTokens = normCand.split(" ").filter((t) => t.length > 2);
  const queryTokens = normQuery.split(" ").filter((t) => t.length > 2);
  if (candTokens.length > 0 && queryTokens.length > 0) {
    const matchCount = candTokens.filter((ct) => queryTokens.some((qt) => ct.includes(qt) || qt.includes(ct))).length;
    if (matchCount >= 2 || (candTokens.length === 1 && matchCount >= 1)) {
      return true;
    }
  }
  return false;
}

/** Checks whether a given employee name is tagged as a successor in the pipeline */
export function isSuccessorCandidate(employeeName: string | null | undefined): boolean {
  if (!employeeName) return false;
  for (const target of SUCCESSION_DATA) {
    for (const successor of target.successors) {
      if (matchesName(successor.name, employeeName)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns all succession assignments for a given employee name.
 * Directly answers the requirement: "Dia succession siapa?"
 */
export function getSuccessorAssignmentsFor(employeeName: string | null | undefined): SuccessorAssignment[] {
  if (!employeeName) return [];
  const assignments: SuccessorAssignment[] = [];

  for (const target of SUCCESSION_DATA) {
    for (const successor of target.successors) {
      if (matchesName(successor.name, employeeName)) {
        assignments.push({
          targetIncumbentName: target.incumbentName,
          targetPositionTitle: target.positionTitle,
          targetGolongan: target.golongan,
          targetDirectorate: target.directorate,
          targetDivision: target.division,
          readiness: successor.readiness,
          source: successor.source,
          priorityOrder: successor.priorityOrder,
          notes: successor.notes,
        });
      }
    }
  }

  return assignments;
}

/** Returns the entire succession pipeline list */
export function getSuccessionPipeline(): SuccessionTarget[] {
  return SUCCESSION_DATA;
}

/** Returns aggregate summary metrics for the succession pipeline */
export function getSuccessionSummary(): SuccessionSummary {
  const uniqueNames = new Set<string>();
  let readyNow = 0;
  let readyLater = 0;
  let general = 0;

  for (const target of SUCCESSION_DATA) {
    for (const succ of target.successors) {
      uniqueNames.add(normalizeSuccessionName(succ.name));
      if (succ.readiness === "READY_NOW") readyNow++;
      else if (succ.readiness === "READY_LATER") readyLater++;
      else general++;
    }
  }

  return {
    totalTargetPositions: SUCCESSION_DATA.length,
    totalUniqueSuccessors: uniqueNames.size,
    readyNowCount: readyNow,
    readyLaterCount: readyLater,
    generalCount: general,
  };
}

/** Returns an indexed flat list of all unique successors and their assignments */
export function listAllSuccessorsDirectory(): SuccessorDirectoryRow[] {
  const map = new Map<string, SuccessorDirectoryRow>();

  for (const target of SUCCESSION_DATA) {
    for (const succ of target.successors) {
      const key = normalizeSuccessionName(succ.name);
      const existing = map.get(key);
      const assignment: SuccessorAssignment = {
        targetIncumbentName: target.incumbentName,
        targetPositionTitle: target.positionTitle,
        targetGolongan: target.golongan,
        targetDirectorate: target.directorate,
        targetDivision: target.division,
        readiness: succ.readiness,
        source: succ.source,
        priorityOrder: succ.priorityOrder,
        notes: succ.notes,
      };

      if (!existing) {
        map.set(key, {
          name: succ.name,
          currentPosition: succ.currentPosition,
          golongan: succ.golongan,
          department: succ.department,
          assignments: [assignment],
        });
      } else {
        existing.assignments.push(assignment);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Check whether a given employee name is an incumbent leadership position */
export function isIncumbentName(employeeName: string | null | undefined): boolean {
  if (!employeeName) return false;
  return SUCCESSION_DATA.some((t) => matchesName(t.incumbentName, employeeName));
}

/** Get incumbent target information if the employee is an incumbent */
export function getIncumbentTargetFor(employeeName: string | null | undefined): SuccessionTarget | undefined {
  if (!employeeName) return undefined;
  return SUCCESSION_DATA.find((t) => matchesName(t.incumbentName, employeeName));
}

export interface SuccessionDisplayInfo {
  isTagged: boolean;
  isSuccessor: boolean;
  isIncumbent: boolean;
  asSuccessor: SuccessorAssignment[];
  asIncumbent?: {
    positionTitle: string;
    successorCount: number;
    topSuccessors: string[];
  };
}

export function getSuccessionDisplayInfo(employeeName: string | null | undefined): SuccessionDisplayInfo {
  const asSuccessor = getSuccessorAssignmentsFor(employeeName);
  const incumbentTarget = getIncumbentTargetFor(employeeName);

  const isSuccessor = asSuccessor.length > 0;
  const isIncumbent = Boolean(incumbentTarget);

  return {
    isTagged: isSuccessor || isIncumbent,
    isSuccessor,
    isIncumbent,
    asSuccessor,
    asIncumbent: incumbentTarget
      ? {
          positionTitle: incumbentTarget.positionTitle,
          successorCount: incumbentTarget.successors.length,
          topSuccessors: incumbentTarget.successors.slice(0, 3).map((s) => s.name),
        }
      : undefined,
  };
}

export interface AddSuccessorInput {
  targetIncumbentName: string;
  targetPositionTitle?: string;
  targetGolongan?: string;
  targetDirectorate?: string;
  targetDivision?: string;
  successorName: string;
  successorNik?: string;
  currentPosition?: string;
  golongan?: string;
  department?: string;
  readiness: ReadinessLevel;
  source: SuccessionSource;
  priorityOrder?: number;
  notes?: string;
}

export function addSuccessorToPipeline(input: AddSuccessorInput): SuccessionTarget {
  let target = SUCCESSION_DATA.find(
    (t) =>
      matchesName(t.incumbentName, input.targetIncumbentName) ||
      (input.targetPositionTitle && t.positionTitle.toLowerCase() === input.targetPositionTitle.toLowerCase())
  );

  const candidate: SuccessorCandidate = {
    name: input.successorName.trim(),
    nik: input.successorNik?.trim(),
    currentPosition: input.currentPosition?.trim(),
    golongan: input.golongan?.trim(),
    department: input.department?.trim(),
    readiness: input.readiness,
    source: input.source,
    priorityOrder: input.priorityOrder || 1,
    notes: input.notes?.trim(),
  };

  if (target) {
    const existingIndex = target.successors.findIndex((s) => matchesName(s.name, candidate.name));
    if (existingIndex >= 0) {
      target.successors[existingIndex] = candidate;
    } else {
      target.successors.push(candidate);
      target.successors.sort((a, b) => (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99));
    }
  } else {
    const id = `target-${normalizeSuccessionName(input.targetIncumbentName).replace(/\s+/g, "-")}-${Date.now()}`;
    target = {
      id,
      incumbentName: input.targetIncumbentName.trim(),
      positionTitle: input.targetPositionTitle?.trim() || "Leadership Position",
      golongan: input.targetGolongan?.trim() || "6A",
      directorate: input.targetDirectorate?.trim() || "OPERATION & HSE DIRECTORATE",
      division: input.targetDivision?.trim() || "OPERATIONS",
      status: "CRITICAL_POSITION",
      successors: [candidate],
    };
    SUCCESSION_DATA.push(target);
  }

  return target;
}

