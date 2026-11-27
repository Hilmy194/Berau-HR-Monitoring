import { prisma } from "../prisma";

type RawEmpRow = {
  data_period: string | null;
  personnel_number: string;
  employee_name: string | null;
  position_name: string | null;
  ps_level: string | null;
  layer: string | null;
  job_family: string | null;
  job_grouping: string | null;
  value_chain: string | null;
  critical_position: string | null;
  direktorat: string | null;
  divisi: string | null;
  department: string | null;
};

type RawTalentRow = {
  personnel_number: string;
  aspiration: string | null;
  certification: string | null;
  training: string | null;
  project_involvement: string | null;
  strength_360: string | null;
  weakness_360: string | null;
  technical_competencies: string | null;
  soft_competencies: string | null;
};

type RawCareerRow = {
  personnel_number: string;
  career_within_organization: string | null;
  career_outside_organization: string | null;
};

type SkillItem = {
  name: string;
  category: string;
};

type TargetPositionCatalogItem = {
  targetPositionId: string | null;
  positionName: string;
  psLevel: string | null;
  layer: string | null;
  rank: number;
  jobFamily: string | null;
  jobGrouping: string | null;
  valueChain: string | null;
  isCriticalPosition: boolean;
  directorate: string;
  division: string;
  department: string;
  sourceSystem: string;
  requirements: Array<{ id: string; name: string; category: string; requiredLevel: number }>;
};

export type PersistedCareerOptionInput = {
  employeeNik: string;
  employeeName: string;
  currentPosition: string;
  currentPsLevel: string | null;
  currentLayer: string | null;
  currentJobFamily: string | null;
  currentDirectorate: string | null;
  currentDivision: string | null;
  currentDepartment: string | null;
  targetPositionId: string | null;
  targetPosition: string;
  targetPsLevel: string | null;
  targetLayer: string | null;
  targetJobFamily: string | null;
  targetJobGrouping: string | null;
  targetValueChain: string | null;
  isCriticalPosition: boolean;
  targetDirectorate: string | null;
  targetDivision: string | null;
  targetDepartment: string | null;
  pathStage: string;
  transitionType: string;
  priorityRank: number;
  matchScore: number;
  estimatedReadiness: string;
  matchedCompetencies: string[];
  priorityGaps: string[];
  competencyGaps: Array<{
    competencyId: string;
    competencyName: string;
    competencyCategory: string;
    requiredLevel: number;
    currentLevel: number;
    gap: number;
  }>;
  pathRationale: string;
  developmentNeed: string;
  recommendationNote: string;
  dataPeriod: string | null;
  sourceSystem: string;
};

function clean(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function norm(value: string | null | undefined): string {
  return clean(value)
    .toLocaleLowerCase("id-ID")
    .replace(/\bsr\.?\b/g, "senior")
    .replace(/\bjr\.?\b/g, "junior")
    .replace(/\bsupt\.?\b/g, "superintendent")
    .replace(/\bmgr\.?\b/g, "manager")
    .replace(/\bspv\.?\b/g, "supervisor")
    .replace(/\bdept\.?\b/g, "department")
    .replace(/[^a-z0-9]/g, "");
}

function tokenize(value: string | null | undefined): string[] {
  return clean(value)
    .toLocaleLowerCase("id-ID")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !/^(the|and|dan|for|with|dept|department|division|directorate|senior|junior|jr|sr)$/.test(token));
}

function tokenOverlap(left: string, right: string): number {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (!a.size || !b.size) return 0;
  return [...a].filter((t) => b.has(t)).length / Math.min(a.size, b.size);
}

export function resolveCareerLayerRank(layer: string | null | undefined, psLevel: string | null | undefined, positionName: string): number {
  const l = clean(layer).toLocaleLowerCase("id-ID");
  const p = clean(positionName).toLocaleLowerCase("id-ID");
  const ps = clean(psLevel).toUpperCase();

  if (l) {
    if (/bu\s*\/\s*su\s*head|director|direktur|chief/i.test(l)) return 8;
    if (/division\s*head|master\s*expert/i.test(l)) return 7;
    if (/department\s*head|expert/i.test(l)) {
      if (/\b(?:senior\s*manager|sr\.?\s*manager|senior\s*mgr|sr\.?\s*mgr)\b/i.test(p) || /^5[C-Z]/.test(ps)) {
        return 6;
      }
      return 5;
    }
    if (/section\s*head|sr\.?\s*specialist/i.test(l)) return 4;
    if (/team\s*leader|specialist/i.test(l)) return 3;
    if (/^officer$/i.test(l)) return 2;
    if (/^staff$/i.test(l)) return 1;
  }

  if (/\bdirector\b|\bdirektur\b|\bchief\b/i.test(p)) return 8;
  if (/\bgm\b|general manager|division head/i.test(p) || /^6[A-Z]?/.test(ps)) return 7;
  if (/\b(?:senior\s*manager|sr\.?\s*manager|senior\s*mgr|sr\.?\s*mgr)\b/i.test(p) || /^5[C-Z]/.test(ps)) return 6;
  if (/\bmanager\b|\bmgr\b|dept\.?\s*head|department head/i.test(p) || /^5[A-B]$/.test(ps)) return 5;
  if (/superintendent|\bsupt\b|senior specialist|sr\.?\s*specialist|senior engineer|sr\.?\s*engineer|senior geologist|sr\.?\s*geologist|section head/i.test(p) || /^4[D-F]/.test(ps)) return 4;
  if (/supervisor|\bspv\b|\bsupv\b|specialist|team leader|foreman|\blead\b/i.test(p) || /^4[A-C]/.test(ps)) return 3;
  if (/engineer|geologist|surveyor|analyst|officer|planner/i.test(p) || /^3[A-F]?/.test(ps)) return 2;
  if (/operator|driver|technician|helper|crew|staff|admin/i.test(p) || /^[12][A-F]?/.test(ps)) return 1;
  return 0;
}

function parsePipeEvidenceLines(raw: string | null | undefined, defaultCategory: string): SkillItem[] {
  if (!raw) return [];
  const items: SkillItem[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = clean(rawLine);
    if (!line || line === "-") continue;
    const parts = line.split("|").map((p) => clean(p));
    const titleWithoutYear = clean(parts[0].replace(/^(?:19|20)\d{2}(?:-\d{2}-\d{2})?\s*[-:]?\s*/, ""));
    if (!titleWithoutYear || /^(hr talks|conference|workshop|webinar)\b/i.test(titleWithoutYear) || /\bconference\b/i.test(titleWithoutYear)) continue;
    const category = parts[3] || parts[2] || defaultCategory;
    items.push({ name: titleWithoutYear, category });
  }
  return items;
}

function parseFreeTextList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n|;|•/)
    .map((line) => clean(line.replace(/^(?:19|20)\d{2}(?:-\d{2}-\d{2})?\s*[-:]?\s*/, "")))
    .filter((line) => line.length >= 3 && line !== "-" && !/^competent in (one|different) roles?$/i.test(line));
}

function skillMatches(actual: string, required: string): boolean {
  const a = norm(actual);
  const r = norm(required);
  if (!a || !r) return false;
  if (a === r || a.includes(r) || r.includes(a)) return true;
  return tokenOverlap(actual, required) >= 0.6;
}

function estimateReadiness(score: number): string {
  if (score >= 85) return "Ready for validation";
  if (score >= 70) return "Ready with development";
  if (score >= 55) return "Build readiness";
  return "Long-term development";
}

function cleanCertLabel(name: string): string {
  return name
    .replace(/^Diklat\s*&\s*Uji Kompetensi\s+/i, "")
    .replace(/^Sertifikasi\s+/i, "")
    .replace(/^Sertifikat\s+Kompetensi\s+/i, "")
    .replace(/^Kompetensi\s+/i, "")
    .trim();
}

async function loadRealPositionAndEmployeeSources() {
  const [empRows, talentRows, careerRows, odPositions, mandatoryCerts] = await Promise.all([
    prisma.$queryRawUnsafe<RawEmpRow[]>(`
      WITH latest_period AS (
        SELECT MAX(data_period) AS max_period FROM bq_raw.p_emps
      )
      SELECT DISTINCT ON (btrim(personnel_number))
        data_period::text AS data_period,
        btrim(personnel_number) AS personnel_number,
        employee_name,
        position_name,
        ps_level,
        layer,
        job_family,
        job_grouping,
        value_chain,
        critical_position::text AS critical_position,
        direktorat,
        divisi,
        department
      FROM bq_raw.p_emps
      WHERE data_period = (SELECT max_period FROM latest_period)
        AND NULLIF(btrim(personnel_number), '') IS NOT NULL
        AND NULLIF(btrim(position_name), '') IS NOT NULL
      ORDER BY btrim(personnel_number), data_period DESC NULLS LAST
    `),
    prisma.$queryRawUnsafe<RawTalentRow[]>(`
      SELECT DISTINCT ON (btrim(personnel_number))
        btrim(personnel_number) AS personnel_number,
        aspiration,
        certification,
        training,
        project_involvement,
        strength_360,
        weakness_360,
        technical_competencies,
        soft_competencies
      FROM bq_raw.p_talent_profile
      WHERE NULLIF(btrim(personnel_number), '') IS NOT NULL
      ORDER BY btrim(personnel_number), talent_year DESC NULLS LAST
    `),
    prisma.$queryRawUnsafe<RawCareerRow[]>(`
      SELECT DISTINCT ON (btrim(personnel_number))
        btrim(personnel_number) AS personnel_number,
        career_within_organization,
        career_outside_organization
      FROM bq_raw.p_career_history
      WHERE NULLIF(btrim(personnel_number), '') IS NOT NULL
    `),
    prisma.organizationPosition.findMany({
      where: {
        isActive: true,
        sourceFile: { not: null },
        NOT: { positionCode: { startsWith: "RL-" } },
      },
      include: {
        department: { include: { division: { include: { directorate: true } } } },
        competencyRequirements: {
          where: { isActive: true },
          include: { skill: { include: { category: true } } },
        },
      },
    }),
    prisma.positionCertificationRequirement.findMany({
      where: { categoryNumber: { in: [2, 3] } },
      select: { workPermitPosition: true, internalCertificates: true, externalCertificates: true },
    }),
  ]);

  return { empRows, talentRows, careerRows, odPositions, mandatoryCerts };
}

function buildRealTargetCatalog(
  empRows: RawEmpRow[],
  talentByNik: Map<string, RawTalentRow>,
  odPositions: Awaited<ReturnType<typeof loadRealPositionAndEmployeeSources>>["odPositions"],
  mandatoryCerts: Array<{ workPermitPosition: string; internalCertificates: string | null; externalCertificates: string | null }>
): TargetPositionCatalogItem[] {
  const grouped = new Map<string, RawEmpRow[]>();
  for (const row of empRows) {
    const pos = clean(row.position_name);
    if (!pos) continue;
    const key = norm(pos);
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  const odByName = new Map<string, (typeof odPositions)[number]>();
  for (const od of odPositions) {
    odByName.set(norm(od.positionName), od);
  }

  const catalog: TargetPositionCatalogItem[] = [];

  for (const [key, records] of grouped.entries()) {
    const canonical = records[0];
    const positionName = clean(canonical.position_name);
    const od = odByName.get(key);
    const layer = clean(canonical.layer) || null;
    const psLevel = clean(canonical.ps_level) || null;
    const rank = resolveCareerLayerRank(layer, psLevel, positionName);
    if (!rank) continue;

    const reqMap = new Map<string, { id: string; name: string; category: string; requiredLevel: number; count: number }>();

    // 1. Prioritize real OD Excel skill requirements if available
    if (od?.competencyRequirements?.length) {
      for (const req of od.competencyRequirements) {
        const k = norm(req.skill.skillName);
        reqMap.set(k, {
          id: req.skillId,
          name: req.skill.skillName,
          category: req.skill.category.name,
          requiredLevel: req.requiredLevel,
          count: 999,
        });
      }
    }

    // 2. Aggregate real competencies/certifications held by actual incumbents of this position in bq_raw.p_talent_profile
    for (const emp of records) {
      const tp = talentByNik.get(emp.personnel_number);
      if (!tp) continue;
      const items = [
        ...parsePipeEvidenceLines(tp.certification, "Certification"),
        ...parsePipeEvidenceLines(tp.training, "Training"),
      ];
      for (const item of items) {
        const cleanedName = cleanCertLabel(item.name);
        if (!cleanedName || cleanedName.length < 3) continue;
        const k = norm(cleanedName);
        const existing = reqMap.get(k);
        if (existing) {
          existing.count += 1;
        } else {
          reqMap.set(k, {
            id: `bq-${key}-${k.slice(0, 24)}`,
            name: cleanedName,
            category: item.category,
            requiredLevel: Math.min(5, Math.max(2, rank)),
            count: 1,
          });
        }
      }
    }

    // 3. Add mandatory safety certification expectations from S-HCT-04.01 (position_certification_requirements) for Operations/HSE Foreman Up
    const dir = clean(canonical.direktorat) || "UNMAPPED";
    if (rank >= 3 && /operation|hse|mining|mine plan|geolog|safety|environment/i.test(`${dir} ${positionName}`)) {
      const operational = mandatoryCerts.find((c) => c.workPermitPosition.toUpperCase() === "PENGAWAS OPERASIONAL");
      if (operational) {
        const certName = rank >= 4 ? "Pengawas Operasional Madya (POM)" : "Pengawas Operasional Pratama (POP)";
        const certKey = norm(certName);
        const alreadyPresent = Array.from(reqMap.keys()).some(
          (existingKey) => existingKey === certKey || (rank >= 4 ? existingKey.includes("pom") || existingKey.includes("pengawasoperasionalmadya") : existingKey.includes("pop") || existingKey.includes("pengawasoperasionalp"))
        );
        if (!alreadyPresent) {
          reqMap.set(certKey, {
            id: `cert-${rank >= 4 ? "pom" : "pop"}-${key}`,
            name: certName,
            category: "Mandatory Certification",
            requiredLevel: Math.min(5, rank),
            count: 500,
          });
        }
      }
    }

    const sortedReqs = Array.from(reqMap.values())
      .filter((item) => item.count >= 2 || item.category === "Mandatory Certification" || Boolean(od?.competencyRequirements?.length))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map(({ id, name, category, requiredLevel }) => ({ id, name, category, requiredLevel }));

    catalog.push({
      targetPositionId: od?.id ?? null,
      positionName,
      psLevel,
      layer,
      rank,
      jobFamily: clean(canonical.job_family) || null,
      jobGrouping: clean(canonical.job_grouping) || null,
      valueChain: clean(canonical.value_chain) || null,
      isCriticalPosition: /^yes$/i.test(clean(canonical.critical_position)),
      directorate: od?.department.division.directorate.name ?? (clean(canonical.direktorat) || "UNMAPPED"),
      division: od?.department.division.name ?? (clean(canonical.divisi) || "UNMAPPED"),
      department: od?.department.name ?? (clean(canonical.department) || "UNMAPPED"),
      sourceSystem: od ? "BIGQUERY_AND_OD_EXCEL" : "BIGQUERY_RAW",
      requirements: sortedReqs,
    });
  }

  return catalog.sort((a, b) => a.positionName.localeCompare(b.positionName));
}

export function computeEmployeeCareerOptionsFromRealData(
  emp: RawEmpRow,
  tp: RawTalentRow | undefined,
  career: RawCareerRow | undefined,
  catalog: TargetPositionCatalogItem[],
  limit = 10
): PersistedCareerOptionInput[] {
  const currentPosition = clean(emp.position_name);
  const currentLayer = clean(emp.layer) || null;
  const currentPsLevel = clean(emp.ps_level) || null;
  const currentRank = resolveCareerLayerRank(currentLayer, currentPsLevel, currentPosition);
  if (!currentPosition || !currentRank) return [];

  const currentDirectorate = clean(emp.direktorat) || null;
  const currentDivision = clean(emp.divisi) || null;
  const currentDepartment = clean(emp.department) || null;
  const currentJobFamily = clean(emp.job_family) || null;

  const actualEvidence = Array.from(
    new Set([
      ...parsePipeEvidenceLines(tp?.certification, "Certification").map((i) => cleanCertLabel(i.name)),
      ...parsePipeEvidenceLines(tp?.training, "Training").map((i) => cleanCertLabel(i.name)),
      ...parseFreeTextList(tp?.technical_competencies),
      ...parseFreeTextList(tp?.soft_competencies),
      ...parseFreeTextList(tp?.strength_360),
      ...parseFreeTextList(tp?.project_involvement),
      ...parseFreeTextList(career?.career_within_organization),
    ])
  );

  const aspirationText = clean(tp?.aspiration);
  const projectCount = parseFreeTextList(tp?.project_involvement).length;
  const certCount = parsePipeEvidenceLines(tp?.certification, "Certification").length;

  const candidates = catalog
    .filter((target) => norm(target.positionName) !== norm(currentPosition))
    .filter((target) => target.rank >= currentRank && target.rank <= currentRank + 2)
    .filter((target) => {
      const sameFamily = Boolean(currentJobFamily && target.jobFamily && norm(currentJobFamily) === norm(target.jobFamily));
      const sameDiv = Boolean(currentDivision && norm(currentDivision) === norm(target.division));
      const sameDirAndOverlap = Boolean(
        currentDirectorate &&
          norm(currentDirectorate) === norm(target.directorate) &&
          tokenOverlap(currentPosition, target.positionName) >= 0.35
      );
      const aspirationHit = Boolean(aspirationText && norm(aspirationText).includes(norm(target.positionName)));
      return sameFamily || sameDiv || sameDirAndOverlap || aspirationHit;
    });

  const scored: PersistedCareerOptionInput[] = candidates.map((target) => {
    const reqs = target.requirements;
    const matchedReqs = reqs.filter((req) => actualEvidence.some((ev) => skillMatches(ev, req.name)));
    const matchedNames = matchedReqs.map((r) => r.name);
    const gapReqs = reqs.filter((req) => !matchedNames.includes(req.name));
    const priorityGaps = gapReqs.slice(0, 5).map((r) => r.name);

    const skillScore = reqs.length ? (matchedNames.length / reqs.length) * 55 : 25;
    const orgScore =
      currentDepartment && norm(currentDepartment) === norm(target.department)
        ? 18
        : currentDivision && norm(currentDivision) === norm(target.division)
          ? 14
          : currentDirectorate && norm(currentDirectorate) === norm(target.directorate)
            ? 8
            : 0;
    const familyScore = currentJobFamily && target.jobFamily && norm(currentJobFamily) === norm(target.jobFamily) ? 10 : 0;
    const roleSimilarity = tokenOverlap(currentPosition, target.positionName) >= 0.4 ? 10 : 0;
    const aspirationBonus = aspirationText && norm(aspirationText).includes(norm(target.positionName)) ? 6 : 0;
    const trackBonus = Math.min(7, Math.round((projectCount + certCount) / 3));
    const stepPenalty = target.rank === currentRank + 2 ? 10 : 0;

    const matchScore = Math.max(20, Math.min(98, Math.round(skillScore + orgScore + familyScore + roleSimilarity + aspirationBonus + trackBonus - stepPenalty)));

    const pathStage =
      target.rank === currentRank + 1
        ? "Next role"
        : target.rank === currentRank
          ? "Lateral / enrichment"
          : "Long-term path";

    const sameFamily = Boolean(currentJobFamily && target.jobFamily && norm(currentJobFamily) === norm(target.jobFamily));
    const transitionType =
      target.rank > currentRank
        ? sameFamily
          ? "Vertical progression"
          : "Cross-functional progression"
        : "Horizontal mobility";

    const strengthSummary = matchedNames.slice(0, 3).join(", ") || "rekam jejak jabatan dan training saat ini";
    const gapSummary = priorityGaps.slice(0, 3).join(", ") || "validasi readiness & panel kompetensi target";

    return {
      employeeNik: emp.personnel_number,
      employeeName: clean(emp.employee_name) || emp.personnel_number,
      currentPosition,
      currentPsLevel,
      currentLayer,
      currentJobFamily,
      currentDirectorate,
      currentDivision,
      currentDepartment,
      targetPositionId: target.targetPositionId,
      targetPosition: target.positionName,
      targetPsLevel: target.psLevel,
      targetLayer: target.layer,
      targetJobFamily: target.jobFamily,
      targetJobGrouping: target.jobGrouping,
      targetValueChain: target.valueChain,
      isCriticalPosition: target.isCriticalPosition,
      targetDirectorate: target.directorate,
      targetDivision: target.division,
      targetDepartment: target.department,
      pathStage,
      transitionType,
      priorityRank: 1,
      matchScore,
      estimatedReadiness: estimateReadiness(matchScore),
      matchedCompetencies: matchedNames,
      priorityGaps,
      competencyGaps: reqs.map((r) => {
        const hit = matchedNames.includes(r.name);
        const curLevel = hit ? Math.max(1, r.requiredLevel - 1) : 0;
        return {
          competencyId: r.id,
          competencyName: r.name,
          competencyCategory: r.category,
          requiredLevel: r.requiredLevel,
          currentLevel: curLevel,
          gap: Math.max(0, r.requiredLevel - curLevel),
        };
      }),
      pathRationale: `${target.positionName} (${target.layer ?? target.psLevel ?? "Target Role"}) dipertimbangkan dari posisi ${currentPosition} berdasarkan kecocokan ${strengthSummary} dan pengembangan pada ${gapSummary}.`,
      developmentNeed: priorityGaps.length
        ? `Prioritas pengembangan: ${priorityGaps.slice(0, 3).join(", ")}.`
        : "Validasi kesiapan peran melalui assessment dan penugasan lintas proyek.",
      recommendationNote: `Disusun dari data real ${target.sourceSystem} (bq_raw.p_emps & bq_raw.p_talent_profile).`,
      dataPeriod: clean(emp.data_period) || null,
      sourceSystem: target.sourceSystem,
    };
  });

    const stagePriority = (stage: string) => (stage === "Next role" ? 0 : stage === "Lateral / enrichment" ? 1 : 2);
  const top = scored
    .sort((a, b) => stagePriority(a.pathStage) - stagePriority(b.pathStage) || b.matchScore - a.matchScore || a.targetPosition.localeCompare(b.targetPosition))
    .slice(0, limit);

  return top.map((row, index) => ({ ...row, priorityRank: index + 1 }));
}

export type AiCareerTargetPositionOption = {
  targetPositionId: string | null;
  targetPosition: string;
  targetPsLevel: string | null;
  targetLayer: string | null;
  targetJobFamily: string | null;
  targetDirectorate: string;
  targetDivision: string;
  targetDepartment: string;
  isCriticalPosition: boolean;
  pathStage: string;
  transitionType: string;
  officialCompetencyRequirements: Array<{ name: string; category: string; requiredLevel: number }>;
  mandatoryCertifications: string[];
};

export async function listValidCareerTargetPositionsForAi(
  employeeNik: string,
  limit = 18
): Promise<AiCareerTargetPositionOption[]> {
  const { empRows, talentRows, odPositions, mandatoryCerts } = await loadRealPositionAndEmployeeSources();
  const emp = empRows.find((r) => r.personnel_number === clean(employeeNik));
  if (!emp) return [];

  const currentPosition = clean(emp.position_name);
  const currentRank = resolveCareerLayerRank(emp.layer, emp.ps_level, currentPosition);
  if (!currentPosition || !currentRank) return [];

  const currentDirectorate = clean(emp.direktorat) || null;
  const currentDivision = clean(emp.divisi) || null;
  const currentDepartment = clean(emp.department) || null;
  const currentJobFamily = clean(emp.job_family) || null;

  const talentByNik = new Map(talentRows.map((row) => [row.personnel_number, row]));
  const aspirationText = clean(talentByNik.get(emp.personnel_number)?.aspiration);
  const odByName = new Map(odPositions.map((od) => [norm(od.positionName), od]));

  const grouped = new Map<string, RawEmpRow[]>();
  for (const row of empRows) {
    const pos = clean(row.position_name);
    if (!pos) continue;
    const key = norm(pos);
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  const options: Array<AiCareerTargetPositionOption & { _sortKey: number }> = [];

  for (const [key, records] of grouped.entries()) {
    const canonical = records[0];
    const targetPosition = clean(canonical.position_name);
    if (norm(targetPosition) === norm(currentPosition)) continue;

    const targetLayer = clean(canonical.layer) || null;
    const targetPsLevel = clean(canonical.ps_level) || null;
    const targetRank = resolveCareerLayerRank(targetLayer, targetPsLevel, targetPosition);
    if (!targetRank || targetRank < currentRank || targetRank > currentRank + 2) continue;

    const targetDirectorate = clean(canonical.direktorat) || "UNMAPPED";
    const targetDivision = clean(canonical.divisi) || "UNMAPPED";
    const targetDepartment = clean(canonical.department) || "UNMAPPED";
    const targetJobFamily = clean(canonical.job_family) || null;

    const sameDept = Boolean(currentDepartment && norm(currentDepartment) === norm(targetDepartment));
    const sameDiv = Boolean(currentDivision && norm(currentDivision) === norm(targetDivision));
    const sameFamily = Boolean(currentJobFamily && targetJobFamily && norm(currentJobFamily) === norm(targetJobFamily));
    const sameDirAndOverlap = Boolean(
      currentDirectorate &&
        norm(currentDirectorate) === norm(targetDirectorate) &&
        tokenOverlap(currentPosition, targetPosition) >= 0.35
    );
    const aspirationHit = Boolean(aspirationText && norm(aspirationText).includes(norm(targetPosition)));

    if (!sameFamily && !sameDiv && !sameDirAndOverlap && !aspirationHit) continue;

    const od = odByName.get(key);
    const officialCompetencyRequirements =
      od?.competencyRequirements?.map((r) => ({
        name: r.skill.skillName,
        category: r.skill.category.name,
        requiredLevel: r.requiredLevel,
      })) ?? [];

    const mandatoryCertifications: string[] = [];
    if (targetRank >= 3 && /operation|hse|mining|mine plan|geolog|safety|environment/i.test(`${targetDirectorate} ${targetPosition}`)) {
      const hasOperational = mandatoryCerts.some((c) => c.workPermitPosition.toUpperCase() === "PENGAWAS OPERASIONAL");
      if (hasOperational) {
        mandatoryCertifications.push(targetRank >= 4 ? "Pengawas Operasional Madya (POM)" : "Pengawas Operasional Pratama (POP)");
      }
    }

    const pathStage =
      targetRank === currentRank + 1
        ? "Next role"
        : targetRank === currentRank
          ? "Lateral / enrichment"
          : "Long-term path";

    const transitionType =
      targetRank > currentRank
        ? sameFamily
          ? "Vertical progression"
          : "Cross-functional progression"
        : "Horizontal mobility";

    const stagePriority = pathStage === "Next role" ? 0 : pathStage === "Lateral / enrichment" ? 100 : 200;
    const relevanceBonus =
      (sameDept ? 40 : sameDiv ? 25 : 0) +
      (sameFamily ? 20 : 0) +
      Math.round(tokenOverlap(currentPosition, targetPosition) * 30);

    options.push({
      targetPositionId: od?.id ?? null,
      targetPosition,
      targetPsLevel,
      targetLayer,
      targetJobFamily,
      targetDirectorate: od?.department.division.directorate.name ?? targetDirectorate,
      targetDivision: od?.department.division.name ?? targetDivision,
      targetDepartment: od?.department.name ?? targetDepartment,
      isCriticalPosition: /^yes$/i.test(clean(canonical.critical_position)),
      pathStage,
      transitionType,
      officialCompetencyRequirements,
      mandatoryCertifications,
      _sortKey: stagePriority - relevanceBonus,
    });
  }

  return options
    .sort((a, b) => a._sortKey - b._sortKey || a.targetPosition.localeCompare(b.targetPosition))
    .slice(0, limit)
    .map(({ _sortKey: _ignored, ...rest }) => rest);
}

export async function syncCareerOptionsFromRealTables(targetEmployeeNik?: string) {
  const { empRows, talentRows, careerRows, odPositions, mandatoryCerts } = await loadRealPositionAndEmployeeSources();

  const talentByNik = new Map(talentRows.map((row) => [row.personnel_number, row]));
  const careerByNik = new Map(careerRows.map((row) => [row.personnel_number, row]));
  const catalog = buildRealTargetCatalog(empRows, talentByNik, odPositions, mandatoryCerts);

  const targetEmployees = targetEmployeeNik
    ? empRows.filter((row) => row.personnel_number === targetEmployeeNik)
    : empRows;

  const allOptions: PersistedCareerOptionInput[] = [];
  for (const emp of targetEmployees) {
    const options = computeEmployeeCareerOptionsFromRealData(
      emp,
      talentByNik.get(emp.personnel_number),
      careerByNik.get(emp.personnel_number),
      catalog,
      10
    );
    allOptions.push(...options);
  }

  await prisma.$transaction(async (tx) => {
    if (targetEmployeeNik) {
      await tx.careerOption.deleteMany({ where: { employeeNik: targetEmployeeNik } });
    } else {
      await tx.careerOption.deleteMany({});
    }

    const chunkSize = 500;
    for (let i = 0; i < allOptions.length; i += chunkSize) {
      await tx.careerOption.createMany({
        data: allOptions.slice(i, i + chunkSize),
        skipDuplicates: true,
      });
    }
  });

  return {
    employeesProcessed: targetEmployees.length,
    catalogPositionsCount: catalog.length,
    careerOptionsInserted: allOptions.length,
    optionsForTarget: targetEmployeeNik ? allOptions : undefined,
  };
}
