import { NextResponse } from "next/server";
import { listGoals } from "@/lib/services/goal-setting/goal-setting.service";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const { pagedRows, pagination } = await listGoals(params);
    return NextResponse.json({ rows: pagedRows, pagination });
  } catch {
    return NextResponse.json({ error: "Failed to load goals." }, { status: 500 });
  }
}
