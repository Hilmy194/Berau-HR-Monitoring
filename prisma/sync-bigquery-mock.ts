import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

type SourceEmployee = {
  employeeNumber: string;
  fullName: string;
  email: string;
  positionCode: string;
  departmentCode: string;
  supervisorNumber: string | null;
  status: string;
  type: string;
  birthDate: string;
  joinDate: string;
  retirementDate: string;
  location: string;
  movement: string;
  classification: string;
  matrix: string;
  readiness: string;
  education: string;
  project: string;
  assessmentComplete: boolean;
};

type SourceData = {
  sourceName: "BIGQUERY";
  sourceUpdatedAt: string;
  organization: {
    directorates: Array<{ code: string; name: string }>;
    divisions: Array<{ code: string; name: string; directorateCode: string }>;
    departments: Array<{ code: string; name: string; divisionCode: string }>;
    positions: Array<{ code: string; name: string; departmentCode: string; jobLevel: string; managerial: boolean }>;
  };
  employees: SourceEmployee[];
};

type IdRow = { id: string };

const skillCategories = [
  ["TECHNICAL", "Technical"],
  ["BEHAVIORAL", "Behavioral"],
  ["LEADERSHIP", "Leadership"],
  ["DIGITAL", "Digital"],
  ["HSE", "HSE"],
  ["BUSINESS", "Business"],
] as const;

const skills = [
  ["MINE-PLAN", "Mine Planning", "TECHNICAL"],
  ["PIT-OPT", "Pit Optimization", "TECHNICAL"],
  ["PROD-CONTROL", "Production Control", "TECHNICAL"],
  ["MAINT-RELIABILITY", "Maintenance Reliability", "TECHNICAL"],
  ["HSE-RISK", "HSE Risk Management", "HSE"],
  ["FATAL-CTRL", "Fatal Risk Control", "HSE"],
  ["DATA-ANALYTICS", "Data Analytics", "DIGITAL"],
  ["DASHBOARDING", "Dashboarding", "DIGITAL"],
  ["COACHING", "Coaching", "LEADERSHIP"],
  ["STAKEHOLDER", "Stakeholder Management", "BEHAVIORAL"],
  ["WORKFORCE", "Workforce Planning", "BUSINESS"],
  ["CHANGE-MGMT", "Change Management", "LEADERSHIP"],
] as const;

const positionRequirements: Record<string, string[]> = {
  "MPL-SR-ENG": ["MINE-PLAN", "PIT-OPT", "DATA-ANALYTICS", "STAKEHOLDER", "HSE-RISK"],
  "MPL-SPT": ["MINE-PLAN", "PIT-OPT", "COACHING", "STAKEHOLDER", "WORKFORCE", "HSE-RISK"],
  "MNT-SUP": ["MAINT-RELIABILITY", "COACHING", "STAKEHOLDER", "DATA-ANALYTICS", "HSE-RISK"],
  "PRD-SUP": ["PROD-CONTROL", "COACHING", "STAKEHOLDER", "FATAL-CTRL", "CHANGE-MGMT"],
  "HSE-SUP": ["HSE-RISK", "FATAL-CTRL", "COACHING", "STAKEHOLDER", "DASHBOARDING"],
  "DTA-SPL": ["DATA-ANALYTICS", "DASHBOARDING", "STAKEHOLDER", "CHANGE-MGMT", "MINE-PLAN"],
  "HRB-PAR": ["WORKFORCE", "COACHING", "STAKEHOLDER", "CHANGE-MGMT", "DATA-ANALYTICS"],
};

async function upsertSyncRun(source: string, entity: string, rowsRead: number) {
  const [run] = await prisma.$queryRaw<IdRow[]>`
    INSERT INTO integration_sync_runs (source_name, entity_name, sync_type, started_at, status, rows_read)
    VALUES (${source}, ${entity}, 'MOCK', now(), 'RUNNING', ${rowsRead})
    RETURNING id
  `;
  return run.id;
}

async function finishSyncRun(id: string, status: string, inserted: number, updated: number, failed = 0, error?: string) {
  await prisma.$executeRaw`
    UPDATE integration_sync_runs
    SET completed_at = now(), status = ${status}, rows_inserted = ${inserted},
        rows_updated = ${updated}, rows_failed = ${failed}, error_summary = ${error ?? null}
    WHERE id = ${id}::uuid
  `;
}

async function scalarId(query: Promise<IdRow[]>) {
  const rows = await query;
  return rows[0].id;
}

async function upsertOrganization(data: SourceData) {
  const directorateIds = new Map<string, string>();
  for (const item of data.organization.directorates) {
    const id = await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO organization_directorates (code, name, description)
      VALUES (${item.code}, ${item.name}, 'Mock BigQuery organization')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `);
    directorateIds.set(item.code, id);
  }

  const divisionIds = new Map<string, string>();
  for (const item of data.organization.divisions) {
    const id = await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO organization_divisions (directorate_id, code, name, description)
      VALUES (${directorateIds.get(item.directorateCode)}::uuid, ${item.code}, ${item.name}, 'Mock BigQuery division')
      ON CONFLICT (code) DO UPDATE SET directorate_id = EXCLUDED.directorate_id, name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `);
    divisionIds.set(item.code, id);
  }

  const departmentIds = new Map<string, string>();
  for (const item of data.organization.departments) {
    const id = await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO organization_departments (division_id, code, name, description)
      VALUES (${divisionIds.get(item.divisionCode)}::uuid, ${item.code}, ${item.name}, 'Mock BigQuery department')
      ON CONFLICT (code) DO UPDATE SET division_id = EXCLUDED.division_id, name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `);
    departmentIds.set(item.code, id);
  }

  const positionIds = new Map<string, string>();
  for (const item of data.organization.positions) {
    const id = await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO organization_positions
        (department_id, position_code, position_name, job_level, position_summary, job_description, is_managerial)
      VALUES
        (${departmentIds.get(item.departmentCode)}::uuid, ${item.code}, ${item.name}, ${item.jobLevel},
         ${`${item.name} role in mining HR monitoring mock data.`},
         ${`Responsible for ${item.name.toLowerCase()} outcomes, governance, and operational reporting.`},
         ${item.managerial})
      ON CONFLICT (position_code) DO UPDATE SET
        department_id = EXCLUDED.department_id, position_name = EXCLUDED.position_name,
        job_level = EXCLUDED.job_level, is_managerial = EXCLUDED.is_managerial, updated_at = now()
      RETURNING id
    `);
    positionIds.set(item.code, id);
  }

  return { departmentIds, positionIds };
}

async function upsertSkills(positionIds: Map<string, string>) {
  const categoryIds = new Map<string, string>();
  for (const [code, name] of skillCategories) {
    categoryIds.set(code, await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO talent_skill_categories (code, name, description)
      VALUES (${code}, ${name}, ${`${name} skill category`})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `));
  }

  const skillIds = new Map<string, string>();
  for (const [code, name, category] of skills) {
    skillIds.set(code, await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO talent_skills (category_id, skill_code, skill_name, description)
      VALUES (${categoryIds.get(category)}::uuid, ${code}, ${name}, ${`${name} capability for mining context`})
      ON CONFLICT (skill_code) DO UPDATE SET category_id = EXCLUDED.category_id, skill_name = EXCLUDED.skill_name, updated_at = now()
      RETURNING id
    `));
  }

  const definitions = [
    "Memahami dasar.",
    "Mampu bekerja dengan supervisi.",
    "Mampu bekerja mandiri.",
    "Mampu membimbing atau menjadi rujukan.",
    "Mampu menentukan strategi atau standar.",
  ];
  for (let level = 1; level <= 5; level += 1) {
    const exists = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM talent_skill_level_definitions WHERE skill_id IS NULL AND level = ${level}
    `;
    if (Number(exists[0].count) === 0) {
      await prisma.$executeRaw`
        INSERT INTO talent_skill_level_definitions (level, level_name, definition, evidence_requirement)
        VALUES (${level}, ${`Level ${level}`}, ${definitions[level - 1]}, 'Assessment, training, project, or supervisor review')
      `;
    }
  }

  for (const [positionCode, requiredSkills] of Object.entries(positionRequirements)) {
    const positionId = positionIds.get(positionCode);
    if (!positionId) continue;
    for (let index = 0; index < requiredSkills.length; index += 1) {
      const skillId = skillIds.get(requiredSkills[index]);
      await prisma.$executeRaw`
        INSERT INTO talent_position_skill_requirements
          (position_id, skill_id, required_level, weight, is_mandatory, evidence_notes, effective_from)
        VALUES (${positionId}::uuid, ${skillId}::uuid, ${index < 2 ? 4 : 3}, ${index < 2 ? 1.5 : 1}, ${index < 4}, 'Mock requirement from BigQuery skill matrix', '2026-01-01')
        ON CONFLICT (position_id, skill_id, effective_from) DO UPDATE SET
          required_level = EXCLUDED.required_level, weight = EXCLUDED.weight,
          is_mandatory = EXCLUDED.is_mandatory, updated_at = now()
      `;
    }
  }

  return skillIds;
}

async function upsertEmployee(employee: SourceEmployee, positionIds: Map<string, string>, departmentIds: Map<string, string>, sourceUpdatedAt: string) {
  const positionId = positionIds.get(employee.positionCode);
  const departmentId = departmentIds.get(employee.departmentCode);
  return scalarId(prisma.$queryRaw<IdRow[]>`
    INSERT INTO employee_profiles
      (employee_number, full_name, corporate_email, employment_status, employment_type, birth_date, join_date,
       retirement_date, current_position_id, current_department_id, work_location, source_system, source_updated_at, last_synced_at)
    VALUES
      (${employee.employeeNumber}, ${employee.fullName}, ${employee.email}, ${employee.status}, ${employee.type},
       ${employee.birthDate}::date, ${employee.joinDate}::date, ${employee.retirementDate}::date,
       ${positionId}::uuid, ${departmentId}::uuid, ${employee.location}, 'BIGQUERY', ${sourceUpdatedAt}::timestamptz, now())
    ON CONFLICT (employee_number) DO UPDATE SET
      full_name = EXCLUDED.full_name, corporate_email = EXCLUDED.corporate_email,
      employment_status = EXCLUDED.employment_status, employment_type = EXCLUDED.employment_type,
      current_position_id = EXCLUDED.current_position_id, current_department_id = EXCLUDED.current_department_id,
      source_updated_at = EXCLUDED.source_updated_at, last_synced_at = now(), updated_at = now()
    RETURNING id
  `);
}

async function insertIfMissing(table: string, whereSql: string, insertSql: string) {
  const existing = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM ${table} WHERE ${whereSql}`);
  if (Number(existing[0].count) === 0) {
    await prisma.$executeRawUnsafe(insertSql);
  }
}

async function seedEmployeeDetails(employee: SourceEmployee, employeeId: string, positionId: string, departmentId: string, skillIds: Map<string, string>) {
  const esc = (value: string | null | undefined) => (value == null ? "NULL" : `'${value.replace(/'/g, "''")}'`);
  await insertIfMissing(
    "employee_career_histories",
    `employee_id = '${employeeId}'::uuid AND position_id = '${positionId}'::uuid AND start_date = '${employee.joinDate}'::date AND movement_type = '${employee.movement}'`,
    `INSERT INTO employee_career_histories (employee_id, position_id, department_id, movement_type, start_date, role_summary, achievement_summary, source_system, source_updated_at)
     VALUES ('${employeeId}'::uuid, '${positionId}'::uuid, '${departmentId}'::uuid, ${esc(employee.movement)}, '${employee.joinDate}'::date, ${esc(`Assignment as ${employee.positionCode}`)}, ${esc(employee.project)}, 'BIGQUERY', now())`
  );
  await insertIfMissing(
    "employee_educations",
    `employee_id = '${employeeId}'::uuid AND institution_name = 'Mock Mining Institute' AND major = ${esc(employee.education)}`,
    `INSERT INTO employee_educations (employee_id, education_level, institution_name, major, graduation_year, source_system)
     VALUES ('${employeeId}'::uuid, 'S1', 'Mock Mining Institute', ${esc(employee.education)}, 2010 + (abs(('x'||substr(md5('${employee.employeeNumber}'),1,4))::bit(16)::int) % 10), 'BIGQUERY')`
  );
  await insertIfMissing(
    "employee_project_assignments",
    `employee_id = '${employeeId}'::uuid AND project_name = ${esc(employee.project)}`,
    `INSERT INTO employee_project_assignments (employee_id, project_name, role_name, project_scope, project_impact, start_date, end_date, source_system)
     VALUES ('${employeeId}'::uuid, ${esc(employee.project)}, 'Contributor', 'Mining operations improvement', 'Improved control and reporting discipline', '2025-01-01', '2025-12-31', 'BIGQUERY')`
  );

  for (const year of [2024, 2025, 2026]) {
    const score = employee.classification.includes("DEVELOP") ? 72 + (year % 3) : 84 + (year % 4);
    await prisma.$executeRaw`
      INSERT INTO employee_performances (employee_id, period_year, performance_score, performance_scale, evaluator_summary, source_system, source_updated_at)
      VALUES (${employeeId}::uuid, ${year}, ${score}, '100', ${`Performance ${year} for ${employee.fullName}`}, 'BIGQUERY', now())
      ON CONFLICT (employee_id, period_year) DO UPDATE SET performance_score = EXCLUDED.performance_score, updated_at = now()
    `;
  }

  await insertIfMissing(
    "employee_assessments",
    `employee_id = '${employeeId}'::uuid AND assessment_type = 'TALENT_REVIEW' AND assessment_date = '2026-06-30'::date`,
    `INSERT INTO employee_assessments (employee_id, assessment_type, assessment_date, score, scale, assessment_summary, assessor, source_system)
     VALUES ('${employeeId}'::uuid, 'TALENT_REVIEW', '2026-06-30', ${employee.assessmentComplete ? 82 : "NULL"}, '100', ${esc(employee.assessmentComplete ? 'Completed review' : 'Assessment incomplete')}, 'Mock Assessor', 'BIGQUERY')`
  );
  await prisma.$executeRaw`
    INSERT INTO employee_potentials (employee_id, assessment_year, potential_score, potential_scale, talent_classification, talent_matrix_position, readiness_level, source_system)
    VALUES (${employeeId}::uuid, 2026, ${employee.assessmentComplete ? 80 : null}, '100', ${employee.classification}, ${employee.matrix}, ${employee.readiness}, 'BIGQUERY')
    ON CONFLICT (employee_id, assessment_year) DO UPDATE SET
      potential_score = EXCLUDED.potential_score, talent_classification = EXCLUDED.talent_classification,
      talent_matrix_position = EXCLUDED.talent_matrix_position, readiness_level = EXCLUDED.readiness_level, updated_at = now()
  `;

  const desiredSkills = employee.positionCode === "DTA-SPL" ? ["DATA-ANALYTICS", "DASHBOARDING", "STAKEHOLDER"] : ["HSE-RISK", "STAKEHOLDER", "COACHING"];
  for (const code of desiredSkills) {
    const skillId = skillIds.get(code);
    const employeeSkillId = await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO talent_employee_skills (employee_id, skill_id, current_level, validated_level, assessment_source, confidence_score, last_assessed_at, validation_status)
      VALUES (${employeeId}::uuid, ${skillId}::uuid, ${employee.readiness === "READY_NOW" ? 4 : 3}, ${employee.assessmentComplete ? 3 : null}, 'BIGQUERY_MOCK', ${employee.assessmentComplete ? 0.86 : null}, now(), ${employee.assessmentComplete ? "VALIDATED" : "PROPOSED"})
      ON CONFLICT (employee_id, skill_id) DO UPDATE SET current_level = EXCLUDED.current_level, updated_at = now()
      RETURNING id
    `);
    await insertIfMissing(
      "talent_employee_skill_evidences",
      `employee_skill_id = '${employeeSkillId}'::uuid AND evidence_title = ${esc(employee.project)}`,
      `INSERT INTO talent_employee_skill_evidences (employee_skill_id, evidence_type, evidence_title, evidence_description, evidence_date, source_system, is_verified)
       VALUES ('${employeeSkillId}'::uuid, 'PROJECT', ${esc(employee.project)}, 'Mock project evidence from BigQuery', '2025-12-31', 'BIGQUERY', ${employee.assessmentComplete})`
    );
  }
}

async function seedProgramsAndCases(data: SourceData, employeeIds: Map<string, string>, positionIds: Map<string, string>, skillIds: Map<string, string>) {
  const programs = [
    ["LDR-101", "Frontline Leadership", "CLASSROOM"],
    ["HSE-201", "Critical Risk Control", "CERTIFICATION"],
    ["DGT-301", "Operational Analytics", "WORKSHOP"],
  ] as const;
  const programIds = new Map<string, string>();
  for (const [code, name, type] of programs) {
    programIds.set(code, await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO learning_programs (code, name, program_type, description, provider)
      VALUES (${code}, ${name}, ${type}, ${`${name} mock program`}, 'Internal Learning Center')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `));
  }

  for (const employee of data.employees.slice(0, 12)) {
    const employeeId = employeeIds.get(employee.employeeNumber)!;
    await insertIfMissing(
      "learning_employee_histories",
      `employee_id = '${employeeId}'::uuid AND learning_program_id = '${programIds.get("LDR-101")}'::uuid`,
      `INSERT INTO learning_employee_histories (employee_id, learning_program_id, related_skill_id, start_date, completion_date, status, result, certificate_reference, source_system)
       VALUES ('${employeeId}'::uuid, '${programIds.get("LDR-101")}'::uuid, '${skillIds.get("COACHING")}'::uuid, '2026-02-01', '2026-02-05', 'COMPLETED', 'PASSED', 'CERT-MOCK-${employee.employeeNumber}', 'BIGQUERY')`
    );
  }

  for (const employee of data.employees.filter((item) => item.joinDate >= "2025-01-01")) {
    const employeeId = employeeIds.get(employee.employeeNumber)!;
    const existingProgram = await prisma.$queryRaw<IdRow[]>`
      SELECT id FROM onboarding_programs WHERE employee_id = ${employeeId}::uuid AND start_date = ${employee.joinDate}::date LIMIT 1
    `;
    const programId = existingProgram[0]?.id ?? (await scalarId(prisma.$queryRaw<IdRow[]>`
      INSERT INTO onboarding_programs (employee_id, start_date, target_completion_date, status)
      VALUES (${employeeId}::uuid, ${employee.joinDate}::date, (${employee.joinDate}::date + interval '90 days')::date, 'IN_PROGRESS')
      RETURNING id
    `));
    await insertIfMissing(
      "onboarding_tasks",
      `onboarding_program_id = '${programId}'::uuid AND task_name = 'Safety induction'`,
      `INSERT INTO onboarding_tasks (onboarding_program_id, task_name, task_description, assigned_to, due_date, status)
       VALUES ('${programId}'::uuid, 'Safety induction', 'Initial site safety induction', 'HSE Onboarding', ('${employee.joinDate}'::date + interval '7 days')::date, 'COMPLETED')`
    );
  }

  for (const employee of data.employees.filter((item) => item.retirementDate <= "2029-12-31")) {
    const employeeId = employeeIds.get(employee.employeeNumber)!;
    await prisma.$executeRaw`
      INSERT INTO retire_retirement_monitoring (employee_id, planned_retirement_date, retirement_status, critical_position, successor_required, notes)
      VALUES (${employeeId}::uuid, ${employee.retirementDate}::date, 'PLANNED', true, true, 'Mock retirement monitoring')
      ON CONFLICT (employee_id) DO UPDATE SET planned_retirement_date = EXCLUDED.planned_retirement_date, updated_at = now()
    `;
  }

  for (const employee of data.employees.filter((item) => item.readiness === "READY_NOW").slice(0, 4)) {
    const employeeId = employeeIds.get(employee.employeeNumber)!;
    const currentPositionId = positionIds.get(employee.positionCode)!;
    const targetPositionId = positionIds.get(employee.positionCode === "MPL-SR-ENG" ? "MPL-SPT" : employee.positionCode)!;
    await insertIfMissing(
      "talent_promotion_cases",
      `employee_id = '${employeeId}'::uuid AND target_position_id = '${targetPositionId}'::uuid`,
      `INSERT INTO talent_promotion_cases (employee_id, current_position_id, target_position_id, case_status, readiness_score, initiated_by, hr_notes)
       VALUES ('${employeeId}'::uuid, '${currentPositionId}'::uuid, '${targetPositionId}'::uuid, 'OPEN', 88, 'HR_MOCK', 'Ready-now mock case')`
    );
  }

  for (const employee of data.employees.filter((item) => item.classification === "MOBILITY_READY").slice(0, 4)) {
    const employeeId = employeeIds.get(employee.employeeNumber)!;
    const sourcePositionId = positionIds.get(employee.positionCode)!;
    const targetPositionId = positionIds.get(employee.positionCode === "DTA-SPL" ? "MPL-SR-ENG" : "DTA-SPL")!;
    await insertIfMissing(
      "talent_mobility_cases",
      `employee_id = '${employeeId}'::uuid AND target_position_id = '${targetPositionId}'::uuid`,
      `INSERT INTO talent_mobility_cases (employee_id, source_position_id, target_position_id, mobility_type, case_status, fit_score, initiated_by, hr_notes)
       VALUES ('${employeeId}'::uuid, '${sourcePositionId}'::uuid, '${targetPositionId}'::uuid, 'CROSS_FUNCTION', 'OPEN', 79, 'HR_MOCK', 'Transferable skill mock case')`
    );
  }
}

export async function syncBigQueryMock() {
  const sourcePath = path.join(__dirname, "mock", "bigquery-source.json");
  const data = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as SourceData;
  const runId = await upsertSyncRun("BIGQUERY", "HR_OPERATIONAL_MOCK", data.employees.length);
  let inserted = 0;
  let updated = 0;

  try {
    const { departmentIds, positionIds } = await upsertOrganization(data);
    const skillIds = await upsertSkills(positionIds);
    const employeeIds = new Map<string, string>();

    for (const employee of data.employees) {
      const before = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM employee_profiles WHERE employee_number = ${employee.employeeNumber}
      `;
      const employeeId = await upsertEmployee(employee, positionIds, departmentIds, data.sourceUpdatedAt);
      employeeIds.set(employee.employeeNumber, employeeId);
      Number(before[0].count) === 0 ? inserted += 1 : updated += 1;
    }

    for (const employee of data.employees) {
      if (!employee.supervisorNumber) continue;
      const employeeId = employeeIds.get(employee.employeeNumber);
      const supervisorId = employeeIds.get(employee.supervisorNumber);
      if (employeeId && supervisorId) {
        await prisma.$executeRaw`
          UPDATE employee_profiles SET supervisor_employee_id = ${supervisorId}::uuid, updated_at = now()
          WHERE id = ${employeeId}::uuid
        `;
      }
    }

    for (const employee of data.employees) {
      await seedEmployeeDetails(
        employee,
        employeeIds.get(employee.employeeNumber)!,
        positionIds.get(employee.positionCode)!,
        departmentIds.get(employee.departmentCode)!,
        skillIds
      );
    }
    await seedProgramsAndCases(data, employeeIds, positionIds, skillIds);
    await finishSyncRun(runId, "SUCCESS", inserted, updated);
    console.log(`BigQuery mock sync success: ${data.employees.length} employees processed.`);
  } catch (error) {
    await finishSyncRun(runId, "FAILED", inserted, updated, 1, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function disconnectBigQueryMock() {
  await prisma.$disconnect();
}

if (require.main === module) {
  syncBigQueryMock()
    .catch((error) => {
      console.error("BigQuery mock sync failed:", error);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
