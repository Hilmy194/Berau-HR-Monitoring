import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import {
  getScorecardKpiSettingDashboard,
  getScorecardKpiSettingFilterOptions,
} from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(request: Request) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const [dashboard, options] = await Promise.all([
      getScorecardKpiSettingDashboard(params),
      getScorecardKpiSettingFilterOptions(),
    ]);
    return NextResponse.json({ ...dashboard, options });
  } catch {
    return NextResponse.json({ error: "Failed to load KPI library." }, { status: 500 });
  }
}
