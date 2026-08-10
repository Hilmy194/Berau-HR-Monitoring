import type { EmployeeGoal, GoalCycle, GoalProgressHistory, GoalStatus, GoalSyncLog, PatSection, SilPatAssessment } from "@/lib/services/goal-setting/goal-setting.types";

const cycles: GoalCycle[] = [
  { id: "cycle-annual-2026", externalId: "ENT-CYCLE-2026", cycleName: "Annual 2026", startDate: d("2026-01-01"), endDate: d("2026-12-31"), status: "Active", source: "Entomo", lastSync: d("2026-08-03T08:15:00") },
  { id: "cycle-s1-2026", externalId: "ENT-CYCLE-S1-2026", cycleName: "Semester 1 2026", startDate: d("2026-01-01"), endDate: d("2026-06-30"), status: "Closed", source: "Entomo", lastSync: d("2026-07-03T08:15:00") },
  { id: "cycle-s2-2026", externalId: "ENT-CYCLE-S2-2026", cycleName: "Semester 2 2026", startDate: d("2026-07-01"), endDate: d("2026-12-31"), status: "Active", source: "Entomo", lastSync: d("2026-08-03T08:15:00") },
  { id: "cycle-q3-2026", externalId: "ENT-CYCLE-Q3-2026", cycleName: "Quarter 3 2026", startDate: d("2026-07-01"), endDate: d("2026-09-30"), status: "Active", source: "Entomo", lastSync: d("2026-08-03T08:15:00") },
];

const employees = [
  ["EMP-26001", "Ardi Pratama", "Mining Operations Superintendent", "Operations", "Mining", "Mining Operation", "Rina Wirawan", "Berau Site"],
  ["EMP-26002", "Maya Lestari", "Pit Control Supervisor", "Operations", "Mining", "Mining Operation", "Ardi Pratama", "Berau Site"],
  ["EMP-26003", "Bima Saputra", "Plant Maintenance Engineer", "Operations", "Maintenance", "Plant Maintenance", "Dimas Rahardjo", "Workshop"],
  ["EMP-26004", "Nadia Kirana", "Reliability Analyst", "Operations", "Maintenance", "Plant Maintenance", "Dimas Rahardjo", "Workshop"],
  ["EMP-26005", "Farhan Akbar", "Hauling Foreman", "Operations", "Mining", "Mining Operation", "Maya Lestari", "Berau Site"],
  ["EMP-26006", "Sari Wulandari", "HR Business Partner", "Human Resources", "HR Operations", "Human Capital Development", "Dewi Anggraeni", "Head Office"],
  ["EMP-26007", "Dewi Anggraeni", "Human Capital Development Manager", "Human Resources", "HR Development", "Human Capital Development", "Hendra Gunawan", "Head Office"],
  ["EMP-26008", "Yoga Mahendra", "Recruitment Specialist", "Human Resources", "Talent Acquisition", "Recruitment", "Sari Wulandari", "Head Office"],
  ["EMP-26009", "Raka Firmansyah", "Organization Development Analyst", "Human Resources", "HR Development", "Human Capital Development", "Dewi Anggraeni", "Head Office"],
  ["EMP-26010", "Lina Kartika", "Payroll Officer", "Human Resources", "HR Operations", "Human Capital Development", "Sari Wulandari", "Head Office"],
  ["EMP-26011", "Teguh Santoso", "Finance Planning Manager", "Finance", "Planning", "Finance Planning", "Mira Handayani", "Head Office"],
  ["EMP-26012", "Mira Handayani", "Budget Control Superintendent", "Finance", "Planning", "Finance Planning", "Teguh Santoso", "Head Office"],
  ["EMP-26013", "Andre Wijaya", "Cost Analyst", "Finance", "Planning", "Finance Planning", "Mira Handayani", "Head Office"],
  ["EMP-26014", "Putri Ayu", "Treasury Officer", "Finance", "Treasury", "Finance Planning", "Teguh Santoso", "Head Office"],
  ["EMP-26015", "Hendra Gunawan", "Procurement Manager", "Supply Chain", "Procurement", "Procurement", "Rizal Maulana", "Head Office"],
  ["EMP-26016", "Rizal Maulana", "Contract Specialist", "Supply Chain", "Procurement", "Procurement", "Hendra Gunawan", "Head Office"],
  ["EMP-26017", "Citra Permata", "Warehouse Supervisor", "Supply Chain", "Logistics", "Procurement", "Hendra Gunawan", "Warehouse"],
  ["EMP-26018", "Bagus Nugroho", "Vendor Management Analyst", "Supply Chain", "Procurement", "Procurement", "Rizal Maulana", "Head Office"],
  ["EMP-26019", "Ayu Maharani", "Safety Superintendent", "HSE", "Safety", "Safety", "Yusuf Hakim", "Berau Site"],
  ["EMP-26020", "Yusuf Hakim", "HSE Manager", "HSE", "Safety", "Safety", "Hendra Gunawan", "Berau Site"],
  ["EMP-26021", "Fajar Ramadhan", "Environment Engineer", "HSE", "Environment", "Environment", "Ayu Maharani", "Berau Site"],
  ["EMP-26022", "Intan Puspita", "Safety Officer", "HSE", "Safety", "Safety", "Ayu Maharani", "Berau Site"],
  ["EMP-26023", "Dimas Rahardjo", "Maintenance Manager", "Operations", "Maintenance", "Plant Maintenance", "Ardi Pratama", "Workshop"],
  ["EMP-26024", "Rini Oktaviani", "Mine Planning Engineer", "Operations", "Mining", "Mining Operation", "Ardi Pratama", "Berau Site"],
  ["EMP-26025", "Galih Prakoso", "CSR Environment Liaison", "HSE", "Environment", "Environment", "Fajar Ramadhan", "Berau Site"],
] as const;

const templates = [
  ["Improve production plan accuracy", "Operational Excellence", "%", 100, "High"],
  ["Reduce equipment downtime", "Asset Reliability", "%", 100, "Critical"],
  ["Complete workforce capability map", "People Development", "%", 100, "High"],
  ["Improve budget forecast accuracy", "Financial Discipline", "%", 100, "High"],
  ["Improve supplier delivery performance", "Supply Chain Excellence", "%", 100, "Medium"],
  ["Increase safety observation closure", "Safety", "%", 100, "Critical"],
] as const;

const statusPattern: GoalStatus[] = ["Completed", "On Track", "In Progress", "At Risk", "Overdue", "Not Started"];

export function getEntomoMockCycles() {
  return cycles;
}

export function getEntomoMockGoals(): EmployeeGoal[] {
  return employees.flatMap((employee, employeeIndex) => {
    const goalCount = 3 + (employeeIndex % 4);
    return Array.from({ length: goalCount }, (_, goalIndex) => {
      const template = templates[(employeeIndex + goalIndex) % templates.length];
      const status = statusPattern[(employeeIndex + goalIndex) % statusPattern.length];
      const achievement = achievementFor(status, employeeIndex, goalIndex);
      const targetValue = template[3];
      const actualValue = Math.round((targetValue * achievement) / 100);
      const start = d(`2026-${String(1 + (goalIndex % 3) * 2).padStart(2, "0")}-01`);
      const due = d(`2026-${String(8 + (goalIndex % 5)).padStart(2, "0")}-${goalIndex % 2 ? "15" : "30"}`);
      const id = `${employee[0].toLowerCase()}-goal-${goalIndex + 1}`;
      const hasRelevant = (employeeIndex + goalIndex) % 5 !== 0;
      const hasTimeBound = status !== "Not Started" || goalIndex % 2 === 0;

      return {
        id,
        externalId: `ENT-${employee[0]}-${goalIndex + 1}`,
        employeeId: employee[0],
        employeeName: employee[1],
        position: employee[2],
        directorate: `Directorate ${employee[3]}`,
        division: employee[4],
        department: employee[5],
        managerId: `MGR-${employee[6].replace(/\s/g, "").toUpperCase()}`,
        managerName: employee[6],
        workLocation: employee[7],
        cycleId: "cycle-annual-2026",
        goalCycle: "Annual 2026",
        title: template[0],
        description: `${template[0]} for ${employee[5]} with measurable monthly review from Entomo.`,
        expectedOutcome: status === "Not Started" ? undefined : `Improved ${template[1].toLowerCase()} performance.`,
        category: template[1],
        organizationObjective: hasRelevant ? "Improve sustainable mining performance" : undefined,
        departmentObjective: hasRelevant ? `Improve ${employee[5]} KPI delivery` : undefined,
        baselineValue: status === "Not Started" ? undefined : Math.max(0, actualValue - 12),
        supportingInformation: status === "Not Started" ? undefined : "Validated through monthly Entomo checkpoint.",
        targetValue,
        actualValue,
        unit: template[2],
        achievement,
        weight: 10 + ((employeeIndex + goalIndex) % 4) * 5,
        priority: template[4],
        status,
        startDate: start,
        dueDate: hasTimeBound ? due : d("2026-12-31"),
        completionDate: status === "Completed" ? d("2026-07-20") : undefined,
        smart: hasTimeBound ? undefined : { timeBound: false },
        source: "Entomo",
        sourceUpdatedAt: d(`2026-07-${String(10 + (employeeIndex % 16)).padStart(2, "0")}T10:00:00`),
        lastSyncedAt: d("2026-08-03T08:15:00"),
        entomoUrl: `https://entomo.example.com/goals/${id}`,
        history: historyFor(id, achievement, employee[6]),
      } satisfies EmployeeGoal;
    });
  });
}

export function getEntomoMockPatAssessments(): SilPatAssessment[] {
  return employees.map((employee, index) => {
    const score = 72 + (index % 7) * 4;
    return {
      id: `${employee[0].toLowerCase()}-pat-2026`,
      externalId: `SIL-PAT-${employee[0]}-2026`,
      employeeId: employee[0],
      employeeName: employee[1],
      year: 2026,
      patName: "PAT Tahunan 2026",
      cycleName: "Annual 2026",
      status: index % 5 === 0 ? "In Progress" : index % 4 === 0 ? "Reviewed" : "Complete",
      finalScore: Math.min(100, score),
      performanceRating: score >= 92 ? "Exceeds Expectation" : score >= 84 ? "Strong Performer" : score >= 76 ? "Meets Expectation" : "Need Improvement",
      dynamicSections: patSectionsFor(employee, index, score),
      feedback360: {
        strengths: [
          index % 2 === 0 ? "Konsisten menjaga kualitas deliverable" : "Cepat beradaptasi dengan kebutuhan operasional",
          index % 3 === 0 ? "Kolaborasi lintas fungsi kuat" : "Komunikasi progress cukup jelas",
        ],
        weaknesses: [
          index % 2 === 0 ? "Perlu memperkuat dokumentasi analisis" : "Perlu lebih proaktif eskalasi risiko",
          index % 4 === 0 ? "Follow up action item perlu lebih disiplin" : "Pengaruh ke stakeholder senior masih bisa ditingkatkan",
        ],
        comments: [
          { reviewerGroup: "Manager", comment: "Kontribusi terhadap target tahunan terlihat baik, dengan beberapa area follow up yang perlu dipercepat.", submittedAt: d("2026-07-25T09:00:00") },
          { reviewerGroup: "Peer", comment: "Mudah diajak koordinasi dan responsif ketika ada issue lintas tim.", submittedAt: d("2026-07-26T14:30:00") },
          { reviewerGroup: "Subordinate", comment: "Arahan kerja jelas, namun monitoring action plan bisa dibuat lebih rutin.", submittedAt: d("2026-07-27T10:15:00") },
        ],
      },
      sourceSystem: "SIL/PAT",
      sourceUpdatedAt: d("2026-07-31T16:00:00"),
      lastSyncedAt: d("2026-08-03T08:15:00"),
    };
  });
}

export function getEntomoMockSyncLogs(): GoalSyncLog[] {
  return [
    { id: "sync-20260803", sourceSystem: "Entomo", syncType: "Manual", syncStartedAt: d("2026-08-03T08:14:12"), syncFinishedAt: d("2026-08-03T08:15:00"), status: "Success", recordsReceived: 112, recordsInserted: 0, recordsUpdated: 112, recordsFailed: 0, durationMs: 48000 },
    { id: "sync-20260802", sourceSystem: "Entomo", syncType: "Scheduled", syncStartedAt: d("2026-08-02T02:00:00"), syncFinishedAt: d("2026-08-02T02:00:41"), status: "Success", recordsReceived: 112, recordsInserted: 4, recordsUpdated: 108, recordsFailed: 0, durationMs: 41000 },
    { id: "sync-20260801", sourceSystem: "Entomo", syncType: "Scheduled", syncStartedAt: d("2026-08-01T02:00:00"), syncFinishedAt: d("2026-08-01T02:00:58"), status: "Partial Success", recordsReceived: 112, recordsInserted: 0, recordsUpdated: 109, recordsFailed: 3, errorMessage: "3 records skipped due to missing employee code.", durationMs: 58000 },
  ];
}

function achievementFor(status: GoalStatus, employeeIndex: number, goalIndex: number) {
  if (status === "Completed") return 100 + ((employeeIndex + goalIndex) % 3) * 4;
  if (status === "On Track") return 76 + ((employeeIndex + goalIndex) % 12);
  if (status === "In Progress") return 35 + ((employeeIndex + goalIndex) % 28);
  if (status === "At Risk") return 45 + ((employeeIndex + goalIndex) % 18);
  if (status === "Overdue") return 20 + ((employeeIndex + goalIndex) % 35);
  return 0;
}

function historyFor(goalId: string, achievement: number, manager: string): GoalProgressHistory[] {
  const mid = Math.max(0, Math.round(achievement * 0.55));
  return [
    { id: `${goalId}-h1`, goalId, progressDate: d("2026-01-10"), previousActualValue: 0, updatedActualValue: 0, previousAchievement: 0, updatedAchievement: 0, progressDescription: "Goal synchronized from Entomo.", updatedBy: manager, source: "Entomo", syncDate: d("2026-08-03T08:15:00") },
    { id: `${goalId}-h2`, goalId, progressDate: d("2026-03-15"), previousActualValue: 0, updatedActualValue: mid, previousAchievement: 0, updatedAchievement: mid, progressDescription: `Progress updated from 0% to ${mid}%.`, updatedBy: manager, source: "Entomo", syncDate: d("2026-08-03T08:15:00") },
    { id: `${goalId}-h3`, goalId, progressDate: d("2026-06-20"), previousActualValue: mid, updatedActualValue: achievement, previousAchievement: mid, updatedAchievement: achievement, progressDescription: `Progress updated from ${mid}% to ${achievement}%.`, updatedBy: manager, source: "Entomo", syncDate: d("2026-08-03T08:15:00") },
  ];
}

function patSectionsFor(employee: typeof employees[number], index: number, score: number): PatSection[] {
  return [
    {
      id: "scorecard-kpi-setting",
      title: "Scorecard KPI Setting",
      description: "Contoh isi goal setting mengikuti template scorecard KPI.",
      fields: [
        {
          key: "kpi_a",
          label: "KPI A",
          value: 60 + (index % 5) * 8,
          unit: "%",
          score: Math.min(100, score + 2),
          weight: 5,
          strategyPillarName: "Finance",
          reviewPeriod: "Monthly",
          levels: { l1: "60", l2: "70", l3: "80", l4: "90", l5: "100" },
          remark: "Goal Description: xxx",
        },
        {
          key: "kpi_b",
          label: "KPI B",
          value: Math.max(1, 5 - (index % 5)),
          unit: " Days",
          score: Math.min(100, score),
          weight: 10,
          strategyPillarName: "Customer",
          reviewPeriod: "Quarterly",
          levels: { l1: "5", l2: "4", l3: "3", l4: "2", l5: "1" },
          remark: "Goal Description: xxx",
        },
        {
          key: "kpi_c",
          label: "KPI C",
          value: 5 - (index % 5),
          unit: " Hours",
          score: Math.max(60, score - 1),
          weight: 15,
          strategyPillarName: "Learning & Growth",
          reviewPeriod: "Half Yearly",
          levels: { l1: "5", l2: "4", l3: "3", l4: "2", l5: "1" },
          remark: "Goal Description: xxx",
        },
        {
          key: "kpi_d",
          label: "KPI D",
          value: 3000 + (index % 6) * 420,
          unit: " IDR Bn",
          score: Math.min(100, score + 4),
          weight: 20,
          strategyPillarName: "Internal Business Process",
          reviewPeriod: "Once",
          levels: { l1: "3000", l2: "3500", l3: "4000", l4: "4900", l5: "5100" },
          remark: "Goal Description: xxx",
        },
      ],
    },
    {
      id: "behavior",
      title: "Behavior & Leadership",
      description: "Komponen perilaku dapat berubah mengikuti template PAT tahunan.",
      fields: [
        { key: "collaboration", label: "Collaboration", value: score >= 84 ? "Strong" : "Developing", score: Math.min(100, score + 2), weight: 15 },
        { key: "accountability", label: "Accountability", value: score >= 80 ? "Consistent" : "Needs Follow Up", score, weight: 15 },
        { key: "continuous_improvement", label: "Continuous Improvement", value: score >= 88 ? "Role Model" : "Meets", score: Math.min(100, score + 1), weight: 10 },
      ],
    },
  ];
}

function d(value: string) {
  return new Date(value);
}
