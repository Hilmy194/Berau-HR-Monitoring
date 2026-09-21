import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { syncGoalsFromEntomo } from "@/lib/services/goal-setting/goal-setting.service";

export async function POST() {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await syncGoalsFromEntomo());
  } catch {
    return NextResponse.json({ error: "Failed to sync goals from Entomo." }, { status: 500 });
  }
}
