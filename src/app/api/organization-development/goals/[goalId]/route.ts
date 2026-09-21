import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getGoalById } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const { goalId } = await params;
    const goal = await getGoalById(goalId);
    return goal ? NextResponse.json(goal) : NextResponse.json({ error: "Goal not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to load goal detail." }, { status: 500 });
  }
}
