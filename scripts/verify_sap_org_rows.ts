import assert from "node:assert/strict";
import { normalizeSapOmRows, type SapOmRow } from "../src/lib/services/integrations/sap-om/sap-om-rows";

// In-memory integration payloads: no CSV parser, database, or employee data.
const master = (OTYPE: string, OBJID: string, STEXT: string): SapOmRow => ({
  MANDT: "100", PLVAR: "01", OTYPE, OBJID, STEXT, LANGU: "E", ISTAT: "1", BEGDA: "20200101", ENDDA: "99991231",
});
const edge = (OTYPE: string, OBJID: string, RSIGN: string, RELAT: string, SCLAS: string, SOBID: string): SapOmRow => ({
  MANDT: "100", PLVAR: "01", OTYPE, OBJID, RSIGN, RELAT, SCLAS, SOBID, ISTAT: "1", BEGDA: "20200101", ENDDA: "99991231",
});
const masters = [master("O", "0002", "Department"), master("S", "0002", "Not a person"), master("O", "0001", "BU"), master("O", "0003", "Second BU")];
const edges = [
  edge("O", "0002", "A", "002", "O", "0001"),
  edge("O", "0001", "B", "002", "O", "0002"),
  edge("O", "0001", "A", "002", "O", "OUTSIDE_SCOPE"),
  edge("S", "0002", "A", "003", "O", "0002"),
  edge("O", "0002", "B", "003", "S", "0002"),
  edge("S", "0020", "A", "003", "O", "0001"),
  edge("S", "0002", "A", "002", "S", "0020"),
  edge("S", "0020", "B", "002", "S", "0002"),
  edge("S", "0002", "A", "005", "S", "9999"), // Not line reporting.
  edge("S", "0002", "A", "008", "P", "DO_NOT_EMIT_HOLDER"),
];
const options = { asOf: "2026-09-18", client: "100" };
const result = normalizeSapOmRows(masters, edges, options);
assert.equal(result.source, "SAP_OM_ROWS");
assert.equal(result.status, "READY");
assert.equal(result.scopeVerified, false, "Transport rows do not prove BU authorization");
assert.deepEqual(result.forest.map((node) => node.code), ["0001", "0003"]);
assert.equal(result.forest[0].children[0].code, "0002");
assert.deepEqual(result.forest[0].children[0].positionCodes, ["0002"]);
assert.deepEqual(result.positionReporting, [{ positionCode: "0002", reportsToPositionCode: "0020" }]);
assert.equal(result.positionReportingValid, true);
assert.equal(result.positionAssignments.length, 2);
assert.equal(result.positions.find((node) => node.positionCode === "0002")?.reportsToPositionCode, "0020");
assert.deepEqual(result.positions.find((node) => node.positionCode === "0020")?.orgUnitCodes, ["0001"]);
assert.equal(result.positions.find((node) => node.positionCode === "0020")?.masterFound, false, "Position codes remain usable without S labels");
assert.equal(JSON.stringify(result).includes("DO_NOT_EMIT_HOLDER"), false);
assert.equal(result.positions.some((node) => node.positionCode === "9999"), false);
assert.deepEqual(normalizeSapOmRows([...masters].reverse(), [...edges].reverse(), options).forest, result.forest, "Input need not be preordered before normalization");
const renamed = normalizeSapOmRows(masters.map((row) => ({ ...row, STEXT: "Renamed" })), edges, options);
assert.deepEqual(renamed.positionReporting, result.positionReporting, "Names never define identity or relationships");

const future = { ...edge("S", "0020", "A", "002", "S", "0002"), BEGDA: "20270101" };
const expired = { ...future, BEGDA: "20200101", ENDDA: "20200102" };
const inactive = { ...future, BEGDA: "20200101", ISTAT: "2" };
assert.deepEqual(normalizeSapOmRows(masters, [...edges, future, expired, inactive], options).positionReporting, result.positionReporting);
const cycle = normalizeSapOmRows(masters, [...edges, edge("S", "0020", "A", "002", "S", "0002")], options);
assert.equal(cycle.positionReportingValid, false);
assert.deepEqual(cycle.positionReporting, []);
assert.deepEqual(cycle.forest, []);
assert.equal(cycle.issues.some((issue) => issue.code === "POSITION_REPORTING_CYCLE"), true);
assert.equal(cycle.positions.every((node) => node.reportsToPositionCode === null), true);
const ambiguous = normalizeSapOmRows(masters, [...edges, edge("S", "0002", "A", "002", "S", "0030")], options);
assert.equal(ambiguous.positionReportingValid, false);
assert.deepEqual(ambiguous.positionReporting, []);
assert.equal(ambiguous.issues.some((issue) => issue.code === "MULTIPLE_POSITION_SUPERIORS"), true);
const partial = normalizeSapOmRows([], edges, options);
assert.equal(partial.status, "INCOMPLETE");
assert.deepEqual(partial.forest, []);
assert.deepEqual(partial.positionReporting, result.positionReporting, "Missing O labels do not erase separately identified S reporting links");
assert.throws(() => normalizeSapOmRows([{ ...masters[0], OBJID: 2 } as unknown as SapOmRow], edges, options), /string values/);
assert.throws(() => normalizeSapOmRows(masters, [{ ...edges[0], SOBID: undefined } as unknown as SapOmRow], options), /missing columns/);
console.log("SAP OM row mapping tests passed (unit forest, position membership/reporting, typed codes, privacy, incomplete snapshots, invalid graphs).");
