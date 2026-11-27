import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listTrainingCatalog } from "@/lib/services/training-catalog.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stemType = searchParams.get("stemType") || undefined;
  const skill = searchParams.get("skill") || undefined;
  const trainingType = searchParams.get("trainingType") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const catalog = await listTrainingCatalog({ stemType, skill, trainingType, search });
    return NextResponse.json({ catalog });
  } catch (err: any) {
    console.error("[TRAINING_CATALOG_GET]", err);
    return NextResponse.json({ error: "Gagal mengambil katalog training" }, { status: 500 });
  }
}
