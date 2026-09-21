/** Transport-independent mapping of SAP OM snapshot rows, not a database reader.
 * Codes/dates must arrive as strings. This mapper cannot attest BU authorization.
 */
export type SapOmRow = Record<string, string>;
export type SapOmOptions = {
  asOf: string;
  planVersion?: string;
  language?: string;
  activeStatus?: string;
  client?: string;
};
export type SapOmIssue = { code: string; severity: "ERROR" | "WARNING"; message: string; count: number };
export type SapOrgNode = {
  code: string;
  name: string;
  parentCode: string | null;
  relativeDepth: number;
  children: SapOrgNode[];
  positionCodes: string[];
};

export function normalizeSapOmRows(hrp1000: readonly SapOmRow[], hrp1001: readonly SapOmRow[], options: SapOmOptions) {
  const masterRows = validateRows(hrp1000, ["PLVAR", "OTYPE", "OBJID", "ISTAT", "BEGDA", "ENDDA", "LANGU", "STEXT"], "HRP1000");
  const relationshipRows = validateRows(hrp1001, ["MANDT", "PLVAR", "OTYPE", "OBJID", "RSIGN", "RELAT", "SCLAS", "SOBID", "ISTAT", "BEGDA", "ENDDA"], "HRP1001");
  const master = { rows: masterRows };
  const relationships = { rows: relationshipRows };
  const asOf = isoDate(options.asOf);
  if (!asOf) throw new Error("asOf must be a valid YYYY-MM-DD or YYYYMMDD snapshot date.");
  const planVersion = options.planVersion ?? "01";
  const language = options.language ?? "E";
  const activeStatus = options.activeStatus ?? "1";
  const issues = new Map<string, SapOmIssue>();
  function issue(code: string, severity: SapOmIssue["severity"], message: string, count = 1) {
    const existing = issues.get(code);
    if (existing) existing.count += count;
    else issues.set(code, { code, severity, message, count });
  }
  const clients = [...new Set(relationships.rows.filter((row) => row.PLVAR === planVersion).map((row) => row.MANDT))];
  const client = options.client ?? (clients.length === 1 ? clients[0] : undefined);
  if (!client) issue("CLIENT_NOT_SELECTED", "ERROR", "Select one SAP client; exports from multiple clients must not be merged.");
  else if (!clients.includes(client)) issue("CLIENT_NOT_FOUND", "ERROR", "Selected SAP client is absent from HRP1001.");
  if (!master.rows.length || master.rows.some((row) => !row.MANDT)) issue("MASTER_CLIENT_UNVERIFIED", "WARNING", "HRP1000 lacks client identity; confirm both datasets come from the same SAP client.");
  const active = (row: SapOmRow, infotype: string) => {
    if (row.PLVAR !== planVersion || row.ISTAT !== activeStatus || row.HISTO?.trim()) return false;
    if (row.MANDT !== undefined && row.MANDT !== client) return false;
    if (row.INFTY !== undefined && row.INFTY !== infotype) {
      issue("INVALID_INFOTYPE", "ERROR", "A relevant row has an unexpected infotype.");
      return false;
    }
    const from = isoDate(row.BEGDA);
    const to = isoDate(row.ENDDA);
    if (!from || !to || from > to) {
      issue("INVALID_VALIDITY", "ERROR", "A relevant row has invalid or reversed validity dates.");
      return false;
    }
    return from <= asOf && to >= asOf;
  };

  const candidates = new Map<string, SapOmRow[]>();
  for (const row of master.rows) {
    if (!["O", "S"].includes(row.OTYPE) || !active(row, "1000")) continue;
    if (!row.OBJID) { issue("MISSING_OBJECT_CODE", "ERROR", "An active O/S master has no object code."); continue; }
    const key = objectKey(row.OTYPE, row.OBJID);
    candidates.set(key, [...(candidates.get(key) ?? []), row]);
  }
  const objects = new Map<string, { code: string; type: string; name: string }>();
  for (const [key, versions] of candidates) {
    if (versions[0].OTYPE === "S") {
      // Position labels are not part of the current consumer contract.
      objects.set(key, { code: versions[0].OBJID, type: "S", name: "" });
      continue;
    }
    const localized = versions.filter((row) => row.LANGU === language);
    if (!localized.length) { issue("MISSING_LANGUAGE", "ERROR", "An active O/S master lacks the explicitly selected language."); continue; }
    const names = new Set(localized.map((row) => row.STEXT));
    if (names.size !== 1 || names.has("")) { issue("AMBIGUOUS_MASTER", "ERROR", "An O/S code has conflicting or empty active names in the selected language."); continue; }
    objects.set(key, { code: localized[0].OBJID, type: localized[0].OTYPE, name: localized[0].STEXT });
  }
  const units = [...objects.values()].filter((object) => object.type === "O");
  const positions = [...objects.values()].filter((object) => object.type === "S");
  if (!units.length) issue("NO_ORG_UNIT_MASTERS", "ERROR", "No active O org-unit masters are available in HRP1000 for this plan/date/language.");
  if (!positions.length) issue("NO_POSITION_MASTERS", "WARNING", "No active S position masters are available; position names cannot be resolved.");

  const parents = new Map<string, string>();
  const reportingParents = new Map<string, string>();
  const reportingPositionCodes = new Set<string>();
  const membership = new Map<string, {
    orgUnitCode: string; positionCode: string; validFrom: string; validTo: string;
    rawRelationship: "S_A003_O" | "O_B003_S";
    orgUnitMasterFound: boolean; positionMasterFound: boolean;
  }>();
  let activeHierarchyRows = 0;
  let activeMembershipRows = 0;
  let activePositionReportingRows = 0;
  for (const row of relationships.rows) {
    // P/person/holder records are excluded from normalization and output.
    if (row.OTYPE === "P" || row.SCLAS === "P") continue;
    const relationship = `${row.RSIGN}${row.RELAT.padStart(3, "0")}`;
    const hierarchy = row.OTYPE === "O" && row.SCLAS === "O" && ["A002", "B002"].includes(relationship);
    const belongsTo = row.OTYPE === "S" && row.SCLAS === "O" && relationship === "A003";
    const comprises = row.OTYPE === "O" && row.SCLAS === "S" && relationship === "B003";
    const reporting = row.OTYPE === "S" && row.SCLAS === "S" && ["A002", "B002"].includes(relationship);
    if ((!hierarchy && !belongsTo && !comprises && !reporting) || !client || !active(row, "1001")) continue;
    if (!row.OBJID || !row.SOBID) { issue("MISSING_RELATION_CODE", "ERROR", "A relevant relationship has an empty object code."); continue; }
    if (reporting) {
      activePositionReportingRows++;
      const child = relationship === "A002" ? row.OBJID : row.SOBID;
      const parent = relationship === "A002" ? row.SOBID : row.OBJID;
      reportingPositionCodes.add(child);
      reportingPositionCodes.add(parent);
      if (reportingParents.has(child) && reportingParents.get(child) !== parent) {
        issue("MULTIPLE_POSITION_SUPERIORS", "ERROR", "A position has multiple active reporting parents; no superior is guessed.");
      } else reportingParents.set(child, parent);
    } else if (hierarchy) {
      activeHierarchyRows++;
      const child = relationship === "A002" ? row.OBJID : row.SOBID;
      const parent = relationship === "A002" ? row.SOBID : row.OBJID;
      if (parents.has(child) && parents.get(child) !== parent) issue("MULTIPLE_PARENTS", "ERROR", "An org-unit has multiple active parents; no parent is guessed.");
      else parents.set(child, parent);
    } else {
      activeMembershipRows++;
      const orgUnitCode = belongsTo ? row.SOBID : row.OBJID;
      const positionCode = belongsTo ? row.OBJID : row.SOBID;
      const validFrom = isoDate(row.BEGDA)!;
      const validTo = isoDate(row.ENDDA)!;
      const key = JSON.stringify([orgUnitCode, positionCode, validFrom, validTo]);
      if (!membership.has(key)) membership.set(key, {
        orgUnitCode, positionCode, validFrom, validTo,
        rawRelationship: belongsTo ? "S_A003_O" : "O_B003_S",
        orgUnitMasterFound: objects.has(objectKey("O", orgUnitCode)),
        positionMasterFound: objects.has(objectKey("S", positionCode)),
      });
    }
  }
  if (!activeHierarchyRows) issue("NO_ORG_HIERARCHY", units.length > 1 ? "ERROR" : "WARNING", "No active O-to-O A002/B002 hierarchy is present; S-to-S reporting is not an org-unit hierarchy.");
  const assignments = [...membership.values()].sort((a, b) => a.orgUnitCode.localeCompare(b.orgUnitCode) || a.positionCode.localeCompare(b.positionCode));
  const missingUnits = new Set(assignments.filter((item) => !item.orgUnitMasterFound).map((item) => item.orgUnitCode));
  const missingPositions = new Set(assignments.filter((item) => !item.positionMasterFound).map((item) => item.positionCode));
  if (missingUnits.size) issue("UNRESOLVED_UNIT_ASSIGNMENTS", "ERROR", "Position relationships reference O codes absent from the selected HRP1000 masters.", missingUnits.size);
  if (missingPositions.size) issue("UNRESOLVED_POSITION_ASSIGNMENTS", "WARNING", "S masters are absent; membership codes remain usable in preview but position names cannot be resolved.", missingPositions.size);
  for (const [child, parent] of parents) {
    if (!objects.has(objectKey("O", child))) issue("MISSING_CHILD_MASTER", "ERROR", "An O-to-O relationship references a child without an O master.");
    if (!objects.has(objectKey("O", parent))) issue("PARENT_OUTSIDE_EXTRACT", "WARNING", "A parent is absent from this extract; its child is a preview root, not an error by itself.");
  }
  const visited = new Set<string>();
  for (const code of parents.keys()) {
    const path = new Set<string>();
    let cursor: string | undefined = code;
    while (cursor && !visited.has(cursor)) {
      if (path.has(cursor)) { issue("ORG_CYCLE", "ERROR", "An active org-unit cycle was found; no forest is published."); break; }
      path.add(cursor);
      cursor = parents.get(cursor);
    }
    for (const item of path) visited.add(item);
  }
  const reportingVisited = new Set<string>();
  for (const code of reportingParents.keys()) {
    const path = new Set<string>();
    let cursor: string | undefined = code;
    while (cursor && !reportingVisited.has(cursor)) {
      if (path.has(cursor)) { issue("POSITION_REPORTING_CYCLE", "ERROR", "A position reporting cycle was found; no reporting links are published."); break; }
      path.add(cursor);
      cursor = reportingParents.get(cursor);
    }
    for (const item of path) reportingVisited.add(item);
  }
  const positionReportingValid = ![...issues.values()].some((item) => item.severity === "ERROR" &&
    ["MULTIPLE_POSITION_SUPERIORS", "POSITION_REPORTING_CYCLE", "CLIENT_NOT_SELECTED", "CLIENT_NOT_FOUND", "INVALID_VALIDITY", "INVALID_INFOTYPE", "MISSING_RELATION_CODE"].includes(item.code));
  const positionReporting = (positionReportingValid ? [...reportingParents] : []).map(([positionCode, reportsToPositionCode]) => ({ positionCode, reportsToPositionCode }))
    .sort((a, b) => a.positionCode.localeCompare(b.positionCode));
  const unitsByPosition = new Map<string, Set<string>>();
  const positionsByUnit = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    if (!unitsByPosition.has(assignment.positionCode)) unitsByPosition.set(assignment.positionCode, new Set());
    unitsByPosition.get(assignment.positionCode)!.add(assignment.orgUnitCode);
    if (!positionsByUnit.has(assignment.orgUnitCode)) positionsByUnit.set(assignment.orgUnitCode, new Set());
    positionsByUnit.get(assignment.orgUnitCode)!.add(assignment.positionCode);
  }
  const positionCodes = new Set([...positions.map((position) => position.code), ...assignments.map((assignment) => assignment.positionCode), ...reportingPositionCodes]);
  const normalizedPositions = [...positionCodes].sort().map((positionCode) => ({
    positionCode,
    orgUnitCodes: [...(unitsByPosition.get(positionCode) ?? [])].sort(),
    reportsToPositionCode: positionReportingValid ? reportingParents.get(positionCode) ?? null : null,
    masterFound: objects.has(objectKey("S", positionCode)),
  }));
  const valid = ![...issues.values()].some((item) => item.severity === "ERROR");
  const forest: SapOrgNode[] = [];
  if (valid) {
    const nodes = new Map(units.sort((a, b) => a.code.localeCompare(b.code)).map((unit) => [unit.code, {
      code: unit.code, name: unit.name, parentCode: parents.get(unit.code) ?? null,
      relativeDepth: 0, children: [] as SapOrgNode[],
      positionCodes: [...(positionsByUnit.get(unit.code) ?? [])].sort(),
    }]));
    for (const node of nodes.values()) {
      const parent = node.parentCode ? nodes.get(node.parentCode) : undefined;
      if (parent) parent.children.push(node);
      else forest.push(node);
    }
    const stack = forest.map((node) => ({ node, depth: 0 }));
    while (stack.length) {
      const { node, depth } = stack.pop()!;
      node.relativeDepth = depth;
      for (const child of node.children) stack.push({ node: child, depth: depth + 1 });
    }
  }
  const rawMasterKeys = new Set(master.rows.map((row) => JSON.stringify([row.PLVAR, row.OTYPE, row.OBJID])));
  return {
    source: "SAP_OM_ROWS" as const, official: false as const, scopeVerified: false as const,
    status: valid ? "READY" as const : "INCOMPLETE" as const,
    asOf, planVersion, language, client: client ?? null,
    depthBasis: "EXTRACT_ROOT_NOT_GROUP_ROOT" as const,
    summary: {
      hrp1000Rows: master.rows.length, hrp1001Rows: relationships.rows.length,
      masterObjectTypes: counts(master.rows.map((row) => row.OTYPE)),
      rawRelationshipTypes: counts(relationships.rows.map((row) => `${row.OTYPE}_${row.RSIGN}${row.RELAT.padStart(3, "0")}_${row.SCLAS}`)),
      rawSourceMatches: relationships.rows.filter((row) => rawMasterKeys.has(JSON.stringify([row.PLVAR, row.OTYPE, row.OBJID]))).length,
      rawTargetMatches: relationships.rows.filter((row) => rawMasterKeys.has(JSON.stringify([row.PLVAR, row.SCLAS, row.SOBID]))).length,
      activeOrgUnitMasters: units.length, activePositionMasters: positions.length,
      activeHierarchyRows, activeMembershipRows, activePositionReportingRows, normalizedAssignments: assignments.length,
      excludedPersonRelationRows: relationships.rows.filter((row) => row.OTYPE === "P" || row.SCLAS === "P").length,
    },
    issues: [...issues.values()], forest, positionAssignments: assignments,
    positions: normalizedPositions,
    positionReporting,
    positionReportingValid,
  };
}

function objectKey(type: string, code: string) { return JSON.stringify([type, code]); }
function validateRows(rows: readonly SapOmRow[], required: string[], source: string) {
  return rows.map((row, index) => {
    const missing = required.filter((column) => typeof row[column] !== "string");
    if (missing.length) throw new Error(`${source} row ${index + 1} is missing columns or string values: ${missing.join(", ")}`);
    if (Object.values(row).some((value) => typeof value !== "string")) throw new Error(`${source} row ${index + 1} must use string values; preserve codes and SAP dates at the source.`);
    return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value.trim()]));
  });
}
function counts(values: string[]) {
  const result: Record<string, number> = Object.create(null);
  for (const value of values) result[value] = (Object.prototype.hasOwnProperty.call(result, value) ? result[value] : 0) + 1;
  return result;
}
function isoDate(value: string) {
  const text = /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text ? null : text;
}
