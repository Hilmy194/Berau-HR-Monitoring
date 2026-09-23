import { z } from "zod";
import { assertOrgStructureAccess, cachedHrCoreJson, hrCoreApiError } from "@/lib/hr-core-api";
import { getOrganizationStructureUnitPositions, type OrganizationStructureSource } from "@/lib/services/organization-structure.service";

const codeSchema = z.string().trim().min(1).max(100);

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const guard = await assertOrgStructureAccess();
  if (guard.error) return guard.error;
  const parsed = codeSchema.safeParse((await params).code);
  if (!parsed.success) return Response.json({ error: "Kode org-unit tidak valid." }, { status: 400 });
  const source = parseSource(request);

  try {
    return cachedHrCoreJson(await getOrganizationStructureUnitPositions(parsed.data, source));
  } catch (error) {
    return hrCoreApiError(error);
  }
}

function parseSource(request: Request): OrganizationStructureSource {
  return new URL(request.url).searchParams.get("source") === "LEGACY_OPERATION" ? "LEGACY_OPERATION" : "HR_CORE";
}
