-- Canonical integration store for BigQuery HR and HSE CT.
-- This namespace is intentionally separate from the legacy Profile tables and
-- earlier mock-only operational tables.  `personnel_number` remains text so
-- leading zeroes are preserved.

CREATE TABLE IF NOT EXISTS "hr_employee_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "personnel_number" TEXT NOT NULL,
  "global_personnel_number" TEXT,
  "employee_name" TEXT NOT NULL,
  "office_email" TEXT,
  "date_of_birth" DATE,
  "gender" TEXT,
  "hiring_date" DATE,
  "join_date" DATE,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_profiles_personnel_number_key" UNIQUE ("personnel_number")
);

CREATE TABLE IF NOT EXISTS "hr_employee_employment_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "data_period" INTEGER NOT NULL,
  "company" TEXT,
  "personnel_area" TEXT,
  "personnel_subarea" TEXT,
  "employee_group" TEXT,
  "ps_level" TEXT,
  "layer" TEXT,
  "work_contract" TEXT,
  "end_of_contract" DATE,
  "position_name" TEXT,
  "business_unit" TEXT,
  "direktorat" TEXT,
  "divisi" TEXT,
  "department" TEXT,
  "supervisor_personnel_number" TEXT,
  "supervisor_name" TEXT,
  "hrbp_name" TEXT,
  "position_type" TEXT,
  "job_family" TEXT,
  "stem" TEXT,
  "value_chain" TEXT,
  "job_characteristics" TEXT,
  "job_grouping" TEXT,
  "critical_position" TEXT,
  "c_level" TEXT,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_employment_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_employment_snapshots_employee_period_key" UNIQUE ("employee_id", "data_period")
);

CREATE TABLE IF NOT EXISTS "hr_employee_talent_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "talent_year" INTEGER NOT NULL,
  "business_unit" TEXT,
  "position_name" TEXT,
  "join_date" DATE,
  "hiring_date" DATE,
  "start_date_in_current_position" DATE,
  "last_rotation_date" DATE,
  "last_promotion_date" DATE,
  "performance_category" TEXT,
  "potential_grow_category" TEXT,
  "talent_class_9_box" TEXT,
  "talent_class_12_box" TEXT,
  "talent_calibration_now" TEXT,
  "current_roles" TEXT,
  "xdp_history" TEXT,
  "pat_2025" TEXT,
  "pat_2024" TEXT,
  "pat_2023" TEXT,
  "pat_2022" TEXT,
  "certification" TEXT,
  "training" TEXT,
  "comments_360" TEXT,
  "strength_360" TEXT,
  "weakness_360" TEXT,
  "aspiration" TEXT,
  "project_involvement" TEXT,
  "linkedin_link" TEXT,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_talent_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_talent_profiles_employee_year_key" UNIQUE ("employee_id", "talent_year")
);

-- The supplied p_career_history has narrative fields only, without a date,
-- position code, or movement type.  Keep it as a sourced narrative until the
-- upstream table exposes atomic career-event fields.
CREATE TABLE IF NOT EXISTS "hr_employee_career_narratives" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "career_within_organization" TEXT,
  "career_outside_organization" TEXT,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_career_narratives_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_career_narratives_employee_key" UNIQUE ("employee_id")
);

-- A person can have a BQ personnel number and an HSE SID.  This table prevents
-- the UI and integration jobs from matching on names or on unverified data.
CREATE TABLE IF NOT EXISTS "hr_employee_source_identifiers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "source_system" TEXT NOT NULL,
  "identifier_type" TEXT NOT NULL,
  "identifier_value" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_source_identifiers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_source_identifiers_source_identifier_key" UNIQUE ("source_system", "identifier_type", "identifier_value")
);

CREATE TABLE IF NOT EXISTS "hr_hsect_employee_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "sid" TEXT NOT NULL,
  "hsect_employee_id" TEXT,
  "company_id" TEXT,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_hsect_employee_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_hsect_employee_links_sid_key" UNIQUE ("sid"),
  CONSTRAINT "hr_hsect_employee_links_employee_key" UNIQUE ("employee_id")
);

-- Generic document metadata first; only map a document into MCU/SIMPER or a
-- certification once HSE CT's response semantics have been confirmed.
CREATE TABLE IF NOT EXISTS "hr_hsect_document_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "hsect_document_id" TEXT NOT NULL,
  "document_type_name" TEXT,
  "document_group_name" TEXT,
  "document_category_id" TEXT,
  "status" TEXT,
  "issued_at" DATE,
  "expires_at" DATE,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_hsect_document_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_hsect_document_records_employee_document_key" UNIQUE ("employee_id", "hsect_document_id")
);

CREATE TABLE IF NOT EXISTS "hr_integration_sync_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_name" TEXT NOT NULL,
  "entity_name" TEXT NOT NULL,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ,
  "status" TEXT NOT NULL,
  "rows_read" INTEGER NOT NULL DEFAULT 0,
  "rows_inserted" INTEGER NOT NULL DEFAULT 0,
  "rows_updated" INTEGER NOT NULL DEFAULT 0,
  "rows_skipped" INTEGER NOT NULL DEFAULT 0,
  "rows_failed" INTEGER NOT NULL DEFAULT 0,
  "error_summary" TEXT,
  CONSTRAINT "hr_integration_sync_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hr_employee_profiles_global_personnel_number_idx" ON "hr_employee_profiles"("global_personnel_number");
CREATE INDEX IF NOT EXISTS "hr_employee_employment_snapshots_org_idx" ON "hr_employee_employment_snapshots"("direktorat", "divisi", "department");
CREATE INDEX IF NOT EXISTS "hr_employee_talent_profiles_year_idx" ON "hr_employee_talent_profiles"("talent_year");
CREATE INDEX IF NOT EXISTS "hr_employee_source_identifiers_employee_idx" ON "hr_employee_source_identifiers"("employee_id");
CREATE INDEX IF NOT EXISTS "hr_hsect_document_records_employee_expiry_idx" ON "hr_hsect_document_records"("employee_id", "expires_at");

ALTER TABLE "hr_employee_employment_snapshots" ADD CONSTRAINT "hr_employee_employment_snapshots_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_employee_talent_profiles" ADD CONSTRAINT "hr_employee_talent_profiles_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_employee_career_narratives" ADD CONSTRAINT "hr_employee_career_narratives_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_employee_source_identifiers" ADD CONSTRAINT "hr_employee_source_identifiers_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_hsect_employee_links" ADD CONSTRAINT "hr_hsect_employee_links_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_hsect_document_records" ADD CONSTRAINT "hr_hsect_document_records_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE VIEW "hr_employee_360_view" AS
SELECT
  e.id,
  e.personnel_number,
  e.global_personnel_number,
  e.employee_name,
  e.office_email,
  e.join_date,
  s.company,
  s.business_unit,
  s.direktorat,
  s.divisi,
  s.department,
  s.position_name,
  s.ps_level,
  s.layer,
  s.work_contract,
  s.end_of_contract,
  s.supervisor_name,
  t.talent_year,
  t.performance_category,
  t.potential_grow_category,
  t.talent_class_9_box,
  t.talent_class_12_box,
  t.last_promotion_date,
  t.aspiration,
  t.project_involvement,
  h.sid AS hsect_sid,
  COALESCE(d.document_count, 0)::INTEGER AS hsect_document_count,
  COALESCE(d.expiring_document_count, 0)::INTEGER AS hsect_expiring_document_count
FROM "hr_employee_profiles" e
LEFT JOIN LATERAL (
  SELECT * FROM "hr_employee_employment_snapshots" s
  WHERE s.employee_id = e.id
  ORDER BY s.data_period DESC
  LIMIT 1
) s ON TRUE
LEFT JOIN LATERAL (
  SELECT * FROM "hr_employee_talent_profiles" t
  WHERE t.employee_id = e.id
  ORDER BY t.talent_year DESC
  LIMIT 1
) t ON TRUE
LEFT JOIN "hr_hsect_employee_links" h ON h.employee_id = e.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS document_count,
         COUNT(*) FILTER (WHERE expires_at >= CURRENT_DATE AND expires_at < CURRENT_DATE + INTERVAL '90 days') AS expiring_document_count
  FROM "hr_hsect_document_records" d
  WHERE d.employee_id = e.id
) d ON TRUE;
