import { NextResponse } from "next/server";
import { getGoalSettingDashboard } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    return NextResponse.json((await getGoalSettingDashboard(params)).summary);
  } catch {
    return NextResponse.json({ error: "Failed to load goal summary." }, { status: 500 });
  }
}
