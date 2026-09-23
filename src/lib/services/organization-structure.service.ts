import "server-only";

import { isHrCoreConfigured } from "@/lib/hr-core";
import { buildOrganizationForest, type HrCoreOrgUnit } from "@/lib/organization-forest";
import { prisma } from "@/lib/prisma";
import {
  getOrganizationBreadcrumb as getHrCoreOrganizationBreadcrumb,
  getOrganizationForest as getHrCoreOrganizationForest,
  getOrganizationUnitPositions as getHrCoreOrganizationUnitPositions,
  type HrCoreBusinessUnit,
  type HrCorePosition,
  type HrCoreSnapshotSummary,
} from "@/lib/services/hr-core-organization.service";

export type OrganizationStructureSource = "HR_CORE" | "LEGACY_OPERATION";

export type OrganizationStructureForest = {
  roots: ReturnType<typeof buildOrganizationForest>;
  totalUnits: number;
  source: OrganizationStructureSource;
  snapshotCadence: "NIGHTLY_01_15_WIB" | "STATIC_LEGACY_SNAPSHOT";
  businessUnits: HrCoreBusinessUnit[];
  snapshot: HrCoreSnapshotSummary;
  fallbackReason: string | null;
};

const LEGACY_OPERATION_CODE = "DIR-OPERATION-HSE";

export async function getOrganizationStructureForest(): Promise<OrganizationStructureForest> {
  if (isHrCoreConfigured()) {
    try {
      return { ...(await getHrCoreOrganizationForest()), fallbackReason: null };
    } catch (error) {
      console.error("[HR_CORE_ORG_FALLBACK]", error instanceof Error ? error.message : "Unknown error");
      return getLegacyOperationForest("HR Core sedang tidak tersedia. Menampilkan snapshot Operation sebelumnya.");
    }
  }

  return getLegacyOperationForest("Integrasi HR Core belum dikonfigurasi. Menampilkan snapshot Operation sebelumnya.");
}

export async function getOrganizationStructureBreadcrumb(code: string, source: OrganizationStructureSource) {
  if (source === "HR_CORE") return getHrCoreOrganizationBreadcrumb(code);

  const directorate = await readLegacyOperationDirectorate();
  if (!directorate) return [];
  if (directorate.code === code) return [breadcrumbItem(directorate, 0)];

  for (const division of directorate.divisions) {
    if (division.code === code) {
      return [breadcrumbItem(directorate, 0), breadcrumbItem(division, 1)];
    }
    const department = division.departments.find((item) => item.code === code);
    if (department) {
      return [breadcrumbItem(directorate, 0), breadcrumbItem(division, 1), breadcrumbItem(department, 2)];
    }
  }
  return [];
}

export async function getOrganizationStructureUnitPositions(
  code: string,
  source: OrganizationStructureSource,
): Promise<HrCorePosition[]> {
  if (source === "HR_CORE") return getHrCoreOrganizationUnitPositions(code);

  const directorate = await readLegacyOperationDirectorate();
  const department = directorate?.divisions
    .flatMap((division) => division.departments)
    .find((item) => item.code === code);
  if (!department) return [];

  return department.positions.map((position) => ({
    positionCode: position.positionCode,
    positionName: position.positionName,
    validFrom: null,
    validTo: null,
  }));
}

async function getLegacyOperationForest(fallbackReason: string): Promise<OrganizationStructureForest> {
  const directorate = await readLegacyOperationDirectorate();
  if (!directorate) {
    return {
      roots: [], totalUnits: 0, source: "LEGACY_OPERATION", snapshotCadence: "STATIC_LEGACY_SNAPSHOT",
      businessUnits: [], snapshot: { lastLoad: null, snapshotsVisible: 0 }, fallbackReason,
    };
  }

  const units: HrCoreOrgUnit[] = [{
    code: directorate.code, name: directorate.name, parentCode: null, depth: 0, path: [directorate.code],
  }];
  const timestamps: Date[] = [directorate.updatedAt];

  for (const division of directorate.divisions) {
    units.push({
      code: division.code, name: division.name, parentCode: directorate.code, depth: 1,
      path: [directorate.code, division.code],
    });
    timestamps.push(division.updatedAt);
    for (const department of division.departments) {
      units.push({
        code: department.code, name: department.name, parentCode: division.code, depth: 2,
        path: [directorate.code, division.code, department.code],
      });
      timestamps.push(department.updatedAt);
      for (const position of department.positions) {
        timestamps.push(position.updatedAt);
        if (position.importedAt) timestamps.push(position.importedAt);
      }
    }
  }

  const lastLoad = timestamps.reduce((latest, value) => value > latest ? value : latest).toISOString();
  return {
    roots: buildOrganizationForest(units),
    totalUnits: units.length,
    source: "LEGACY_OPERATION",
    snapshotCadence: "STATIC_LEGACY_SNAPSHOT",
    businessUnits: [{
      code: directorate.code, name: directorate.name, businessGrouping: "Data sementara", pillar: "Operation",
    }],
    snapshot: { lastLoad, snapshotsVisible: 1 },
    fallbackReason,
  };
}

async function readLegacyOperationDirectorate() {
  return prisma.organizationDirectorate.findFirst({
    where: {
      isActive: true,
      OR: [
        { code: LEGACY_OPERATION_CODE },
        { name: { equals: "OPERATION & HSE DIRECTORATE", mode: "insensitive" } },
      ],
    },
    include: {
      divisions: {
        where: { isActive: true }, orderBy: { name: "asc" },
        include: {
          departments: {
            where: { isActive: true }, orderBy: { name: "asc" },
            include: {
              positions: {
                where: { isActive: true }, orderBy: { positionName: "asc" },
                select: { positionCode: true, positionName: true, importedAt: true, updatedAt: true },
              },
            },
          },
        },
      },
    },
  });
}

function breadcrumbItem(item: { code: string; name: string }, depth: number) {
  return { code: item.code, name: item.name, depth };
}
