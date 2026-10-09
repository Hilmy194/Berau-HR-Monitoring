const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...val] = trimmed.split("=");
    if (key && val) {
      process.env[key.trim()] = val.join("=").replace(/(^"|"$)/g, "").trim();
    }
  }
}

const token = process.env.WORKABLE_API_KEY;
const subdomain = process.env.WORKABLE_SUBDOMAIN || "techconnect";

if (!token) {
  console.error("WORKABLE_API_KEY is missing in .env");
  process.exit(1);
}

const CACHE_DIR = path.join(process.cwd(), "runtime");
const CACHE_FILE = path.join(CACHE_DIR, "workable-candidates.json");

function formatSourceChannel(source, category) {
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

function mapWorkableStageToHarmoni(stage, stageKind) {
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

function inferOrgStructure(position, job) {
  const posLower = (position || "").toLowerCase();
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

async function run() {
  console.log(`[Workable] Connecting to https://${subdomain}.workable.com/spi/v3...`);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const jobsMap = new Map();
  try {
    const jobsRes = await fetch(`https://${subdomain}.workable.com/spi/v3/jobs?limit=100`, { headers });
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      (jobsData.jobs || []).forEach((j) => jobsMap.set(j.shortcode, j));
      console.log(`[Workable] Loaded ${jobsMap.size} active jobs.`);
    }
  } catch (err) {
    console.warn("[Workable] Jobs fetch warning:", err.message);
  }

  const rawCandidates = [];
  let nextUrl = `https://${subdomain}.workable.com/spi/v3/candidates?limit=100`;
  let pageCount = 0;
  const MAX_PAGES = 50;

  while (nextUrl && pageCount < MAX_PAGES) {
    pageCount++;
    process.stdout.write(`\r[Workable] Fetching page ${pageCount}... (${rawCandidates.length} candidates so far)`);
    
    let candRes = await fetch(nextUrl, { headers });
    if (candRes.status === 429) {
      console.log(`\n[Workable] Rate limit on page ${pageCount}, waiting 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
      candRes = await fetch(nextUrl, { headers });
    }

    if (!candRes.ok) {
      console.log(`\n[Workable] Finished fetching at page ${pageCount} (Status ${candRes.status})`);
      break;
    }

    const candData = await candRes.json();
    const pageList = candData.candidates || [];
    if (!pageList.length) break;

    rawCandidates.push(...pageList);
    nextUrl = candData.paging?.next || null;
    if (nextUrl) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log(`\n[Workable] Successfully retrieved ${rawCandidates.length} total candidates!`);

  const mapped = rawCandidates.map((c) => {
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

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(mapped, null, 2), "utf-8");
  console.log(`✅ Saved ${mapped.length} candidates to ${CACHE_FILE}`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
