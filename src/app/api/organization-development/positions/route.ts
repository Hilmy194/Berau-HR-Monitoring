import { NextRequest, NextResponse } from "next/server";
import { getPositions } from "@/lib/services/organization-development.service";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await getPositions(Object.fromEntries(request.nextUrl.searchParams)));
  } catch {
    return NextResponse.json({ error: "Failed to load positions." }, { status: 500 });
  }
}
