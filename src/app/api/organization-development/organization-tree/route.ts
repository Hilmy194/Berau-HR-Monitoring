import { assertOrgStructureAccess, cachedHrCoreJson, hrCoreApiError } from "@/lib/hr-core-api";
import { getOrganizationStructureForest } from "@/lib/services/organization-structure.service";

export async function GET() {
  const guard = await assertOrgStructureAccess();
  if (guard.error) return guard.error;

  try {
    return cachedHrCoreJson(await getOrganizationStructureForest());
  } catch (error) {
    return hrCoreApiError(error);
  }
}
