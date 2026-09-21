import assert from "node:assert/strict";
import { inspectSapOrgCsv, parseSapCsv } from "../src/lib/services/integrations/sap-om/sap-om-csv";

const objectHeader = "PLVAR,OTYPE,OBJID,ISTAT,BEGDA,ENDDA,LANGU,STEXT,INFTY";
const edgeHeader = "MANDT,PLVAR,OTYPE,OBJID,RSIGN,RELAT,SCLAS,SOBID,ISTAT,BEGDA,ENDDA,INFTY";
const object = (type: string, code: string, name: string, language = "E", from = "2020-01-01", to = "9999-12-31") =>
  `01,${type},${code},1,${from},${to},${language},${name},1000`;
const edge = (type: string, code: string, sign: string, relation: string, targetType: string, target: string, from = "2020-01-01", to = "9999-12-31", client = "100") =>
  `${client},01,${type},${code},${sign},${relation},${targetType},${target},1,${from},${to},1001`;
const master = [objectHeader, object("O", "0001", "BU A"), object("O", "0002", "Department"), object("O", "0003", "BU B"), object("S", "0001", "Position same numeric code"), object("S", "0020", "Position")].join("\n");
const edges = [edgeHeader,
  edge("O", "0002", "A", "002", "O", "0001"),
  edge("O", "0001", "B", "002", "O", "0002"),
  edge("O", "0001", "A", "002", "O", "9999"), // parent outside extract = scoped root
  edge("S", "0020", "A", "003", "O", "0002"),
  edge("O", "0002", "B", "003", "S", "0020"), // reciprocal must dedupe
  edge("S", "0001", "A", "003", "O", "0003"),
  edge("S", "0020", "A", "008", "P", "PERSON_SECRET_DO_NOT_EMIT"),
  edge("S", "0020", "A", "002", "S", "0001"), // NOT an org-unit edge
  edge("S", "0020", "A", "003", "O", "0001", "2027-01-01"), // future
  edge("S", "0020", "A", "003", "O", "0001", "2020-01-01", "2021-01-01"), // expired
].join("\n");
const options = { asOf: "2026-09-18" };
const report = inspectSapOrgCsv(master, edges, options);
assert.equal(report.status, "PREVIEW_READY");
assert.equal(report.official, false);
assert.equal(report.scopeVerified, false);
assert.equal(report.depthBasis, "EXTRACT_ROOT_NOT_GROUP_ROOT");
assert.deepEqual(report.forest.map((root) => root.code), ["0001", "0003"]);
assert.equal(report.forest[0].relativeDepth, 0);
assert.equal(report.forest[0].children[0].relativeDepth, 1);
assert.equal(report.forest[0].children[0].code, "0002");
assert.deepEqual(report.forest[0].children[0].positionCodes, ["0020"]);
assert.deepEqual(report.forest[1].positionCodes, ["0001"], "O and S with equal IDs must not collide");
assert.equal(report.positionAssignments.length, 2);
assert.equal(report.summary.excludedPersonRelationRows, 1);
assert.equal(JSON.stringify(report).includes("PERSON_SECRET_DO_NOT_EMIT"), false);
assert.equal(report.issues.some((item) => item.code === "PARENT_OUTSIDE_EXTRACT"), true);
const codeOnlyPositions = inspectSapOrgCsv(master.split("\n").filter((row) => !row.startsWith("01,S,")).join("\n"), edges, options);
assert.equal(codeOnlyPositions.status, "PREVIEW_READY", "S masters are optional when only position codes are served");
assert.deepEqual(codeOnlyPositions.forest[0].children[0].positionCodes, ["0020"]);
assert.equal(codeOnlyPositions.positionAssignments[0].positionMasterFound, false);
const untranslatedPositions = inspectSapOrgCsv(master.replace(",E,Position", ",D,Position").replace(",E,Position same", ",D,Position same"), edges, options);
assert.equal(untranslatedPositions.status, "PREVIEW_READY", "Position labels/languages are outside the code-only contract");

const partial = inspectSapOrgCsv([objectHeader, object("CP", "123", "Do not use person")].join("\n"), edges, options);
assert.equal(partial.status, "INCOMPLETE");
assert.deepEqual(partial.forest, []);
assert.equal(partial.positionAssignments[0].orgUnitMasterFound, false);
assert.equal(partial.issues.some((item) => item.code === "NO_ORG_UNIT_MASTERS"), true);
assert.equal(JSON.stringify(partial).includes("Do not use person"), false);

const cycle = inspectSapOrgCsv(master, [edges, edge("O", "0001", "A", "002", "O", "0002")].join("\n").replace(edge("O", "0001", "A", "002", "O", "9999"), ""), options);
assert.equal(cycle.status, "INCOMPLETE");
assert.equal(cycle.issues.some((item) => item.code === "ORG_CYCLE"), true);
assert.deepEqual(cycle.forest, []);
const multipleParents = inspectSapOrgCsv(master, [edges, edge("O", "0002", "A", "002", "O", "0003")].join("\n"), options);
assert.equal(multipleParents.issues.some((item) => item.code === "MULTIPLE_PARENTS"), true);
assert.deepEqual(multipleParents.forest, []);
const mixedClients = inspectSapOrgCsv(master, [edges, edge("O", "0002", "A", "002", "O", "0001", "2020-01-01", "9999-12-31", "200")].join("\n"), options);
assert.equal(mixedClients.status, "INCOMPLETE");
assert.equal(mixedClients.summary.activeMembershipRows, 0);
assert.equal(inspectSapOrgCsv(master, edges, { ...options, planVersion: "02" }).status, "INCOMPLETE");
const invalidDate = inspectSapOrgCsv(master, [edgeHeader, edge("S", "0020", "A", "003", "O", "0001", "2026-02-30")].join("\n"), options);
assert.equal(invalidDate.issues.some((item) => item.code === "INVALID_VALIDITY"), true);
const conflictingName = inspectSapOrgCsv([master, object("O", "0001", "Different overlapping name")].join("\n"), edges, options);
assert.equal(conflictingName.issues.some((item) => item.code === "AMBIGUOUS_MASTER"), true);
assert.equal(inspectSapOrgCsv(master.replaceAll("2020-01-01", "20200101"), edges, options).status, "PREVIEW_READY");

const translation = inspectSapOrgCsv([master, object("O", "0001", "Translated BU", "D")].join("\n"), edges, options);
assert.equal(translation.forest[0].name, "BU A");
assert.deepEqual(parseSapCsv('\uFEFFCODE,NAME\r\n001,"Mining, \"\"Operations\"\"\nTeam"\r\n').rows, [{ CODE: "001", NAME: 'Mining, "Operations"\nTeam' }]);
assert.throws(() => parseSapCsv('A,B\n1,"unterminated'), /Unterminated/);
assert.throws(() => parseSapCsv("A,A\n1,2"), /headers/);
assert.throws(() => parseSapCsv("A,B\n1,2,3"), /fields/);
assert.throws(() => inspectSapOrgCsv("A,B\n1,2", edges, options), /missing columns/);
assert.throws(() => inspectSapOrgCsv(master, edges, { asOf: "2026-02-30" }), /snapshot date/);
console.log("SAP OM CSV preview tests passed (direction, typed codes, validity, languages, privacy, cycles, incomplete exports).");
