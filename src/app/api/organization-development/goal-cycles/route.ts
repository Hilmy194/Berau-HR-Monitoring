import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getGoalCycles } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET() {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await getGoalCycles());
  } catch {
    return NextResponse.json({ error: "Failed to load goal cycles." }, { status: 500 });
  }
}
