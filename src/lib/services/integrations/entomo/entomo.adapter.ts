import { EntomoClient } from "./entomo.client";
import { mapEntomoCycle, mapEntomoGoal, mapEntomoPatAssessment, mapEntomoSyncLog } from "./entomo.mapper";

const client = new EntomoClient();

export async function fetchGoalSettingFromEntomo() {
  const [goals, cycles, syncLogs] = await Promise.all([
    client.fetchGoals(),
    client.fetchCycles(),
    client.fetchSyncLogs(),
  ]);
  const patAssessments = await client.fetchPatAssessments();

  return {
    goals: goals.map(mapEntomoGoal),
    cycles: cycles.map(mapEntomoCycle),
    syncLogs: syncLogs.map(mapEntomoSyncLog),
    patAssessments: patAssessments.map(mapEntomoPatAssessment),
  };
}

export async function simulateEntomoSync() {
  return mapEntomoSyncLog(await client.runManualSync());
}
