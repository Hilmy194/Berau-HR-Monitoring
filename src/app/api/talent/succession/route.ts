import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listEmployeeMaster } from "@/lib/services/hr-modules.service";
import { runTalentAiAnalysis } from "@/lib/services/talent-ai.service";
import {
  addSuccessorToPipeline,
  getSuccessionPipelineFromDb,
  getSuccessionSummary,
  listAllSuccessorsDirectory,
  listSuccessionHistory,
  type AddSuccessorInput,
} from "@/lib/services/succession.service";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = await getSuccessionPipelineFromDb();
  const summary = getSuccessionSummary(targets);
  const successors = listAllSuccessorsDirectory(targets);
  const history = await listSuccessionHistory();

  return NextResponse.json({ targets, summary, successors, history });
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
        { error: "Nama incumbent target dan nama suksesor wajib diisi." },
        { status: 400 }
      );
    }

    const updatedTarget = await addSuccessorToPipeline(
      body,
      session.user.name || "HR Administrator"
    );

    // Otomatis generate AI Succession IDP ketika nama masuk/diperbarui di Succession
    let aiGenerated = false;
    try {
      const employees = await listEmployeeMaster(body.successorNik?.trim() || undefined);
      const matchedEmp = employees.find(
        (e) =>
          (body.successorNik && e.employeeId === body.successorNik.trim()) ||
          e.name.toLowerCase().trim() === body.successorName.toLowerCase().trim()
      );
      const employeeId = matchedEmp?.profileId || body.successorNik?.trim();
      const targetPosition =
        ("positionTitle" in (updatedTarget ?? {}) && (updatedTarget as { positionTitle?: string }).positionTitle) ||
        body.targetPositionTitle?.trim();

      if (employeeId) {
        await runTalentAiAnalysis({
          analysisType: "SUCCESSION_IDP",
          employeeId,
          targetPosition: targetPosition || undefined,
          requestedBy: session.user.id,
        });
        aiGenerated = true;
      }
    } catch (aiErr) {
      console.warn("[SUCCESSION_AUTO_AI_IDP]", aiErr);
    }

    const targets = await getSuccessionPipelineFromDb();
    const summary = getSuccessionSummary(targets);
    const successors = listAllSuccessorsDirectory(targets);
    const history = await listSuccessionHistory();

    return NextResponse.json({
      success: true,
      aiGenerated,
      message: `Suksesor ${body.successorName} berhasil ditambahkan ke ${body.targetIncumbentName} dan tercatat di histori!`,
      target: updatedTarget,
      summary,
      successors,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan suksesor" },
      { status: 500 }
    );
  }
}
