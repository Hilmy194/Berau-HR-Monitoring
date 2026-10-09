import fs from "fs";
import path from "path";

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

import { syncWorkablePipeline } from "../src/lib/services/integrations/workable/workable.client";

async function main() {
  const token = process.env.WORKABLE_API_KEY;
  const subdomain = process.env.WORKABLE_SUBDOMAIN || "techconnect";

  if (!token) {
    console.error("WORKABLE_API_KEY is missing in .env");
    process.exit(1);
  }

  console.log(`Starting full Workable pipeline sync for ${subdomain}...`);
  const candidates = await syncWorkablePipeline(token, subdomain);
  console.log(`✅ Finished Workable sync! Total cached candidates: ${candidates.length}`);
}

main().catch(console.error);
