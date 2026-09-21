import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getGoalEmployeeDetail } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ employeeId: string }> }) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const { employeeId } = await params;
    const detail = await getGoalEmployeeDetail(employeeId);
    return detail ? NextResponse.json(detail) : NextResponse.json({ error: "Employee goals not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to load employee goals." }, { status: 500 });
  }
}
