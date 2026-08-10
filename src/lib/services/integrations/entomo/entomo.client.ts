import { getEntomoMockCycles, getEntomoMockGoals, getEntomoMockPatAssessments, getEntomoMockSyncLogs } from "./entomo.mock";

export class EntomoClient {
  async fetchGoals() {
    return getEntomoMockGoals();
  }

  async fetchCycles() {
    return getEntomoMockCycles();
  }

  async fetchSyncLogs() {
    return getEntomoMockSyncLogs();
  }

  async fetchPatAssessments() {
    return getEntomoMockPatAssessments();
  }

  async runManualSync() {
    return getEntomoMockSyncLogs()[0];
  }
}
