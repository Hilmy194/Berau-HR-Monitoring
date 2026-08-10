import { NextRequest, NextResponse } from "next/server";
import { getPositionById } from "@/lib/services/organization-development.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const position = await getPositionById(id);
    if (!position) return NextResponse.json({ error: "Position not found." }, { status: 404 });
    return NextResponse.json(position);
  } catch {
    return NextResponse.json({ error: "Failed to load position." }, { status: 500 });
  }
}
