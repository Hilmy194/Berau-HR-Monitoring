/**
 * Pure (DB-free) logic for the reporting-line import: markdown parsing,
 * supervisor resolution, and directorate / division / department inference.
 * Email and phone columns are intentionally never read.
 */

export type ReportingRow = {
  personnelNumber: string;
  name: string;
  positionName: string;
  department: string | null;
  supervisorName: string | null;
};

export type ResolvedRow = ReportingRow & {
  supervisorNik: string | null;
  externalSupervisor: string | null;
  jobLevel: string;
  rank: number;
  directorate: string;
  division: string;
  departmentName: string;
};

export type ResolutionReport = {
  rowsRead: number;
  duplicateNiks: string[];
  resolvedSupervisors: number;
  ambiguousSupervisors: Array<{ employee: string; supervisor: string; chosen: string; candidates: string[] }>;
  externalSupervisors: Record<string, number>;
  cyclesBroken: string[];
  unmappedChainHeads: Record<string, number>;
  directorates: Record<string, number>;
};

/**
 * Chain head (normalized name) -> canonical directorate. The nearest mapped
 * person while walking up the supervisor chain wins. Extend/correct freely.
 */
export const CHAIN_HEAD_DIRECTORATE: Record<string, string> = {
  "edy santoso": "LEGAL DIRECTORATE",
  "bambang heruawan haliman": "FINANCE DIRECTORATE",
  "monika dhyana zakaria": "FINANCE DIRECTORATE",
  "yatemo hudi": "FINANCE DIRECTORATE",
  "luther arung la'by": "FINANCE DIRECTORATE",
  "fathur rohman": "MARKETING DIRECTORATE",
  "jovita bernadette w": "MARKETING DIRECTORATE",
  "agus dani ariyanto": "HRGS DIRECTORATE",
  "paulus swasono satyo nugroho": "HRGS DIRECTORATE",
  "drs. m.c. trisetiyantono": "HRGS DIRECTORATE",
  "asep muhamad taufik": "HRGS DIRECTORATE",
  "gamal hendrawan wanengpati": "HRGS DIRECTORATE",
  "arief wiedhartono": "OPERATION & HSE DIRECTORATE",
  "feri indrayana": "OPERATION & HSE DIRECTORATE",
  "arya dhamar nugraha": "OPERATION & HSE DIRECTORATE",
  "dudu anwar sanusi": "OPERATION & HSE DIRECTORATE",
  "joshua cochrane": "OPERATION & HSE DIRECTORATE",
  "jaka lelana , ir.": "OPERATION & HSE DIRECTORATE",
  "leong chee keen": "OPERATION & HSE DIRECTORATE",
  "dedy kustiono": "OPERATION & HSE DIRECTORATE",
  "aries riky t kurniawan": "OPERATION & HSE DIRECTORATE",
  "jurike tapiomas sukmawati": "OPERATION & HSE DIRECTORATE",
  "pan panissa barlian": "OPERATION & HSE DIRECTORATE",
  "budi cahyono": "OPERATION & HSE DIRECTORATE",
  "nicky australiano laksmana": "OPERATION & HSE DIRECTORATE",
  "fuadie rahman, st": "OPERATION & HSE DIRECTORATE",
  "muhammad tijar fahrozi tarigan": "OPERATION & HSE DIRECTORATE",
  "aryo heruprastowo": "OPERATION & HSE DIRECTORATE",
  "yoyok nurprasetiyo hadi pramono": "LEGAL DIRECTORATE",
  "yenfrino gunadi": "BOARD OF DIRECTORS",
  "fuganto widjaja": "BOARD OF DIRECTORS",
};

export const UNMAPPED_DIRECTORATE = "LAINNYA (BELUM TERPETAKAN)";

export function normalizeName(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("id-ID");
}

function cell(value: string | undefined) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return !text || text === "-" ? null : text;
}

export function parseReportingMarkdown(markdown: string): ReportingRow[] {
  const rows: ReportingRow[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) continue;
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((item) => item.trim());
    if (cells.every((item) => /^:?-{2,}:?$/.test(item))) continue;
    if (/personnel\s*number/i.test(cells[0] ?? "")) continue;
    const [nik, name, position, department, supervisor] = cells;
    const personnelNumber = cell(nik);
    const employeeName = cell(name);
    if (!personnelNumber || !employeeName || !/^\d+$/.test(personnelNumber)) continue;
    rows.push({
      personnelNumber,
      name: employeeName,
      positionName: cell(position) ?? "Unassigned Position",
      department: cell(department)?.replace(/\s*-\s*$/, "") ?? null,
      supervisorName: cell(supervisor),
    });
  }
  return rows;
}

/** Higher = more senior. Used for job level labels and tie-breaking. */
export function positionRank(positionName: string) {
  const text = positionName.toLocaleLowerCase("en-US");
  if (/assist|asisst|secretary/.test(text)) return 30;
  if (/president director|\bceo\b/.test(text)) return 100;
  if (/\bdirector\b/.test(text)) return 90;
  if (/\bchief\b/.test(text)) return 85;
  if (/\bgm\b|general manager|general mgr|\bhead\b/.test(text)) return 80;
  if (/\b(sr\.?|senior)\s+manager\b/.test(text)) return 70;
  if (/\bmanager\b|\bmgr\b/.test(text)) return 60;
  if (/superintendent|superintenden\b|\bsupt\b|\bexpert\b|(sr\.?|senior)\s+spec/.test(text)) return 50;
  if (/supervisor|\bsupv?\b|\bspv\b|specialist|\bspc\b|coordinator/.test(text)) return 40;
  if (/engineer|geologist|surveyor|analyst|officer|evaluator|trainer|secretary/.test(text)) return 30;
  if (/foreman|group leader/.test(text)) return 25;
  if (/operator|technician|crew|staff|admin|helpdesk|bunkerman|support/.test(text)) return 10;
  return 20;
}

export function jobLevelLabel(rank: number) {
  if (rank >= 100) return "President Director";
  if (rank >= 90) return "Director";
  if (rank >= 80) return "GM / Head";
  if (rank >= 70) return "Sr Manager";
  if (rank >= 60) return "Manager";
  if (rank >= 50) return "Superintendent / Sr Specialist";
  if (rank >= 40) return "Supervisor / Specialist";
  if (rank >= 30) return "Engineer / Officer";
  if (rank >= 25) return "Foreman / Group Leader";
  if (rank >= 20) return "Staff";
  return "Operator / Technician";
}

export function divisionNameFromTitle(positionName: string) {
  const name = positionName
    .replace(/\(act\)|\bact\.?\b|\bacting\b/gi, " ")
    .replace(/\bhead of\b/gi, " ")
    .replace(/\bchief of\b/gi, " ")
    .replace(/\b(sr\.?|senior)\s+manager\b/gi, " ")
    .replace(/\bgeneral\s+(manager|mgr)\b/gi, " ")
    .replace(/\bsub\s+div(ision|\.)?/gi, " ")
    .replace(/\bdivision\b/gi, " ")
    .replace(/\b(gm|head|manager|chief)\b/gi, " ")
    .replace(/\s*&\s*$/g, " ")
    .replace(/^\s*&\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (name || positionName).toLocaleUpperCase("en-US");
}

export function resolveReportingRows(rows: ReportingRow[]): { rows: ResolvedRow[]; report: ResolutionReport } {
  const report: ResolutionReport = {
    rowsRead: rows.length,
    duplicateNiks: [],
    resolvedSupervisors: 0,
    ambiguousSupervisors: [],
    externalSupervisors: {},
    cyclesBroken: [],
    unmappedChainHeads: {},
    directorates: {},
  };

  const byNik = new Map<string, ReportingRow>();
  for (const row of rows) {
    if (byNik.has(row.personnelNumber)) report.duplicateNiks.push(row.personnelNumber);
    byNik.set(row.personnelNumber, row);
  }
  const unique = Array.from(byNik.values());
  const byName = new Map<string, ReportingRow[]>();
  for (const row of unique) {
    const key = normalizeName(row.name);
    byName.set(key, [...(byName.get(key) ?? []), row]);
  }

  // 1. Supervisor name -> NIK.
  const supervisorOf = new Map<string, string | null>();
  const externalOf = new Map<string, string | null>();
  for (const row of unique) {
    if (!row.supervisorName) {
      supervisorOf.set(row.personnelNumber, null);
      externalOf.set(row.personnelNumber, null);
      continue;
    }
    const candidates = (byName.get(normalizeName(row.supervisorName)) ?? [])
      .filter((item) => item.personnelNumber !== row.personnelNumber);
    if (!candidates.length) {
      supervisorOf.set(row.personnelNumber, null);
      externalOf.set(row.personnelNumber, row.supervisorName);
      report.externalSupervisors[row.supervisorName] = (report.externalSupervisors[row.supervisorName] ?? 0) + 1;
      continue;
    }
    const ownRank = positionRank(row.positionName);
    const chosen = [...candidates].sort((a, b) =>
      Number(sameDepartment(b, row)) - Number(sameDepartment(a, row))
      || Number(positionRank(b.positionName) > ownRank) - Number(positionRank(a.positionName) > ownRank)
      || positionRank(b.positionName) - positionRank(a.positionName)
      || a.personnelNumber.localeCompare(b.personnelNumber)
    )[0];
    if (candidates.length > 1) {
      report.ambiguousSupervisors.push({
        employee: `${row.name} (${row.personnelNumber})`,
        supervisor: row.supervisorName,
        chosen: `${chosen.personnelNumber} · ${chosen.positionName}`,
        candidates: candidates.map((item) => `${item.personnelNumber} · ${item.positionName}`),
      });
    }
    supervisorOf.set(row.personnelNumber, chosen.personnelNumber);
    externalOf.set(row.personnelNumber, null);
    report.resolvedSupervisors += 1;
  }

  // 2. Break cycles (keep the tree a forest).
  for (const row of unique) {
    const seen = new Set<string>();
    let current: string | null = row.personnelNumber;
    while (current) {
      if (seen.has(current)) {
        const supervisorNik = supervisorOf.get(current) ?? null;
        const supervisor = supervisorNik ? byNik.get(supervisorNik) : undefined;
        supervisorOf.set(current, null);
        externalOf.set(current, supervisor?.name ?? null);
        report.cyclesBroken.push(`${byNik.get(current)?.name} (${current})`);
        break;
      }
      seen.add(current);
      current = supervisorOf.get(current) ?? null;
    }
  }

  const chainOf = (nik: string) => {
    const chain: ReportingRow[] = [];
    let current: string | null = nik;
    while (current) {
      const item = byNik.get(current);
      if (!item) break;
      chain.push(item);
      current = supervisorOf.get(current) ?? null;
    }
    return chain;
  };

  // 3. Directorate + division per employee.
  const inferred = unique.map((row) => {
    const chain = chainOf(row.personnelNumber);
    const top = chain.at(-1)!;
    const external = externalOf.get(top.personnelNumber);
    let directorate: string | null = null;
    for (const person of chain) {
      directorate = CHAIN_HEAD_DIRECTORATE[normalizeName(person.name)] ?? null;
      if (directorate) break;
    }
    if (!directorate && external) directorate = CHAIN_HEAD_DIRECTORATE[normalizeName(external)] ?? null;
    if (!directorate) {
      const head = external ?? top.name;
      report.unmappedChainHeads[head] = (report.unmappedChainHeads[head] ?? 0) + 1;
      directorate = UNMAPPED_DIRECTORATE;
    }

    const divisionHead = chain.find((person) => {
      const rank = positionRank(person.positionName);
      return rank >= 80 && rank < 90;
    }) ?? chain.find((person) => positionRank(person.positionName) === 70);
    const division = divisionHead ? divisionNameFromTitle(divisionHead.positionName) : `${directorate} - DIRECTOR OFFICE`;
    return { row, directorate, division };
  });

  // 4. Department -> majority (directorate, division) so each dept has one parent.
  const departmentVotes = new Map<string, Map<string, number>>();
  for (const item of inferred) {
    if (!item.row.department) continue;
    const key = item.row.department.toLocaleUpperCase("en-US");
    const votes = departmentVotes.get(key) ?? new Map<string, number>();
    const vote = `${item.directorate}\u0000${item.division}`;
    votes.set(vote, (votes.get(vote) ?? 0) + 1);
    departmentVotes.set(key, votes);
  }
  const departmentParent = new Map<string, { directorate: string; division: string }>();
  for (const [department, votes] of departmentVotes) {
    const [winner] = Array.from(votes.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const [directorate, division] = winner.split("\u0000");
    departmentParent.set(department, { directorate, division });
  }

  const resolved: ResolvedRow[] = inferred.map(({ row, directorate, division }) => {
    const departmentKey = row.department?.toLocaleUpperCase("en-US") ?? null;
    const parent = departmentKey ? departmentParent.get(departmentKey)! : { directorate, division };
    const rank = positionRank(row.positionName);
    report.directorates[parent.directorate] = (report.directorates[parent.directorate] ?? 0) + 1;
    return {
      ...row,
      supervisorNik: supervisorOf.get(row.personnelNumber) ?? null,
      externalSupervisor: externalOf.get(row.personnelNumber) ?? null,
      jobLevel: jobLevelLabel(rank),
      rank,
      directorate: parent.directorate,
      division: parent.division,
      departmentName: departmentKey ?? `${parent.division} OFFICE`,
    };
  });

  return { rows: resolved, report };
}

function sameDepartment(a: ReportingRow, b: ReportingRow) {
  return Boolean(a.department && b.department && normalizeName(a.department) === normalizeName(b.department));
}

export function slugCode(value: string) {
  return value
    .toLocaleUpperCase("en-US")
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
