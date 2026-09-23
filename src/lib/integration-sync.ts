import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type IntegrationSyncState = {
  status: "idle" | "running" | "success" | "failed";
  trigger: "manual" | "scheduled" | null;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  pid: number | null;
};

const EMPTY_STATE: IntegrationSyncState = {
  status: "idle",
  trigger: null,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  pid: null,
};

export function integrationSyncStateDirectory() {
  return process.env.INTEGRATION_STATE_DIR || path.join(process.cwd(), "runtime", "integration-sync");
}

export async function readIntegrationSyncState(): Promise<IntegrationSyncState> {
  try {
    const raw = await readFile(path.join(integrationSyncStateDirectory(), "status.json"), "utf8");
    const value = JSON.parse(raw) as Partial<IntegrationSyncState>;
    if (!value.status || !["running", "success", "failed"].includes(value.status)) return EMPTY_STATE;

    const state: IntegrationSyncState = {
      status: value.status,
      trigger: value.trigger === "manual" || value.trigger === "scheduled" ? value.trigger : null,
      startedAt: typeof value.startedAt === "string" ? value.startedAt : null,
      finishedAt: typeof value.finishedAt === "string" ? value.finishedAt : null,
      exitCode: typeof value.exitCode === "number" ? value.exitCode : null,
      pid: typeof value.pid === "number" ? value.pid : null,
    };
    if (state.status === "running" && !isProcessRunning(state.pid)) {
      return { ...state, status: "failed", finishedAt: null, exitCode: null };
    }
    return state;
  } catch {
    return EMPTY_STATE;
  }
}

function isProcessRunning(pid: number | null) {
  if (!pid || process.platform !== "linux") return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getNextIntegrationSchedule(now = new Date()) {
  // Asia/Jakarta has a fixed UTC+7 offset and no daylight-saving transition.
  const jakartaNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const year = jakartaNow.getUTCFullYear();
  const month = jakartaNow.getUTCMonth();
  // Date.UTC normalizes month 12 into January of the following year.
  const candidates = [
    new Date(Date.UTC(year, month, 4, 4 - 7)),
    new Date(Date.UTC(year, month, 17, 4 - 7)),
    new Date(Date.UTC(year, month + 1, 4, 4 - 7)),
  ];
  const nextRun = candidates.find((candidate) => candidate.getTime() > now.getTime()) ?? candidates[2];
  const todayStart = Date.UTC(year, month, jakartaNow.getUTCDate());
  const nextJakarta = new Date(nextRun.getTime() + 7 * 60 * 60 * 1000);
  const nextDayStart = Date.UTC(nextJakarta.getUTCFullYear(), nextJakarta.getUTCMonth(), nextJakarta.getUTCDate());
  const daysRemaining = Math.max(0, Math.round((nextDayStart - todayStart) / 86_400_000));
  return { nextRunAt: nextRun.toISOString(), daysRemaining };
}
