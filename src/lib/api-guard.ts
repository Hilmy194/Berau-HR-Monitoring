import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE, canAccessBackoffice, isAdmin } from "@/lib/roles";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";

export async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if (!isAdmin(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden - admin access required" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function assertBackoffice() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if (!canAccessBackoffice(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden - backoffice access required" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function assertOnboardingAccess() {
  const guard = await assertBackoffice();
  if (guard.error) return guard;

  const allowed = await canAccessWorkspace(guard.session.user.id, guard.session.user.role, WORKSPACE.ONBOARDING, "EDITOR");
  if (!allowed) {
    return {
      error: NextResponse.json({ error: "Forbidden - onboarding access required" }, { status: 403 }),
      session: null,
    };
  }
  return guard;
}

export async function assertGoalSettingAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if (session.user.role !== ROLE.SUPER_ADMIN) {
    return {
      error: NextResponse.json({ error: "Forbidden - super admin access required" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}
