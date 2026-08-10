import { NextResponse } from "next/server";
import { syncGoalsFromEntomo } from "@/lib/services/goal-setting/goal-setting.service";

export async function POST() {
  try {
    return NextResponse.json(await syncGoalsFromEntomo());
  } catch {
    return NextResponse.json({ error: "Failed to sync goals from Entomo." }, { status: 500 });
  }
}
