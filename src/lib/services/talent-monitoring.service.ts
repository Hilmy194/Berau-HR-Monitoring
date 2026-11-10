import { prisma } from "@/lib/prisma";
import { listEmployeeDirectory, type EmployeeDirectoryItem } from "@/lib/services/employee-directory.service";
import { ALL_TALENT_RETENTION, normalizeName, type TalentRetentionItem } from "@/lib/data/talent-retention-list";

export interface TalentTierHistoryEntry {
  year: number;
  tier: string;
  notes?: string | null;
}

export interface TalentMonitoringEmployeeItem extends EmployeeDirectoryItem {
  talentKey: string;
  retentionNo: number;
  uniqueKey: string;
  supervisor?: string;
  currentTier: string;
  currentTierYear: number;
  tierHistory: TalentTierHistoryEntry[];
}

type RawTierHistoryRow = {
  talent_key: string;
  retention_no: number | null;
  personnel_number: string | null;
  employee_name: string;
  normalized_name: string;
  year: number;
  tier: string;
  golongan: string | null;
  title: string | null;
  directorate: string | null;
  division: string | null;
  department: string | null;
  supervisor: string | null;
  notes: string | null;
};

let tableEnsured = false;

async function ensureTierHistoryTable() {
  if (tableEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.talent_retention_tier_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      talent_key TEXT NOT NULL,
      retention_no INTEGER,
      personnel_number TEXT,
      employee_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      tier TEXT NOT NULL,
      golongan TEXT,
      title TEXT,
      directorate TEXT,
      division TEXT,
      department TEXT,
      supervisor TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT talent_retention_tier_history_talent_key_year_key UNIQUE (talent_key, year)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS talent_retention_tier_history_year_idx ON public.talent_retention_tier_history (year)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS talent_retention_tier_history_tier_idx ON public.talent_retention_tier_history (tier)
  `);
  tableEnsured = true;
}

function matchDirectoryEmployee(
  retention: TalentRetentionItem,
  directoryByNormName: Map<string, EmployeeDirectoryItem[]>
): EmployeeDirectoryItem | undefined {
  const normRetentionName = normalizeName(retention.name);
  let candidates = directoryByNormName.get(normRetentionName) ?? [];

  if (candidates.length === 0) {
    for (const [normKey, list] of directoryByNormName.entries()) {
      if (normKey.includes(normRetentionName) || normRetentionName.includes(normKey)) {
        candidates = candidates.concat(list);
      }
    }
  }

  if (candidates.length <= 1) return candidates[0];

  // Disambiguate when multiple employees share a name (e.g. Abdul Aziz)
  const normTitle = normalizeName(retention.title);
  const exactTitleMatch = candidates.find((c) => {
    const pos = normalizeName(c.position || "");
    return pos && (pos.includes(normTitle) || normTitle.includes(pos));
  });
  return exactTitleMatch ?? candidates[0];
}

function buildTalentKey(
  retention: TalentRetentionItem,
  matchedEmp?: EmployeeDirectoryItem,
  isDuplicateName = false
): string {
  if (matchedEmp?.nik && matchedEmp.nik !== "-") {
    return `nik:${matchedEmp.nik}`;
  }
  const normName = normalizeName(retention.name);
  return isDuplicateName ? `name:${normName}:${retention.tier}:${retention.no}` : `name:${normName}`;
}

async function ensure2026Seeded(
  directoryByNormName: Map<string, EmployeeDirectoryItem[]>,
  duplicateNormNames: Set<string>
) {
  await ensureTierHistoryTable();
  const countRows = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
    `SELECT COUNT(*)::int AS cnt FROM public.talent_retention_tier_history WHERE year = 2026`
  );
  if ((countRows[0]?.cnt ?? 0) >= ALL_TALENT_RETENTION.length) return;

  for (const item of ALL_TALENT_RETENTION) {
    const normName = normalizeName(item.name);
    const matched = matchDirectoryEmployee(item, directoryByNormName);
    const talentKey = buildTalentKey(item, matched, duplicateNormNames.has(normName));

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO public.talent_retention_tier_history (
        talent_key, retention_no, personnel_number, employee_name, normalized_name,
        year, tier, golongan, title, directorate, division, department, supervisor, notes
      ) VALUES ($1, $2, $3, $4, $5, 2026, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (talent_key, year) DO NOTHING
      `,
      talentKey,
      item.no,
      matched?.nik ?? null,
      item.name,
      normName,
      item.tier,
      item.golongan,
      item.title,
      item.directorate,
      item.division,
      item.department,
      item.supervisor,
      "Baseline Talent Retention 2026"
    );
  }
}

export async function upsertTalentRetentionTierHistory(params: {
  talentKey?: string | null;
  employeeName: string;
  personnelNumber?: string | null;
  year: number;
  tier: string;
  notes?: string | null;
}) {
  await ensureTierHistoryTable();
  const normName = normalizeName(params.employeeName);
  const talentKey =
    params.talentKey?.trim() ||
    (params.personnelNumber && params.personnelNumber !== "-"
      ? `nik:${params.personnelNumber}`
      : `name:${normName}`);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO public.talent_retention_tier_history (
      talent_key, personnel_number, employee_name, normalized_name, year, tier, notes, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    ON CONFLICT (talent_key, year)
    DO UPDATE SET
      tier = EXCLUDED.tier,
      notes = COALESCE(EXCLUDED.notes, public.talent_retention_tier_history.notes),
      personnel_number = COALESCE(EXCLUDED.personnel_number, public.talent_retention_tier_history.personnel_number),
      updated_at = now()
    `,
    talentKey,
    params.personnelNumber ?? null,
    params.employeeName,
    normName,
    params.year,
    params.tier,
    params.notes ?? null
  );
}

export async function listTalentMonitoringEmployees(): Promise<TalentMonitoringEmployeeItem[]> {
  const directory = await listEmployeeDirectory();

  const directoryByNormName = new Map<string, EmployeeDirectoryItem[]>();
  for (const emp of directory) {
    if (emp.name) {
      const k = normalizeName(emp.name);
      const list = directoryByNormName.get(k) ?? [];
      list.push(emp);
      directoryByNormName.set(k, list);
    }
  }

  const nameCounts = new Map<string, number>();
  for (const r of ALL_TALENT_RETENTION) {
    const k = normalizeName(r.name);
    nameCounts.set(k, (nameCounts.get(k) ?? 0) + 1);
  }
  const duplicateNormNames = new Set(
    Array.from(nameCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );

  await ensure2026Seeded(directoryByNormName, duplicateNormNames);

  const historyRows = await prisma.$queryRawUnsafe<RawTierHistoryRow[]>(`
    SELECT
      talent_key, retention_no, personnel_number, employee_name, normalized_name,
      year, tier, golongan, title, directorate, division, department, supervisor, notes
    FROM public.talent_retention_tier_history
    ORDER BY year DESC, retention_no ASC NULLS LAST, employee_name ASC
  `);

  const historyByTalentKey = new Map<string, RawTierHistoryRow[]>();
  for (const row of historyRows) {
    const list = historyByTalentKey.get(row.talent_key) ?? [];
    list.push(row);
    historyByTalentKey.set(row.talent_key, list);
  }

  const results: TalentMonitoringEmployeeItem[] = [];
  const processedKeys = new Set<string>();

  for (const retention of ALL_TALENT_RETENTION) {
    const normRetentionName = normalizeName(retention.name);
    const matchedEmp = matchDirectoryEmployee(retention, directoryByNormName);
    const talentKey = buildTalentKey(retention, matchedEmp, duplicateNormNames.has(normRetentionName));
    processedKeys.add(talentKey);

    const personHistoryRows = historyByTalentKey.get(talentKey) ?? [];
    const tierHistory: TalentTierHistoryEntry[] = personHistoryRows.length
      ? personHistoryRows.map((h) => ({ year: h.year, tier: h.tier, notes: h.notes }))
      : [{ year: 2026, tier: retention.tier, notes: "Baseline Talent Retention 2026" }];

    const currentTier = tierHistory[0]?.tier ?? retention.tier;
    const currentTierYear = tierHistory[0]?.year ?? 2026;
    const uniqueKey = `ret-${retention.tier.replace(/\s+/g, "")}-${retention.no}-${matchedEmp ? matchedEmp.id : "syn"}`;

    if (matchedEmp) {
      results.push({
        ...matchedEmp,
        talentKey,
        retentionNo: retention.no,
        uniqueKey,
        supervisor: retention.supervisor,
        position: matchedEmp.position || retention.title,
        directorate: matchedEmp.directorate || retention.directorate,
        division: matchedEmp.division || retention.division,
        department: matchedEmp.department || retention.department,
        currentTier,
        currentTierYear,
        tierHistory,
      });
    } else {
      const syntheticId = `ret-${retention.no}`;
      results.push({
        id: syntheticId,
        profileId: syntheticId,
        employeeId: syntheticId,
        name: retention.name,
        email: "",
        photoUrl: null,
        nik: "-",
        position: retention.title,
        currentPosition: retention.title,
        businessUnit: "BERAU COAL",
        directorate: retention.directorate,
        division: retention.division,
        department: retention.department,
        phone: "-",
        joinDate: null,
        lastPromotionDate: null,
        employmentStatus: "Talent Retention",
        workLocation: "",
        aspirationCompleted: false,
        strengthCompleted: false,
        weaknessCompleted: false,
        commentCompleted: false,
        talentKey,
        retentionNo: retention.no,
        uniqueKey,
        supervisor: retention.supervisor,
        currentTier,
        currentTierYear,
        tierHistory,
      });
    }
  }

  // Also include any future/extra entries added directly in DB (e.g. 2027 additions)
  let extraCounter = ALL_TALENT_RETENTION.length + 1;
  for (const [talentKey, personHistoryRows] of historyByTalentKey.entries()) {
    if (processedKeys.has(talentKey)) continue;
    const latest = personHistoryRows[0];
    if (!latest) continue;

    const normName = latest.normalized_name;
    const candidates = directoryByNormName.get(normName) ?? [];
    const matchedEmp = candidates.find((c) => c.nik === latest.personnel_number) ?? candidates[0];

    const tierHistory: TalentTierHistoryEntry[] = personHistoryRows.map((h) => ({
      year: h.year,
      tier: h.tier,
      notes: h.notes,
    }));
    const currentTier = latest.tier;
    const currentTierYear = latest.year;
    const retentionNo = latest.retention_no ?? extraCounter++;
    const uniqueKey = `ret-db-${talentKey}`;

    if (matchedEmp) {
      results.push({
        ...matchedEmp,
        talentKey,
        retentionNo,
        uniqueKey,
        supervisor: latest.supervisor ?? undefined,
        position: matchedEmp.position || latest.title || "-",
        directorate: matchedEmp.directorate || latest.directorate || "-",
        division: matchedEmp.division || latest.division || "-",
        department: matchedEmp.department || latest.department || "-",
        currentTier,
        currentTierYear,
        tierHistory,
      });
    } else {
      const syntheticId = `ret-${retentionNo}`;
      results.push({
        id: syntheticId,
        profileId: syntheticId,
        employeeId: syntheticId,
        name: latest.employee_name,
        email: "",
        photoUrl: null,
        nik: latest.personnel_number ?? "-",
        position: latest.title ?? "-",
        currentPosition: latest.title ?? "-",
        businessUnit: "BERAU COAL",
        directorate: latest.directorate ?? "-",
        division: latest.division ?? "-",
        department: latest.department ?? "-",
        phone: "-",
        joinDate: null,
        lastPromotionDate: null,
        employmentStatus: "Talent Retention",
        workLocation: "",
        aspirationCompleted: false,
        strengthCompleted: false,
        weaknessCompleted: false,
        commentCompleted: false,
        talentKey,
        retentionNo,
        uniqueKey,
        supervisor: latest.supervisor ?? undefined,
        currentTier,
        currentTierYear,
        tierHistory,
      });
    }
  }

  return results;
}
