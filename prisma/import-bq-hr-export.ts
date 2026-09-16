/**
 * Imports the three agreed BigQuery views into the HR integration store.
 *
 * BigQuery authentication/querying deliberately stays outside this script:
 * schedule a service account job to write the approved views to JSON, then
 * run this importer with BQ_HR_EXPORT_FILE=<absolute-path>. This keeps BQ
 * credentials out of the web application and makes each import reproducible.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

type Row = Record<string, unknown>;
type ExportFile = {
  sourceUpdatedAt?: string;
  p_emps?: Row[];
  p_talent_profile?: Row[];
  p_career_history?: Row[];
};
type IdRow = { id: string };

function text(row: Row, field: string) {
  const value = row[field];
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function requiredText(row: Row, field: string) {
  const value = text(row, field);
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function date(row: Row, field: string) {
  const value = text(row, field);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) throw new Error(`${field} must use ISO date format`);
  return value.slice(0, 10);
}

function integer(row: Row, field: string) {
  const value = text(row, field);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${field} must be an integer`);
  return number;
}

async function createRun(rowsRead: number) {
  const [run] = await prisma.$queryRaw<IdRow[]>`
    INSERT INTO hr_integration_sync_runs (source_name, entity_name, status, rows_read)
    VALUES ('BIGQUERY', 'p_emps,p_talent_profile,p_career_history', 'RUNNING', ${rowsRead})
    RETURNING id
  `;
  return run.id;
}

async function finishRun(id: string, status: string, inserted: number, updated: number, skipped: number, failed: number, error?: string) {
  await prisma.$executeRaw`
    UPDATE hr_integration_sync_runs
    SET completed_at = now(), status = ${status}, rows_inserted = ${inserted}, rows_updated = ${updated},
        rows_skipped = ${skipped}, rows_failed = ${failed}, error_summary = ${error ?? null}
    WHERE id = ${id}::uuid
  `;
}

async function upsertSourceIdentifier(employeeId: string, type: string, value: string | null, sourceUpdatedAt: string) {
  if (!value) return;
  await prisma.$executeRaw`
    INSERT INTO hr_employee_source_identifiers (employee_id, source_system, identifier_type, identifier_value, source_updated_at)
    VALUES (${employeeId}::uuid, 'BIGQUERY', ${type}, ${value}, ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (source_system, identifier_type, identifier_value) DO UPDATE SET
      employee_id = EXCLUDED.employee_id, source_updated_at = EXCLUDED.source_updated_at, is_active = true, updated_at = now()
  `;
}

async function upsertEmployee(row: Row, sourceUpdatedAt: string) {
  const personnelNumber = requiredText(row, "personnel_number");
  const [employee] = await prisma.$queryRaw<IdRow[]>`
    INSERT INTO hr_employee_profiles
      (personnel_number, global_personnel_number, employee_name, office_email, date_of_birth, gender, hiring_date, join_date, source_updated_at, last_synced_at)
    VALUES
      (${personnelNumber}, ${text(row, "global_personnel_number")}, ${requiredText(row, "employee_name")}, ${text(row, "office_email")},
       ${date(row, "date_of_birth")}::date, ${text(row, "gender")}, ${date(row, "hiring_date")}::date, ${date(row, "join_date")}::date,
       ${sourceUpdatedAt}::timestamptz, now())
    ON CONFLICT (personnel_number) DO UPDATE SET
      global_personnel_number = EXCLUDED.global_personnel_number,
      employee_name = EXCLUDED.employee_name,
      office_email = EXCLUDED.office_email,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      hiring_date = EXCLUDED.hiring_date,
      join_date = EXCLUDED.join_date,
      source_updated_at = EXCLUDED.source_updated_at,
      last_synced_at = now(), is_active = true, updated_at = now()
    RETURNING id
  `;

  await upsertSourceIdentifier(employee.id, "PERSONNEL_NUMBER", personnelNumber, sourceUpdatedAt);
  await upsertSourceIdentifier(employee.id, "GLOBAL_PERSONNEL_NUMBER", text(row, "global_personnel_number"), sourceUpdatedAt);
  await upsertSourceIdentifier(employee.id, "OLD_PERSONNEL_NUMBER", text(row, "old_personnel_number"), sourceUpdatedAt);

  const period = integer(row, "data_period");
  if (period === null) throw new Error("data_period is required");
  await prisma.$executeRaw`
    INSERT INTO hr_employee_employment_snapshots
      (employee_id, data_period, company, personnel_area, personnel_subarea, employee_group, ps_level, layer,
       work_contract, end_of_contract, position_name, business_unit, direktorat, divisi, department,
       supervisor_personnel_number, supervisor_name, hrbp_name, position_type, job_family, stem, value_chain,
       job_characteristics, job_grouping, critical_position, c_level, source_updated_at)
    VALUES
      (${employee.id}::uuid, ${period}, ${text(row, "company")}, ${text(row, "personnel_area")}, ${text(row, "personnel_subarea")},
       ${text(row, "employee_group")}, ${text(row, "ps_level")}, ${text(row, "layer")}, ${text(row, "work_contract")},
       ${date(row, "end_of_contract")}::date, ${text(row, "position_name")}, ${text(row, "business_unit")},
       ${text(row, "direktorat")}, ${text(row, "divisi")}, ${text(row, "department")}, ${text(row, "supervisor_nik")},
       ${text(row, "supervisor_name")}, ${text(row, "hrbp_name")}, ${text(row, "position_type")}, ${text(row, "job_family")},
       ${text(row, "stem")}, ${text(row, "value_chain")}, ${text(row, "job_characteristics")}, ${text(row, "job_grouping")},
       ${text(row, "critical_position")}, ${text(row, "c_level")}, ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (employee_id, data_period) DO UPDATE SET
      company = EXCLUDED.company, personnel_area = EXCLUDED.personnel_area, personnel_subarea = EXCLUDED.personnel_subarea,
      employee_group = EXCLUDED.employee_group, ps_level = EXCLUDED.ps_level, layer = EXCLUDED.layer,
      work_contract = EXCLUDED.work_contract, end_of_contract = EXCLUDED.end_of_contract, position_name = EXCLUDED.position_name,
      business_unit = EXCLUDED.business_unit, direktorat = EXCLUDED.direktorat, divisi = EXCLUDED.divisi, department = EXCLUDED.department,
      supervisor_personnel_number = EXCLUDED.supervisor_personnel_number, supervisor_name = EXCLUDED.supervisor_name,
      hrbp_name = EXCLUDED.hrbp_name, position_type = EXCLUDED.position_type, job_family = EXCLUDED.job_family,
      stem = EXCLUDED.stem, value_chain = EXCLUDED.value_chain, job_characteristics = EXCLUDED.job_characteristics,
      job_grouping = EXCLUDED.job_grouping, critical_position = EXCLUDED.critical_position, c_level = EXCLUDED.c_level,
      source_updated_at = EXCLUDED.source_updated_at, updated_at = now()
  `;
}

async function employeeId(personnelNumber: string) {
  const rows = await prisma.$queryRaw<IdRow[]>`SELECT id FROM hr_employee_profiles WHERE personnel_number = ${personnelNumber}`;
  return rows[0]?.id;
}

async function upsertTalent(row: Row, sourceUpdatedAt: string) {
  const personnelNumber = requiredText(row, "personnel_number");
  const id = await employeeId(personnelNumber);
  if (!id) return false;
  const talentYear = integer(row, "talent_year");
  if (talentYear === null) throw new Error("talent_year is required");
  await prisma.$executeRaw`
    INSERT INTO hr_employee_talent_profiles
      (employee_id, talent_year, business_unit, position_name, join_date, hiring_date, start_date_in_current_position,
       last_rotation_date, last_promotion_date, performance_category, potential_grow_category, talent_class_9_box,
       talent_class_12_box, talent_calibration_now, current_roles, xdp_history, pat_2025, pat_2024, pat_2023, pat_2022,
       certification, training, comments_360, strength_360, weakness_360, aspiration, project_involvement, linkedin_link, source_updated_at)
    VALUES
      (${id}::uuid, ${talentYear}, ${text(row, "business_unit")}, ${text(row, "position_name")}, ${date(row, "join_date")}::date,
       ${date(row, "hiring_date")}::date, ${date(row, "start_date_in_current_position")}::date, ${date(row, "last_rotation_date")}::date,
       ${date(row, "last_promotion_date")}::date, ${text(row, "performance_category")}, ${text(row, "potential_grow_category")},
       ${text(row, "talent_class_9_box")}, ${text(row, "talent_class_12_box")}, ${text(row, "talent_calibration_now")},
       ${text(row, "current_roles")}, ${text(row, "xdp_history")}, ${text(row, "pat_2025")}, ${text(row, "pat_2024")},
       ${text(row, "pat_2023")}, ${text(row, "pat_2022")}, ${text(row, "certification")}, ${text(row, "training")},
       ${text(row, "360_comments")}, ${text(row, "360_strength")}, ${text(row, "360_weakness")}, ${text(row, "aspiration")},
       ${text(row, "project_involvement")}, ${text(row, "linkedin_link")}, ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (employee_id, talent_year) DO UPDATE SET
      business_unit = EXCLUDED.business_unit, position_name = EXCLUDED.position_name, join_date = EXCLUDED.join_date,
      hiring_date = EXCLUDED.hiring_date, start_date_in_current_position = EXCLUDED.start_date_in_current_position,
      last_rotation_date = EXCLUDED.last_rotation_date, last_promotion_date = EXCLUDED.last_promotion_date,
      performance_category = EXCLUDED.performance_category, potential_grow_category = EXCLUDED.potential_grow_category,
      talent_class_9_box = EXCLUDED.talent_class_9_box, talent_class_12_box = EXCLUDED.talent_class_12_box,
      talent_calibration_now = EXCLUDED.talent_calibration_now, current_roles = EXCLUDED.current_roles, xdp_history = EXCLUDED.xdp_history,
      pat_2025 = EXCLUDED.pat_2025, pat_2024 = EXCLUDED.pat_2024, pat_2023 = EXCLUDED.pat_2023, pat_2022 = EXCLUDED.pat_2022,
      certification = EXCLUDED.certification, training = EXCLUDED.training, comments_360 = EXCLUDED.comments_360,
      strength_360 = EXCLUDED.strength_360, weakness_360 = EXCLUDED.weakness_360, aspiration = EXCLUDED.aspiration,
      project_involvement = EXCLUDED.project_involvement, linkedin_link = EXCLUDED.linkedin_link,
      source_updated_at = EXCLUDED.source_updated_at, updated_at = now()
  `;
  return true;
}

async function upsertCareerNarrative(row: Row, sourceUpdatedAt: string) {
  const personnelNumber = requiredText(row, "personnel_number");
  const id = await employeeId(personnelNumber);
  if (!id) return false;
  await prisma.$executeRaw`
    INSERT INTO hr_employee_career_narratives (employee_id, career_within_organization, career_outside_organization, source_updated_at)
    VALUES (${id}::uuid, ${text(row, "career_within_organization")}, ${text(row, "career_outside_organization")}, ${sourceUpdatedAt}::timestamptz)
    ON CONFLICT (employee_id) DO UPDATE SET
      career_within_organization = EXCLUDED.career_within_organization,
      career_outside_organization = EXCLUDED.career_outside_organization,
      source_updated_at = EXCLUDED.source_updated_at, updated_at = now()
  `;
  return true;
}

async function main() {
  const file = process.env.BQ_HR_EXPORT_FILE;
  if (!file) throw new Error("BQ_HR_EXPORT_FILE must point to a JSON export of the approved BQ views");
  const source = JSON.parse(fs.readFileSync(file, "utf8")) as ExportFile;
  const employees = Array.isArray(source.p_emps) ? source.p_emps : [];
  const talent = Array.isArray(source.p_talent_profile) ? source.p_talent_profile : [];
  const careers = Array.isArray(source.p_career_history) ? source.p_career_history : [];
  const sourceUpdatedAt = source.sourceUpdatedAt ?? new Date().toISOString();
  const runId = await createRun(employees.length + talent.length + careers.length);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const row of employees) {
      try {
        const exists = await employeeId(requiredText(row, "personnel_number"));
        await upsertEmployee(row, sourceUpdatedAt);
        exists ? updated += 1 : inserted += 1;
      } catch (error) {
        failed += 1;
        console.warn(`p_emps row skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const row of talent) {
      try {
        (await upsertTalent(row, sourceUpdatedAt)) ? updated += 1 : skipped += 1;
      } catch (error) {
        failed += 1;
        console.warn(`p_talent_profile row skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const row of careers) {
      try {
        (await upsertCareerNarrative(row, sourceUpdatedAt)) ? updated += 1 : skipped += 1;
      } catch (error) {
        failed += 1;
        console.warn(`p_career_history row skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    await finishRun(runId, failed ? "PARTIAL_SUCCESS" : "SUCCESS", inserted, updated, skipped, failed);
  } catch (error) {
    await finishRun(runId, "FAILED", inserted, updated, skipped, failed + 1, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("BigQuery HR import failed:", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
