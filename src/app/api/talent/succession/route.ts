import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  addSuccessorToPipeline,
  getSuccessionPipeline,
  getSuccessionSummary,
  listAllSuccessorsDirectory,
  type AddSuccessorInput,
} from "@/lib/services/succession.service";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = getSuccessionPipeline();
  const summary = getSuccessionSummary();
  const successors = listAllSuccessorsDirectory();

  return NextResponse.json({ targets, summary, successors });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: AddSuccessorInput = await req.json();

    if (!body.targetIncumbentName || !body.successorName) {
      return NextResponse.json(
        { error: "Nama pejabat target dan nama suksesor wajib diisi." },
        { status: 400 }
      );
    }

    const updatedTarget = addSuccessorToPipeline(body);
    const summary = getSuccessionSummary();
    const successors = listAllSuccessorsDirectory();

    return NextResponse.json({
      success: true,
      message: `Suksesor ${body.successorName} berhasil ditambahkan ke ${body.targetIncumbentName}!`,
      target: updatedTarget,
      summary,
      successors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan suksesor" },
      { status: 500 }
    );
  }
}
