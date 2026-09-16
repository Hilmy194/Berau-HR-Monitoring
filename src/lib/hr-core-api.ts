import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HrCoreConfigurationError } from "@/lib/hr-core";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";

export async function assertOrgStructureAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const organizationAccess = await canAccessWorkspace(
    session.user.id,
    session.user.role,
    WORKSPACE.ORGANIZATION_DEVELOPMENT,
  );
  const talentAccess = organizationAccess || await canAccessWorkspace(
    session.user.id,
    session.user.role,
    WORKSPACE.TALENT,
  );
  if (!talentAccess) {
    return { error: NextResponse.json({ error: "Akses workspace OD atau Talent diperlukan." }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function hrCoreApiError(error: unknown) {
  if (error instanceof HrCoreConfigurationError) {
    return NextResponse.json(
      { error: "Integrasi HR Core belum dikonfigurasi.", code: "HR_CORE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  console.error("[HR_CORE_API_ERROR]", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json(
    { error: "Data struktur organisasi HR Core sedang tidak tersedia.", code: "HR_CORE_UNAVAILABLE" },
    { status: 503 },
  );
}

export function cachedHrCoreJson(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=3600" },
  });
}
