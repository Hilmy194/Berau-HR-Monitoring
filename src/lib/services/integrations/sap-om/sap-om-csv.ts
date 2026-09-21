/** Optional offline fixture reader. Production normalization accepts rows, not CSV. */
import { normalizeSapOmRows, type SapOmOptions, type SapOmRow } from "./sap-om-rows";
export type SapCsvRow = SapOmRow;
export type { SapOmIssue as SapPreviewIssue, SapOrgNode as SapPreviewNode } from "./sap-om-rows";

export function parseSapCsv(content: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  const finishField = () => { record.push(field); field = ""; closedQuote = false; };
  const finishRecord = () => {
    finishField();
    if (record.some((value) => value.trim())) records.push(record);
    record = [];
  };
  const input = content.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char !== '"') field += char;
      else if (input[index + 1] === '"') { field += '"'; index++; }
      else { quoted = false; closedQuote = true; }
      continue;
    }
    if (closedQuote && ![",", "\r", "\n"].includes(char)) throw new Error("Invalid characters after a CSV quoted field.");
    if (char === '"') {
      if (field) throw new Error("Unexpected quote in a CSV field.");
      quoted = true;
    } else if (char === ",") finishField();
    else if (char === "\r" || char === "\n") {
      finishRecord();
      if (char === "\r" && input[index + 1] === "\n") index++;
    } else field += char;
  }
  if (quoted) throw new Error("Unterminated CSV quoted field.");
  if (field || record.length || closedQuote) finishRecord();
  const columns = records.shift()?.map((value) => value.trim());
  if (!columns?.length || columns.some((value) => !value) || new Set(columns).size !== columns.length) {
    throw new Error("CSV headers are missing, empty, or duplicated.");
  }
  const rows = records.map((values, index): SapCsvRow => {
    if (values.length !== columns.length) throw new Error(`CSV record ${index + 2} has ${values.length} fields; expected ${columns.length}.`);
    return Object.fromEntries(columns.map((column, position) => [column, values[position].trim()]));
  });
  return { columns, rows };
}

export function inspectSapOrgCsv(hrp1000: string, hrp1001: string, options: SapOmOptions) {
  const master = parseSapCsv(hrp1000);
  const relationships = parseSapCsv(hrp1001);
  for (const [data, required, source] of [
    [master, ["PLVAR", "OTYPE", "OBJID", "ISTAT", "BEGDA", "ENDDA", "LANGU", "STEXT"], "HRP1000"],
    [relationships, ["MANDT", "PLVAR", "OTYPE", "OBJID", "RSIGN", "RELAT", "SCLAS", "SOBID", "ISTAT", "BEGDA", "ENDDA"], "HRP1001"],
  ] as const) {
    const missing = required.filter((column) => !data.columns.includes(column));
    if (missing.length) throw new Error(`${source} is missing columns: ${missing.join(", ")}`);
  }
  const result = normalizeSapOmRows(master.rows, relationships.rows, options);
  return { ...result, source: "SAP_CSV_PREVIEW" as const, status: result.status === "READY" ? "PREVIEW_READY" as const : "INCOMPLETE" as const };
}
