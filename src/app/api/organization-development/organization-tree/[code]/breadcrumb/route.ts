import { z } from "zod";
import { assertOrgStructureAccess, cachedHrCoreJson, hrCoreApiError } from "@/lib/hr-core-api";
import { getOrganizationBreadcrumb } from "@/lib/services/hr-core-organization.service";

const codeSchema = z.string().trim().min(1).max(100);

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const guard = await assertOrgStructureAccess();
  if (guard.error) return guard.error;
  const parsed = codeSchema.safeParse((await params).code);
  if (!parsed.success) return Response.json({ error: "Kode org-unit tidak valid." }, { status: 400 });

  try {
    return cachedHrCoreJson(await getOrganizationBreadcrumb(parsed.data));
  } catch (error) {
    return hrCoreApiError(error);
  }
}
