import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getPatGoalSettingExportRows, patToCsv } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(request: Request) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const filters = Object.fromEntries(new URL(request.url).searchParams.entries());
    const rows = await getPatGoalSettingExportRows(filters);
    const year = Number(filters.year ?? 2026) || 2026;
    return new NextResponse(`\uFEFF${patToCsv(rows)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="goal-setting-${year}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export PAT goal setting data." }, { status: 500 });
  }
}
