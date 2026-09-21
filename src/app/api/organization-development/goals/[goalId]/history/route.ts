import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getGoalHistory } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const { goalId } = await params;
    return NextResponse.json(await getGoalHistory(goalId));
  } catch {
    return NextResponse.json({ error: "Failed to load goal history." }, { status: 500 });
  }
}
