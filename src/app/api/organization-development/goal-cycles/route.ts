import { NextResponse } from "next/server";
import { getGoalCycles } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET() {
  try {
    return NextResponse.json(await getGoalCycles());
  } catch {
    return NextResponse.json({ error: "Failed to load goal cycles." }, { status: 500 });
  }
}
