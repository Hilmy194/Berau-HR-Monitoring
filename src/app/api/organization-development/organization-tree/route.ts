import { NextResponse } from "next/server";
import { getOrganizationHierarchy } from "@/lib/services/organization-development.service";

export async function GET() {
  try {
    return NextResponse.json(await getOrganizationHierarchy());
  } catch {
    return NextResponse.json({ error: "Failed to load organization hierarchy." }, { status: 500 });
  }
}
