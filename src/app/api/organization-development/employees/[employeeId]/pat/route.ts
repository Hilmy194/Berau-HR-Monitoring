import { NextResponse } from "next/server";
import { assertGoalSettingAccess } from "@/lib/api-guard";
import { getPatAssessmentByEmployee } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(_request: Request, { params }: { params: Promise<{ employeeId: string }> }) {
  const guard = await assertGoalSettingAccess();
  if (guard.error) return guard.error;

  try {
    const { employeeId } = await params;
    const pat = await getPatAssessmentByEmployee(employeeId);
    return pat ? NextResponse.json(pat) : NextResponse.json({ error: "PAT assessment not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to load PAT assessment." }, { status: 500 });
  }
}
