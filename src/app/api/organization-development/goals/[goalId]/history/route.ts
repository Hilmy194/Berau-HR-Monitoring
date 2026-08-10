import { NextResponse } from "next/server";
import { getGoalHistory } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const { goalId } = await params;
    return NextResponse.json(await getGoalHistory(goalId));
  } catch {
    return NextResponse.json({ error: "Failed to load goal history." }, { status: 500 });
  }
}
