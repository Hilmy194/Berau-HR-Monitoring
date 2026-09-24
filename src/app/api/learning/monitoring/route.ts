import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { WORKSPACE } from "@/lib/workspaces";
import {
  LEARNING_ACTIVITY_TYPES,
  LEARNING_MONITORING_STATUSES,
  LearningMonitoringConflictError,
  saveLearningMonitoring,
} from "@/lib/services/learning-monitoring.service";

const payloadSchema = z.object({
  employeePersonnelNumber: z.string().trim().min(1).max(40),
  activityKey: z.string().trim().min(1).max(100),
  activityType: z.enum(LEARNING_ACTIVITY_TYPES),
  targetPosition: z.string().trim().max(180).nullish(),
  skillImprovement: z.string().trim().min(2).max(300),
  programName: z.string().trim().min(2).max(500),
  provider: z.string().trim().min(2).max(240),
  timeline: z.string().trim().min(1).max(120),
  status: z.enum(LEARNING_MONITORING_STATUSES),
  successCriteria: z.string().trim().min(2).max(1000),
  notes: z.string().trim().max(2000).nullish(),
  version: z.number().int().min(0),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canAccessWorkspace(session.user.id, session.user.role, WORKSPACE.LEARNING, "EDITOR")) {
    return NextResponse.json({ error: "Akses editor Learning diperlukan." }, { status: 403 });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data monitoring tidak valid." }, { status: 400 });
  }

  try {
    const monitoring = await saveLearningMonitoring(session.user.id, parsed.data);
    return NextResponse.json({ monitoring });
  } catch (error) {
    if (error instanceof LearningMonitoringConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[LEARNING_MONITORING_SAVE]", error);
    return NextResponse.json({ error: "Gagal menyimpan monitoring Learning." }, { status: 500 });
  }
}
