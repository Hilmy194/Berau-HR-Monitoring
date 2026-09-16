import { assertOrgStructureAccess, cachedHrCoreJson, hrCoreApiError } from "@/lib/hr-core-api";
import { getOrganizationForest } from "@/lib/services/hr-core-organization.service";

export async function GET() {
  const guard = await assertOrgStructureAccess();
  if (guard.error) return guard.error;

  try {
    return cachedHrCoreJson(await getOrganizationForest());
  } catch (error) {
    return hrCoreApiError(error);
  }
}
