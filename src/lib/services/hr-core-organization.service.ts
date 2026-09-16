import "server-only";

import { isHrCoreConfigured, queryHrCore, withReadOnlyHrCoreClient } from "@/lib/hr-core";
import { buildOrganizationForest, type HrCoreOrgUnit } from "@/lib/organization-forest";
export { buildOrganizationForest } from "@/lib/organization-forest";
export type { HrCoreOrgNode, HrCoreOrgUnit } from "@/lib/organization-forest";

type OrgUnitDbRow = {
  code: string;
  name: string;
  parent_code: string | null;
  depth: number;
  path?: string[];
};

type PositionDbRow = {
  position_code: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type HrCorePosition = {
  positionCode: string;
  validFrom: string | null;
  validTo: string | null;
};

export type PositionOrganizationContext = {
  source: "HR_CORE";
  snapshotCadence: "NIGHTLY_01_15_WIB";
  positionCode: string;
  assignments: Array<{
    orgUnitCode: string;
    orgUnitName: string;
    breadcrumb: Array<{ code: string; name: string; depth: number }>;
  }>;
};

const ALL_ORG_UNITS_SQL = `
  SELECT code, name, parent_code, depth, path
  FROM core.v_org_unit
  WHERE active
  ORDER BY path
`;

export async function getOrganizationForest() {
  const { rows } = await queryHrCore<OrgUnitDbRow>(ALL_ORG_UNITS_SQL);
  const units = rows.map(mapOrgUnit);
  return {
    roots: buildOrganizationForest(units),
    totalUnits: units.length,
    source: "HR_CORE" as const,
    snapshotCadence: "NIGHTLY_01_15_WIB" as const,
  };
}

export async function getBusinessUnitSubtree(businessUnitCode: string) {
  const { rows } = await queryHrCore<OrgUnitDbRow>(`
    SELECT code, name, parent_code, depth, path
    FROM core.v_org_unit
    WHERE $1 = ANY(path) AND active
    ORDER BY path
  `, [businessUnitCode]);
  const units = rows.map(mapOrgUnit);
  return {
    roots: buildOrganizationForest(units),
    totalUnits: units.length,
    businessUnitCode,
    source: "HR_CORE" as const,
  };
}

export async function getOrganizationChildren(parentCode: string) {
  const { rows } = await queryHrCore<OrgUnitDbRow>(`
    SELECT code, name, parent_code, depth
    FROM core.v_org_unit
    WHERE parent_code = $1 AND active
    ORDER BY name
  `, [parentCode]);
  return rows.map(mapOrgUnit);
}

export async function getOrganizationBreadcrumb(code: string) {
  const { rows } = await queryHrCore<OrgUnitDbRow>(`
    SELECT u.code, u.name, u.parent_code, u.depth
    FROM core.v_org_unit u
    WHERE u.code = ANY((SELECT path FROM core.v_org_unit WHERE code = $1))
      AND u.active
    ORDER BY u.depth
  `, [code]);
  return rows.map(mapOrgUnit);
}

export async function getOrganizationUnitPositions(orgUnitCode: string) {
  const { rows } = await queryHrCore<PositionDbRow>(`
    SELECT to_code AS position_code, valid_from::text AS valid_from, valid_to::text AS valid_to
    FROM core.v_org_edge
    WHERE from_code = $1
      AND edge_type = 'A003'
      AND to_object_type = 'S'
      AND active
      AND valid_to >= current_date
    ORDER BY to_code
  `, [orgUnitCode]);
  return rows.map((row) => ({
    positionCode: row.position_code,
    validFrom: dateOnly(row.valid_from),
    validTo: dateOnly(row.valid_to),
  }));
}

export async function getPositionOrganizationContext(positionCode: string): Promise<PositionOrganizationContext | null> {
  if (!isHrCoreConfigured()) return null;

  return withReadOnlyHrCoreClient<PositionOrganizationContext | null>(async (client) => {
    const assignments = await client.query<OrgUnitDbRow>(`
      SELECT DISTINCT u.code, u.name, u.parent_code, u.depth, u.path
      FROM core.v_org_edge e
      JOIN core.v_org_unit u ON u.code = e.from_code
      WHERE e.to_code = $1
        AND e.edge_type = 'A003'
        AND e.to_object_type = 'S'
        AND e.active
        AND u.active
        AND e.valid_to >= current_date
      ORDER BY u.path
      LIMIT 10
    `, [positionCode]);

    const result = [];
    for (const assignment of assignments.rows) {
      const breadcrumb = await client.query<Pick<OrgUnitDbRow, "code" | "name" | "depth">>(`
        SELECT u.code, u.name, u.depth
        FROM core.v_org_unit u
        WHERE u.code = ANY($1::text[]) AND u.active
        ORDER BY u.depth
      `, [assignment.path ?? []]);
      result.push({
        orgUnitCode: assignment.code,
        orgUnitName: assignment.name,
        breadcrumb: breadcrumb.rows.map((item) => ({
          code: item.code,
          name: item.name,
          depth: Number(item.depth),
        })),
      });
    }

    if (!result.length) return null;
    return {
      source: "HR_CORE",
      snapshotCadence: "NIGHTLY_01_15_WIB",
      positionCode,
      assignments: result,
    };
  }).catch((error: unknown) => {
    console.error("[HR_CORE_POSITION_CONTEXT_ERROR]", error instanceof Error ? error.message : "Unknown error");
    throw new Error("Referensi struktur organisasi HR Core sedang tidak tersedia. Coba kembali setelah koneksi pulih.");
  });
}

function mapOrgUnit(row: OrgUnitDbRow): HrCoreOrgUnit {
  return {
    code: row.code,
    name: row.name,
    parentCode: row.parent_code,
    depth: Number(row.depth),
    path: row.path ?? [],
  };
}

function dateOnly(value: string | null) {
  if (!value) return null;
  return String(value).slice(0, 10);
}
