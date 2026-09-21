import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { inspectSapOrgCsv } from "../src/lib/services/integrations/sap-om/sap-om-csv";

async function main() {
  const flags = new Map<string, string>();
  const allowed = new Set(["--hrp1000", "--hrp1001", "--as-of", "--language", "--plan-version", "--client", "--output"]);
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("npm run org:inspect:sap-csv -- --hrp1000 PATH --hrp1001 PATH --as-of YYYY-MM-DD [--language E] [--plan-version 01] [--client 100] [--output runtime/report.json]");
    console.log("Offline preview only. No database writes, no person/holder output, no replacement of HR Core role scope.");
    return;
  }
  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || !args[index + 1] || args[index + 1].startsWith("--") || flags.has(args[index])) {
      throw new Error(`Invalid or duplicate option: ${args[index]}. Use --help.`);
    }
    flags.set(args[index], args[index + 1]);
  }
  const masterPath = flags.get("--hrp1000");
  const edgePath = flags.get("--hrp1001");
  const asOf = flags.get("--as-of");
  if (!masterPath || !edgePath || !asOf) throw new Error("Both CSV paths and --as-of snapshot date are required. Use --help.");
  const inputs = [masterPath, edgePath].map((file) => path.resolve(file));
  for (const file of inputs) {
    const info = await stat(file);
    if (!info.isFile() || info.size > 50 * 1024 * 1024) throw new Error("Each input must be a CSV file smaller than 50 MB.");
  }
  const [master, edges] = await Promise.all(inputs.map((file) => readFile(file, "utf8")));
  const report = inspectSapOrgCsv(master, edges, {
    asOf, language: flags.get("--language"), planVersion: flags.get("--plan-version"), client: flags.get("--client"),
  });
  const json = JSON.stringify(report, null, 2);
  const output = flags.get("--output");
  if (output) {
    const target = path.resolve(output);
    if (inputs.some((input) => input.toLowerCase() === target.toLowerCase())) throw new Error("Output must not overwrite an input CSV.");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${json}\n`, { encoding: "utf8", flag: "wx" });
    console.log(`Report saved to ${target}`);
    console.log(JSON.stringify({ status: report.status, summary: report.summary, issues: report.issues }, null, 2));
  } else console.log(json);
  // A partial sample must never be mistaken for a verified production chart.
  if (report.status === "INCOMPLETE") process.exitCode = 2;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "SAP CSV inspection failed.");
  process.exitCode = 1;
});
