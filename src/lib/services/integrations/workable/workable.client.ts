/**
 * Workable API Integration Client
 * Connects to Workable SPI v3 to retrieve real jobs and candidate pipelines.
 */

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

// In-memory cache to avoid hitting Workable rate limits on every page render
let cachedCandidates: RecruitmentCandidate[] | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function fetchWorkableCandidates(): Promise<RecruitmentCandidate[] | null> {
  const token = process.env.WORKABLE_API_KEY;
  const subdomain = process.env.WORKABLE_SUBDOMAIN || "techconnect";

  if (!token) {
    return null;
  }

  const now = Date.now();
  if (cachedCandidates && cacheExpiry > now) {
    return cachedCandidates;
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    // 1. Fetch active jobs to build dictionary of departments & locations
    const jobsRes = await fetch(`https://${subdomain}.workable.com/spi/v3/jobs?limit=100`, {
      headers,
      next: { revalidate: 60 },
    });

    const jobsMap = new Map<string, WorkableJob>();
    if (jobsRes.ok) {
      const jobsData = (await jobsRes.json()) as { jobs?: WorkableJob[] };
      (jobsData.jobs || []).forEach((j) => {
        jobsMap.set(j.shortcode, j);
      });
    }

    // 2. Fetch all candidates with pagination
    const rawCandidates: WorkableCandidate[] = [];
    let nextUrl: string | null = `https://${subdomain}.workable.com/spi/v3/candidates?limit=100`;
    let pageCount = 0;
    const MAX_PAGES = 50; // Safety limit: up to 5,000 candidates

    while (nextUrl && pageCount < MAX_PAGES) {
      pageCount++;
      let candRes = await fetch(nextUrl, {
        headers,
        cache: "no-store",
      });

      // If rate-limited (HTTP 429), wait 2 seconds and retry once
      if (candRes.status === 429) {
        console.warn(`[Workable] Rate limit hit on page ${pageCount}. Waiting 2s before retry...`);
        await new Promise((r) => setTimeout(r, 2000));
        candRes = await fetch(nextUrl, {
          headers,
          cache: "no-store",
        });
      }

      if (!candRes.ok) {
        console.warn(`Workable API returned status ${candRes.status} on page ${pageCount}`);
        break;
      }

      const candData = (await candRes.json()) as {
        candidates?: WorkableCandidate[];
        paging?: { next?: string };
      };

      const pageCandidates = candData.candidates || [];
      if (!pageCandidates.length) {
        break;
      }

      rawCandidates.push(...pageCandidates);

      if (candData.paging?.next) {
        nextUrl = candData.paging.next;
        // Small throttle delay between pages to prevent rate limits
        await new Promise((r) => setTimeout(r, 60));
      } else {
        nextUrl = null;
      }
    }

    if (!rawCandidates.length) {
      return [];
    }

    // 3. Map Workable candidates into Harmoni RecruitmentCandidate model
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
        source: c.common_source || "Workable Portal",
        sourceCategory: c.common_source_category,
        workableUrl: c.profile_url,
        notes: c.headline ? String(c.headline) : undefined,
      };
    });

    cachedCandidates = mapped;
    cacheExpiry = now + 300 * 1000; // 5 minutes cache
    return mapped;
  } catch (error) {
    console.error("Error fetching candidates from Workable API:", error);
    return null;
  }
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
