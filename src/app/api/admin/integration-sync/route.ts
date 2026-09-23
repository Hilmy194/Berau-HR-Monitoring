import { spawn } from "node:child_process";
import { access, constants } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/api-guard";
import { getNextIntegrationSchedule, readIntegrationSyncState } from "@/lib/integration-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  return NextResponse.json({
    ...(await readIntegrationSyncState()),
    schedule: getNextIntegrationSchedule(),
  });
}

export async function POST() {
  const guard = await assertAdmin();
  if (guard.error) return guard.error;

  const current = await readIntegrationSyncState();
  if (current.status === "running") {
    return NextResponse.json({ error: "Sinkronisasi sedang berjalan." }, { status: 409 });
  }
  if (process.platform !== "linux") {
    return NextResponse.json(
      { error: "Sync manual dari aplikasi hanya tersedia pada server Linux VM." },
      { status: 503 },
    );
  }

  const runner = path.join(process.cwd(), "scripts", "run-vm-integrations-managed.sh");
  try {
    await access(runner, constants.R_OK);
    const child = spawn("/usr/bin/bash", [runner, "manual"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
  } catch (error) {
    console.error("Unable to start manual integration sync.", error);
    return NextResponse.json({ error: "Gagal memulai sinkronisasi." }, { status: 500 });
  }

  return NextResponse.json({ message: "Sinkronisasi dimulai." }, { status: 202 });
}

