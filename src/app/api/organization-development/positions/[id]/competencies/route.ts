import { NextRequest, NextResponse } from "next/server";
import { getPositionCompetencyRequirements } from "@/lib/services/organization-development.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getPositionCompetencyRequirements(id));
  } catch {
    return NextResponse.json({ error: "Failed to load position competencies." }, { status: 500 });
  }
}
