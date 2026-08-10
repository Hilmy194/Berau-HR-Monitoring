import { NextResponse } from "next/server";
import { getGoalSyncLogs } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET() {
  try {
    return NextResponse.json(await getGoalSyncLogs());
  } catch {
    return NextResponse.json({ error: "Failed to load goal sync history." }, { status: 500 });
  }
}
