import { NextResponse } from "next/server";
import { getOrganizationDevelopmentSummary } from "@/lib/services/organization-development.service";

export async function GET() {
  try {
    return NextResponse.json(await getOrganizationDevelopmentSummary());
  } catch {
    return NextResponse.json({ error: "Failed to load organization development summary." }, { status: 500 });
  }
}
