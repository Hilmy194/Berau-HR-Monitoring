import { NextRequest, NextResponse } from "next/server";
import { getCompetencyById } from "@/lib/services/organization-development.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const competency = await getCompetencyById(id);
    if (!competency) return NextResponse.json({ error: "Competency not found." }, { status: 404 });
    return NextResponse.json(competency);
  } catch {
    return NextResponse.json({ error: "Failed to load competency." }, { status: 500 });
  }
}
