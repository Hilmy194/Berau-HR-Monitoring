import { NextResponse } from "next/server";
import { getGoalById } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    const goal = await getGoalById(goalId);
    return goal ? NextResponse.json(goal) : NextResponse.json({ error: "Goal not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to load goal detail." }, { status: 500 });
  }
}
