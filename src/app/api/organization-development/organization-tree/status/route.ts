import { assertOrgStructureAccess, cachedHrCoreJson, hrCoreApiError } from "@/lib/hr-core-api";
import { getOrganizationStructureForest } from "@/lib/services/organization-structure.service";

export async function GET() {
  const guard = await assertOrgStructureAccess();
  if (guard.error) return guard.error;
  try {
    const forest = await getOrganizationStructureForest();
    return cachedHrCoreJson({
      source: forest.source,
      snapshotCadence: forest.snapshotCadence,
      businessUnits: forest.businessUnits,
      snapshot: forest.snapshot,
      fallbackReason: forest.fallbackReason,
    });
  } catch (error) {
    return hrCoreApiError(error);
  }
}
