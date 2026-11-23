import "./load-env";
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

export async function initBqRawSchema() {
  console.log("Checking and initializing bq_raw schema and landing tables...");

  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS bq_raw;`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_emps (
      data_period INTEGER,
      global_personnel_number TEXT,
      personnel_number TEXT,
      employee_name TEXT,
      date_of_birth DATE,
      gender TEXT,
      hiring_date DATE,
      join_date DATE,
      company TEXT,
      personnel_area TEXT,
      personnel_subarea TEXT,
      employee_group TEXT,
      ps_level TEXT,
      layer TEXT,
      work_contract TEXT,
      end_of_contract DATE,
      position_name TEXT,
      business_unit TEXT,
      direktorat TEXT,
      divisi TEXT,
      department TEXT,
      supervisor_nik TEXT,
      supervisor_name TEXT,
      cell_phone TEXT,
      office_email TEXT,
      hrbp_name TEXT,
      position_type TEXT,
      job_family TEXT,
      stem TEXT,
      value_chain TEXT,
      job_characteristics TEXT,
      job_grouping TEXT,
      critical_position TEXT,
      c_level TEXT,
      old_personnel_number TEXT,
      faculty TEXT,
      major TEXT,
      degree TEXT,
      school TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_talent_profile (
      personnel_number TEXT,
      employee_name TEXT,
      talent_year INTEGER,
      business_unit TEXT,
      position_name TEXT,
      join_date DATE,
      hiring_date DATE,
      start_date_in_current_position DATE,
      last_rotation_date DATE,
      last_promotion_date DATE,
      performance_category TEXT,
      potential_grow_category TEXT,
      talent_class_9_box TEXT,
      talent_class_12_box TEXT,
      talent_calibration_now TEXT,
      current_roles TEXT,
      xdp_history TEXT,
      pat_2025 TEXT,
      pat_2024 TEXT,
      pat_2023 TEXT,
      pat_2022 TEXT,
      certification TEXT,
      training TEXT,
      comments_360 TEXT,
      strength_360 TEXT,
      weakness_360 TEXT,
      aspiration TEXT,
      project_involvement TEXT,
      project_impact TEXT,
      project_contribution TEXT,
      bu_visibility TEXT,
      technical_competencies TEXT,
      soft_competencies TEXT,
      "360_comments" TEXT,
      "360_strength" TEXT,
      "360_weakness" TEXT,
      linkedin_link TEXT,
      retention_tier TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_career_history (
      personnel_number TEXT,
      career_within_organization TEXT,
      career_outside_organization TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_assessment_history (
      personnel_number TEXT,
      assesment_date DATE,
      iq_score NUMERIC,
      iq_category TEXT,
      disc TEXT,
      disc_category TEXT,
      matchup_result TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_dp_history (
      personnel_number TEXT,
      dp_program_name TEXT,
      dp_program_batch BIGINT,
      dp_program_year BIGINT,
      start_date DATE,
      end_date DATE,
      final_score NUMERIC,
      final_rating TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_promotion_approval_status (
      personnel_number TEXT,
      employee_name TEXT,
      position_name TEXT,
      direktorat TEXT,
      divisi TEXT,
      department TEXT,
      last_promotion_date DATE,
      start_date_in_current_position DATE,
      current_status TEXT,
      next_status TEXT,
      to_be_position TEXT,
      to_be_ps_level TEXT,
      promotion_plan_desc TEXT,
      action_date DATE,
      approval_date DATE,
      initiator_personnel_number TEXT,
      initiator_employee_name TEXT,
      initiator_position_name TEXT,
      reviewer_comment TEXT,
      submit_reason TEXT,
      "360_comments" TEXT,
      "360_strength" TEXT,
      "360_weakness" TEXT,
      promotion_cycle_year INTEGER
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_employee_competencies (
      id SERIAL PRIMARY KEY,
      personnel_number TEXT NOT NULL,
      employee_name TEXT,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      qual_id TEXT NOT NULL,
      qual_name TEXT NOT NULL,
      prof_id INT NOT NULL,
      prof_desc TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_soft BOOLEAN NOT NULL DEFAULT false,
      is_current BOOLEAN NOT NULL DEFAULT true
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bq_raw.p_object_structure (
      objid TEXT,
      object_id TEXT
    );
  `);

  // Ensure any missing columns if tables existed earlier with partial columns
  await prisma.$executeRawUnsafe(`ALTER TABLE bq_raw.p_dp_history ADD COLUMN IF NOT EXISTS start_date DATE;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE bq_raw.p_dp_history ADD COLUMN IF NOT EXISTS end_date DATE;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE bq_raw.p_emps ADD COLUMN IF NOT EXISTS cell_phone TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE bq_raw.p_talent_profile ADD COLUMN IF NOT EXISTS retention_tier TEXT;`);

  console.log("✔ bq_raw schema and all 8 landing tables are ready!");
}

if (require.main === module) {
  initBqRawSchema()
    .catch((err) => {
      console.error("Failed to initialize bq_raw schema:", err);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
