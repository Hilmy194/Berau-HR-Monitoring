import { prisma } from "@/lib/prisma";

export interface MandatoryCertCheckItem {
  name: string;
  type: "Lisensi" | "Internal" | "Eksternal";
  sourcePosition: string;
  status: "TERPENUHI" | "BELUM_TERCATAT";
  matchedEvidence?: string;
}

export interface EmployeeMandatoryCertResult {
  overallStatus: "COMPLETE" | "WARNING";
  matchedCount: number;
  totalRequired: number;
  applicableRoles: string[];
  items: MandatoryCertCheckItem[];
}

function splitCertTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "-");
}

function isForemanUp(position: string, jobLevel: string): boolean {
  const pos = position.toLowerCase();
  if (
    /\b(foreman|supervisor|supv|superintendent|supt|manager|sr\.?\s*mgr|gm|general manager|director|head|chief|vp|lead)\b/i.test(
      pos
    )
  ) {
    return true;
  }
  const lvlMatch = jobLevel.match(/^(\d+)/);
  if (lvlMatch && Number(lvlMatch[1]) >= 3) {
    return true;
  }
  return false;
}

function matchesCertEvidence(requiredName: string, evidenceList: string[]): string | undefined {
  const reqNorm = requiredName.toLowerCase().trim();
  // Ambil kode singkat sebelum tanda "-" jika ada (misal "KMPD" dari "KMPD - DASAR K3...")
  const shortCode = reqNorm.split("-")[0]?.trim();

  for (const ev of evidenceList) {
    const evNorm = ev.toLowerCase();
    if (evNorm.includes(reqNorm)) return ev;
    if (shortCode && shortCode.length >= 3) {
      const codeRegex = new RegExp(`\\b${shortCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (codeRegex.test(ev)) return ev;
    }
    // Khusus POP / POM / POU: jika punya POU/POM, otomatis memenuhi tingkatan pengawas di bawahnya
    if (reqNorm === "pop" && /\b(pop|pom|pou)\b/i.test(ev)) return ev;
    if (reqNorm === "pom" && /\b(pom|pou)\b/i.test(ev)) return ev;
    if (reqNorm === "pou" && /\bpou\b/i.test(ev)) return ev;
    if (reqNorm.includes("k3") && /\b(k3|k3lh|smkp|kmpd|safety)\b/i.test(ev)) return ev;
  }
  return undefined;
}

/**
 * Mengecek pemenuhan sertifikasi wajib karyawan berdasarkan tabel `position_certification_requirements`
 * dibandingkan dengan riwayat sertifikasi & training karyawan yang tercatat.
 */
export async function checkEmployeeMandatoryCertifications(params: {
  employeeName: string;
  employeeCode: string;
  position: string;
  jobLevel: string;
  rawCertifications: string[];
}): Promise<EmployeeMandatoryCertResult> {
  const [requirements, approvedRequests] = await Promise.all([
    prisma.positionCertificationRequirement.findMany({
      orderBy: { orderIndex: "asc" },
    }),
    prisma.employeeTrainingRequest.findMany({
      where: {
        status: "APPROVED_BY_LEADER",
        OR: [
          { employeePersonnelNumber: params.employeeCode },
          { employeeName: { equals: params.employeeName, mode: "insensitive" } },
        ],
      },
      select: { trainingTitle: true, skill: true },
    }),
  ]);

  const evidenceList = [
    ...params.rawCertifications,
    ...approvedRequests.map((r) => `${r.trainingTitle} (${r.skill})`),
  ].filter(Boolean);

  const posLower = (params.position || "").toLowerCase();
  const foremanUp = isForemanUp(params.position, params.jobLevel);

  const applicableRows = requirements.filter((req) => {
    // 1. Wajib untuk semua karyawan
    if (req.categoryNumber === 1) return true;

    // 2. Pengawas Operasional Internal untuk level Foreman Up
    if (req.categoryNumber === 2 && foremanUp) {
      if (req.workPermitPosition.toUpperCase() === "PENGAWAS OPERASIONAL") {
        return true;
      }
      // Cek kecocokan bidang teknis spesifik (mis. BLASTING, COAL GETTING, MINE PLAN, PLANT, dll)
      const suffix = req.workPermitPosition
        .replace(/^PENGAWAS TEKNIS\s*-\s*/i, "")
        .toLowerCase()
        .trim();
      const keywords = suffix.split(/[\s/&,-]+/).filter((w) => w.length >= 4);
      if (keywords.some((kw) => posLower.includes(kw))) {
        return true;
      }
    }

    // 3. Pengawas Teknis / Tenaga Teknis (kecocokan langsung kata kunci posisi)
    if (req.categoryNumber === 4 || req.categoryNumber === 5) {
      const wpLower = req.workPermitPosition.toLowerCase();
      const keywords = wpLower.split(/[\s/&,-]+/).filter((w) => w.length >= 4);
      if (
        keywords.length > 0 &&
        keywords.every((kw) => posLower.includes(kw))
      ) {
        return true;
      }
    }

    return false;
  });

  const seenCerts = new Set<string>();
  const items: MandatoryCertCheckItem[] = [];
  const applicableRoles = Array.from(new Set(applicableRows.map((r) => r.workPermitPosition)));

  for (const row of applicableRows) {
    const candidates: Array<{ name: string; type: "Lisensi" | "Internal" | "Eksternal" }> = [
      ...splitCertTokens(row.license).map((name) => ({ name, type: "Lisensi" as const })),
      ...splitCertTokens(row.internalCertificates).map((name) => ({ name, type: "Internal" as const })),
      ...splitCertTokens(row.externalCertificates).map((name) => ({ name, type: "Eksternal" as const })),
    ];

    for (const c of candidates) {
      const key = c.name.toUpperCase();
      if (seenCerts.has(key)) continue;
      seenCerts.add(key);

      const matchedEvidence = matchesCertEvidence(c.name, evidenceList);
      items.push({
        name: c.name,
        type: c.type,
        sourcePosition: row.workPermitPosition,
        status: matchedEvidence ? "TERPENUHI" : "BELUM_TERCATAT",
        matchedEvidence,
      });
    }
  }

  const matchedCount = items.filter((i) => i.status === "TERPENUHI").length;
  const totalRequired = items.length;
  const overallStatus = totalRequired > 0 && matchedCount === totalRequired ? "COMPLETE" : "WARNING";

  return {
    overallStatus,
    matchedCount,
    totalRequired,
    applicableRoles,
    items,
  };
}
