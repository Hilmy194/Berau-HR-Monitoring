/**
 * Shared markers for the reporting-line (data atasan karyawan) import.
 *
 * Reporting-line rows live in the same Organization* tables as the competency
 * import, so every OD menu other than "Struktur Organisasi" must exclude them
 * using the filters below.
 */
export const REPORTING_LINE_CODE_PREFIX = "RL-";
export const REPORTING_LINE_SOURCE_FILE = "data-atasan-karyawan.md";

/** Prisma `where` fragment for OrganizationPosition. */
export const excludeReportingLinePositions = {
  NOT: { positionCode: { startsWith: REPORTING_LINE_CODE_PREFIX } },
};

/** Prisma `where` fragment for OrganizationDivision / OrganizationDepartment. */
export const excludeReportingLineUnits = {
  NOT: { code: { startsWith: REPORTING_LINE_CODE_PREFIX } },
};
