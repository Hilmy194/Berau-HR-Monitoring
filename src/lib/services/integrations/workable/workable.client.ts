/**
 * Workable API Integration Client
 * Connects to Workable SPI v3 to retrieve real jobs and candidate pipelines.
 * Features persistent file-based caching for instant zero-latency page loads.
 */

import fs from "node:fs";
import path from "node:path";
import type { RecruitmentCandidate } from "@/lib/services/recruitment.service";

type WorkableJob = {
  id: string;
  title: string;
  full_title?: string;
  shortcode: string;
  code?: string;
  state?: string;
  department?: string | null;
  department_hierarchy?: string[];
  location?: {
    location_str?: string;
    city?: string;
    region?: string;
    country?: string;
    workplace_type?: string;
  };
};

type WorkableCandidate = {
  id: string;
  name: string;
  firstname?: string;
  lastname?: string;
  headline?: string | null;
  account?: {
    subdomain: string;
    name: string;
  };
  job?: {
    shortcode: string;
    title: string;
  };
  stage: string;
  stage_kind: string;
  disqualified: boolean;
  hired_at?: string | null;
  email?: string;
  phone?: string | null;
  common_source?: string;
  common_source_category?: string;
  created_at: string;
  updated_at: string;
  profile_url?: string;
  tags?: string[];
};

const CACHE_DIR = path.join(process.cwd(), "runtime");
const CACHE_FILE = path.join(CACHE_DIR, "workable-candidates.json");
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let memoryCache: RecruitmentCandidate[] | null = null;
let memoryCacheExpiry: number = 0;
let isSyncing = false;

function loadFromFileCache(): RecruitmentCandidate[] | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const stat = fs.statSync(CACHE_FILE);
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as RecruitmentCandidate[];
      if (Array.isArray(data) && data.length > 0) {
        memoryCache = data;
        memoryCacheExpiry = stat.mtimeMs + CACHE_TTL_MS;
        return data;
      }
    }
  } catch (err) {
    console.warn("[Workable] Failed to read disk cache:", err);
  }
  return null;
}

function saveToFileCache(data: RecruitmentCandidate[]) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
    memoryCache = data;
    memoryCacheExpiry = Date.now() + CACHE_TTL_MS;
    console.log(`[Workable] Successfully cached ${data.length} candidates to disk.`);
  } catch (err) {
    console.warn("[Workable] Failed to save disk cache:", err);
  }
}

export async function fetchWorkableCandidates(): Promise<RecruitmentCandidate[] | null> {
  const token = process.env.WORKABLE_API_KEY;
  const subdomain = process.env.WORKABLE_SUBDOMAIN || "techconnect";

  if (!token) {
    return null;
  }

  const now = Date.now();

  // 1. Return memory cache if still valid
  if (memoryCache && memoryCache.length > 0 && memoryCacheExpiry > now) {
    return memoryCache;
  }

  // 2. Try loading from persistent file cache
  const diskData = loadFromFileCache();
  if (diskData && diskData.length > 0) {
    // If disk cache is slightly old, trigger background refresh without blocking user
    if (now > memoryCacheExpiry && !isSyncing) {
      triggerBackgroundSync(token, subdomain);
    }
    return diskData;
  }

  // 3. If no cache exists, perform sync
  return await syncWorkablePipeline(token, subdomain);
}

function triggerBackgroundSync(token: string, subdomain: string) {
  isSyncing = true;
  syncWorkablePipeline(token, subdomain)
    .catch((err) => console.error("[Workable Background Sync Error]:", err))
    .finally(() => {
      isSyncing = false;
    });
}

export async function syncWorkablePipeline(
  token: string,
  subdomain: string = "techconnect"
): Promise<RecruitmentCandidate[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  try {
    // 1. Fetch active jobs
    const jobsRes = await fetch(`https://${subdomain}.workable.com/spi/v3/jobs?limit=100`, {
      headers,
      cache: "no-store",
    });

    const jobsMap = new Map<string, WorkableJob>();
    if (jobsRes.ok) {
      const jobsData = (await jobsRes.json()) as { jobs?: WorkableJob[] };
      (jobsData.jobs || []).forEach((j) => {
        jobsMap.set(j.shortcode, j);
      });
    }

    // 2. Fetch all candidates with pagination (up to 40 pages = 4,000 candidates)
    const rawCandidates: WorkableCandidate[] = [];
    let nextUrl: string | null = `https://${subdomain}.workable.com/spi/v3/candidates?limit=100`;
    let pageCount = 0;
    const MAX_PAGES = 45;

    while (nextUrl && pageCount < MAX_PAGES) {
      pageCount++;
      let candRes = await fetch(nextUrl, { headers, cache: "no-store" });

      if (candRes.status === 429) {
        console.warn(`[Workable] 429 Rate Limit on page ${pageCount}. Waiting 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
        candRes = await fetch(nextUrl, { headers, cache: "no-store" });
      }

      if (!candRes.ok) {
        console.warn(`[Workable] Stopped pagination at page ${pageCount} (Status: ${candRes.status})`);
        break;
      }

      const candData = (await candRes.json()) as {
        candidates?: WorkableCandidate[];
        paging?: { next?: string };
      };

      const pageCandidates = candData.candidates || [];
      if (!pageCandidates.length) break;

      rawCandidates.push(...pageCandidates);
      nextUrl = candData.paging?.next || null;

      if (nextUrl) {
        // Safe 180ms delay between pages to ensure 100% completion without 429
        await new Promise((r) => setTimeout(r, 180));
      }
    }

    if (!rawCandidates.length) {
      return memoryCache || [];
    }

    // 3. Map candidates
    const mapped: RecruitmentCandidate[] = rawCandidates.map((c) => {
      const job = c.job ? jobsMap.get(c.job.shortcode) : undefined;
      const positionTitle = c.job?.title || job?.title || "Staff Professional";
      const { bu, department, division, directorate } = inferOrgStructure(positionTitle, job);
      const status = mapWorkableStageToHarmoni(c.stage, c.stage_kind);
      const appliedDate = c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

      return {
        id: `WRK-${c.id}`,
        candidateName: c.name || `${c.firstname || ""} ${c.lastname || ""}`.trim() || "Kandidat Pelamar",
        position: positionTitle,
        businessUnit: bu,
        department,
        division,
        directorate,
        status,
        appliedDate,
        email: c.email || "-",
        phone: c.phone || "-",
        source: formatSourceChannel(c.common_source, c.common_source_category),
        sourceCategory: c.common_source_category,
        workableUrl: c.profile_url,
        notes: c.headline ? String(c.headline) : undefined,
      };
    });

    saveToFileCache(mapped);
    return mapped;
  } catch (error) {
    console.error("[Workable Pipeline Sync Error]:", error);
    return memoryCache || [];
  }
}

function formatSourceChannel(source?: string, category?: string): string {
  if (!source && !category) return "Workable Portal";
  const s = (source || "").trim();
  const c = (category || "").trim();
  if (s) {
    if (s.toLowerCase().includes("linkedin")) return "LinkedIn";
    if (s.toLowerCase().includes("jobstreet")) return "JobStreet";
    if (s.toLowerCase().includes("karir") || s.toLowerCase().includes("career")) return "Career Site";
    if (s.toLowerCase().includes("internal")) return "Internal Referral";
    if (s.toLowerCase().includes("search") || s.toLowerCase().includes("ai")) return "AI Sourcing";
    if (s.toLowerCase().includes("upload")) return "Uploaded / Direct";
    return s;
  }
  return c || "Workable Portal";
}

function mapWorkableStageToHarmoni(
  stage: string,
  stageKind: string
): RecruitmentCandidate["status"] {
  const normStage = (stage || "").toLowerCase();
  const normKind = (stageKind || "").toLowerCase();

  if (normKind === "hired" || normStage.includes("hired")) return "Hired";
  if (normKind === "offer" || normStage.includes("offer")) return "Offering Letter";
  if (normStage.includes("mcu") || normStage.includes("medical")) return "Medical Check-Up (MCU)";
  if (normStage.includes("interview 2") || normStage.includes("hr interview")) return "HR Interview";
  if (normKind === "interview" || normStage.includes("interview 1") || normStage.includes("user")) return "User Interview";
  if (normKind === "assessment" || normStage.includes("psikotes") || normStage.includes("test")) return "Psikotes";
  if (normKind === "sourced" || normStage.includes("source")) return "Sourcing";
  return "Screening CV";
}

function inferOrgStructure(position: string, job?: WorkableJob) {
  const posLower = position.toLowerCase();
  const locLower = (job?.location?.location_str || "").toLowerCase();

  let bu = "PT Berau Coal - Site Lati";
  if (locLower.includes("jakarta") || posLower.includes("tax") || posLower.includes("finance") || posLower.includes("hr") || posLower.includes("legal")) {
    bu = "PT Berau Coal - HO Jakarta";
  } else if (locLower.includes("binungan") || posLower.includes("plan") || posLower.includes("survey")) {
    bu = "PT Berau Coal - Site Binungan";
  } else if (locLower.includes("sambarata") || posLower.includes("hse") || posLower.includes("safety") || posLower.includes("environment")) {
    bu = "PT Berau Coal - Site Sambarata";
  } else if (locLower.includes("redeb") || locLower.includes("berau")) {
    bu = "PT Berau Coal - HO Tanjung Redeb";
  }

  let department = job?.department || "LATI MINE OPERATION DEPARTMENT";
  let division = "MINE OPERATION & SUPPORT DIVISION";
  let directorate = "OPERATION & HSE DIRECTORATE";

  if (/mine|pit|coal|drill|blast|geotech/i.test(posLower)) {
    department = "LATI MINE OPERATION DEPARTMENT";
    division = "MINE OPERATION & SUPPORT DIVISION";
    directorate = "OPERATION & HSE DIRECTORATE";
  } else if (/plan|survey|geology|resource|modelling/i.test(posLower)) {
    department = "MINE DEV & PRODUCTION CONTROL DEPT";
    division = "MINE PLANNING & TECH. SERVICES DIVISION";
    directorate = "OPERATION & HSE DIRECTORATE";
  } else if (/hse|safety|environment|k3|rescue/i.test(posLower)) {
    department = "OCCUPATIONAL HEALTH & SAFETY DEPT";
    division = "ENVIRONMENT, HEALTH & SAFETY DIVISION";
    directorate = "OPERATION & HSE DIRECTORATE";
  } else if (/hr|talent|people|recruit|learning|hc/i.test(posLower)) {
    department = "HR OPERATIONS DEPARTMENT";
    division = "HRGS BC DIVISION";
    directorate = "HRGS DIRECTORATE";
  } else if (/tax|finance|account|audit|cost/i.test(posLower)) {
    department = "FINANCE & TAX DEPARTMENT";
    division = "FINANCE & ACCOUNTING DIVISION";
    directorate = "FINANCE DIRECTORATE";
  } else if (/it|tech|developer|software|system|digital/i.test(posLower)) {
    department = "INFORMATION TECHNOLOGY DEPARTMENT";
    division = "DIGITAL TRANSFORMATION DIVISION";
    directorate = "FINANCE & TECHNOLOGY DIRECTORATE";
  }

  return { bu, department, division, directorate };
}
