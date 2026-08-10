CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "organization_directorates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_directorates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_divisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "directorate_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_divisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "division_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_positions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "department_id" UUID NOT NULL,
  "position_code" TEXT NOT NULL,
  "position_name" TEXT NOT NULL,
  "job_level" TEXT NOT NULL,
  "position_summary" TEXT,
  "job_description" TEXT,
  "is_managerial" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_position_reporting_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "position_id" UUID NOT NULL,
  "reports_to_position_id" UUID,
  "relationship_type" TEXT NOT NULL,
  "effective_from" DATE NOT NULL,
  "effective_to" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "organization_position_reporting_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_number" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "corporate_email" TEXT NOT NULL,
  "employment_status" TEXT NOT NULL,
  "employment_type" TEXT NOT NULL,
  "birth_date" DATE,
  "join_date" DATE NOT NULL,
  "retirement_date" DATE,
  "current_position_id" UUID,
  "current_department_id" UUID,
  "supervisor_employee_id" UUID,
  "work_location" TEXT NOT NULL,
  "photo_url" TEXT,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_career_histories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "position_id" UUID NOT NULL,
  "department_id" UUID NOT NULL,
  "movement_type" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "role_summary" TEXT,
  "achievement_summary" TEXT,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_career_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_educations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "education_level" TEXT NOT NULL,
  "institution_name" TEXT NOT NULL,
  "major" TEXT NOT NULL,
  "graduation_year" INTEGER NOT NULL,
  "source_system" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_project_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "project_name" TEXT NOT NULL,
  "role_name" TEXT NOT NULL,
  "project_scope" TEXT NOT NULL,
  "project_impact" TEXT,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "source_system" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_project_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_performances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "period_year" INTEGER NOT NULL,
  "performance_score" DECIMAL(5,2) NOT NULL,
  "performance_scale" TEXT NOT NULL,
  "evaluator_summary" TEXT,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_performances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_assessments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "assessment_type" TEXT NOT NULL,
  "assessment_date" DATE NOT NULL,
  "score" DECIMAL(5,2),
  "scale" TEXT NOT NULL,
  "assessment_summary" TEXT,
  "assessor" TEXT,
  "source_system" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_potentials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "assessment_year" INTEGER NOT NULL,
  "potential_score" DECIMAL(5,2),
  "potential_scale" TEXT NOT NULL,
  "talent_classification" TEXT NOT NULL,
  "talent_matrix_position" TEXT NOT NULL,
  "readiness_level" TEXT NOT NULL,
  "source_system" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_potentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_skill_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_skill_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL,
  "skill_code" TEXT NOT NULL,
  "skill_name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_skill_level_definitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "skill_id" UUID,
  "level" INTEGER NOT NULL,
  "level_name" TEXT NOT NULL,
  "definition" TEXT NOT NULL,
  "evidence_requirement" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_skill_level_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_position_skill_requirements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "position_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "required_level" INTEGER NOT NULL,
  "weight" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
  "evidence_notes" TEXT,
  "effective_from" DATE NOT NULL,
  "effective_to" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_position_skill_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_employee_skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "current_level" INTEGER NOT NULL,
  "validated_level" INTEGER,
  "assessment_source" TEXT NOT NULL,
  "confidence_score" DECIMAL(5,2),
  "last_assessed_at" TIMESTAMPTZ NOT NULL,
  "valid_until" DATE,
  "validation_status" TEXT NOT NULL,
  "validated_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_employee_skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_employee_skill_evidences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_skill_id" UUID NOT NULL,
  "evidence_type" TEXT NOT NULL,
  "evidence_reference_id" UUID,
  "evidence_title" TEXT NOT NULL,
  "evidence_description" TEXT,
  "evidence_date" DATE NOT NULL,
  "source_system" TEXT NOT NULL,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verified_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_employee_skill_evidences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_employee_aspirations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "target_position_id" UUID,
  "preferred_career_path" TEXT NOT NULL,
  "preferred_location" TEXT,
  "mobility_willingness" TEXT NOT NULL,
  "aspiration_notes" TEXT,
  "effective_date" DATE NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_employee_aspirations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_promotion_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "current_position_id" UUID NOT NULL,
  "target_position_id" UUID NOT NULL,
  "case_status" TEXT NOT NULL,
  "readiness_score" DECIMAL(5,2),
  "initiated_by" TEXT NOT NULL,
  "hr_notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_promotion_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_mobility_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "source_position_id" UUID NOT NULL,
  "target_position_id" UUID NOT NULL,
  "mobility_type" TEXT NOT NULL,
  "case_status" TEXT NOT NULL,
  "fit_score" DECIMAL(5,2),
  "initiated_by" TEXT NOT NULL,
  "hr_notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_mobility_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_successor_pools" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "target_position_id" UUID NOT NULL,
  "employee_id" UUID NOT NULL,
  "readiness_level" TEXT NOT NULL,
  "readiness_score" DECIMAL(5,2) NOT NULL,
  "rank_order" INTEGER,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "reviewed_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_successor_pools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hsect_mcu_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "examination_date" DATE NOT NULL,
  "valid_until" DATE NOT NULL,
  "fitness_status" TEXT NOT NULL,
  "restriction_summary" TEXT,
  "provider_name" TEXT NOT NULL,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hsect_mcu_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hsect_simper_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "simper_type" TEXT NOT NULL,
  "license_number_masked" TEXT NOT NULL,
  "issue_date" DATE NOT NULL,
  "valid_until" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "permitted_equipment" TEXT NOT NULL,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hsect_simper_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hsect_employee_certifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "certification_code" TEXT NOT NULL,
  "certification_name" TEXT NOT NULL,
  "certification_category" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "issue_date" DATE NOT NULL,
  "valid_until" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "related_skill_id" UUID,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "last_synced_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hsect_employee_certifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hsect_safety_summaries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "period_year" INTEGER NOT NULL,
  "hse_training_count" INTEGER NOT NULL DEFAULT 0,
  "safety_observation_count" INTEGER NOT NULL DEFAULT 0,
  "incident_count" INTEGER NOT NULL DEFAULT 0,
  "summary" TEXT,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hsect_safety_summaries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_programs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "program_type" TEXT NOT NULL,
  "description" TEXT,
  "provider" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_employee_histories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "learning_program_id" UUID NOT NULL,
  "related_skill_id" UUID,
  "start_date" DATE NOT NULL,
  "completion_date" DATE,
  "status" TEXT NOT NULL,
  "result" TEXT,
  "certificate_reference" TEXT,
  "source_system" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_employee_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retire_retirement_monitoring" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "planned_retirement_date" DATE NOT NULL,
  "retirement_status" TEXT NOT NULL,
  "critical_position" BOOLEAN NOT NULL DEFAULT false,
  "successor_required" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "retire_retirement_monitoring_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retire_knowledge_transfer_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "successor_employee_id" UUID,
  "knowledge_topic" TEXT NOT NULL,
  "transfer_method" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "target_completion_date" DATE NOT NULL,
  "completion_percentage" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "retire_knowledge_transfer_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_programs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "start_date" DATE NOT NULL,
  "target_completion_date" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "onboarding_program_id" UUID NOT NULL,
  "task_name" TEXT NOT NULL,
  "task_description" TEXT,
  "assigned_to" TEXT NOT NULL,
  "due_date" DATE NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_coaching_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "coach_employee_id" UUID,
  "coach_name" TEXT,
  "scheduled_at" TIMESTAMPTZ NOT NULL,
  "goals" TEXT NOT NULL,
  "result" TEXT,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_coaching_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_sync_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_name" TEXT NOT NULL,
  "entity_name" TEXT NOT NULL,
  "sync_type" TEXT NOT NULL,
  "started_at" TIMESTAMPTZ NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "status" TEXT NOT NULL,
  "rows_read" INTEGER NOT NULL DEFAULT 0,
  "rows_inserted" INTEGER NOT NULL DEFAULT 0,
  "rows_updated" INTEGER NOT NULL DEFAULT 0,
  "rows_skipped" INTEGER NOT NULL DEFAULT 0,
  "rows_failed" INTEGER NOT NULL DEFAULT 0,
  "error_summary" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_sync_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_sync_errors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sync_run_id" UUID NOT NULL,
  "source_record_reference" TEXT NOT NULL,
  "error_code" TEXT NOT NULL,
  "error_message" TEXT NOT NULL,
  "sanitized_payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_sync_errors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_activity_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID,
  "previous_data" JSONB,
  "new_data" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_directorates_code_key" ON "organization_directorates"("code");
CREATE UNIQUE INDEX "organization_divisions_code_key" ON "organization_divisions"("code");
CREATE UNIQUE INDEX "organization_departments_code_key" ON "organization_departments"("code");
CREATE UNIQUE INDEX "organization_positions_position_code_key" ON "organization_positions"("position_code");
CREATE UNIQUE INDEX "employee_profiles_employee_number_key" ON "employee_profiles"("employee_number");
CREATE UNIQUE INDEX "employee_profiles_corporate_email_key" ON "employee_profiles"("corporate_email");
CREATE UNIQUE INDEX "employee_performances_employee_year_key" ON "employee_performances"("employee_id","period_year");
CREATE UNIQUE INDEX "employee_potentials_employee_year_key" ON "employee_potentials"("employee_id","assessment_year");
CREATE UNIQUE INDEX "talent_skill_categories_code_key" ON "talent_skill_categories"("code");
CREATE UNIQUE INDEX "talent_skills_skill_code_key" ON "talent_skills"("skill_code");
CREATE UNIQUE INDEX "talent_position_skill_requirements_position_skill_key" ON "talent_position_skill_requirements"("position_id","skill_id","effective_from");
CREATE UNIQUE INDEX "talent_employee_skills_employee_skill_key" ON "talent_employee_skills"("employee_id","skill_id");
CREATE UNIQUE INDEX "hsect_safety_summaries_employee_year_key" ON "hsect_safety_summaries"("employee_id","period_year");
CREATE UNIQUE INDEX "learning_programs_code_key" ON "learning_programs"("code");
CREATE UNIQUE INDEX "retire_retirement_monitoring_employee_key" ON "retire_retirement_monitoring"("employee_id");

CREATE INDEX "employee_profiles_employee_number_idx" ON "employee_profiles"("employee_number");
CREATE INDEX "employee_profiles_full_name_idx" ON "employee_profiles"("full_name");
CREATE INDEX "employee_profiles_current_position_id_idx" ON "employee_profiles"("current_position_id");
CREATE INDEX "employee_profiles_current_department_id_idx" ON "employee_profiles"("current_department_id");
CREATE INDEX "employee_profiles_supervisor_employee_id_idx" ON "employee_profiles"("supervisor_employee_id");
CREATE INDEX "employee_profiles_employment_status_idx" ON "employee_profiles"("employment_status");
CREATE INDEX "employee_profiles_source_updated_at_idx" ON "employee_profiles"("source_updated_at");
CREATE INDEX "organization_positions_position_code_idx" ON "organization_positions"("position_code");
CREATE INDEX "talent_skills_skill_code_idx" ON "talent_skills"("skill_code");
CREATE INDEX "employee_career_histories_employee_id_idx" ON "employee_career_histories"("employee_id");
CREATE INDEX "employee_performances_employee_id_idx" ON "employee_performances"("employee_id");
CREATE INDEX "employee_performances_period_year_idx" ON "employee_performances"("period_year");
CREATE INDEX "employee_assessments_employee_id_idx" ON "employee_assessments"("employee_id");
CREATE INDEX "employee_potentials_employee_id_idx" ON "employee_potentials"("employee_id");
CREATE INDEX "hsect_mcu_records_employee_id_idx" ON "hsect_mcu_records"("employee_id");
CREATE INDEX "hsect_mcu_records_valid_until_idx" ON "hsect_mcu_records"("valid_until");
CREATE INDEX "hsect_mcu_records_source_updated_at_idx" ON "hsect_mcu_records"("source_updated_at");
CREATE INDEX "hsect_simper_records_employee_id_idx" ON "hsect_simper_records"("employee_id");
CREATE INDEX "hsect_simper_records_valid_until_idx" ON "hsect_simper_records"("valid_until");
CREATE INDEX "hsect_simper_records_source_updated_at_idx" ON "hsect_simper_records"("source_updated_at");
CREATE INDEX "hsect_employee_certifications_employee_id_idx" ON "hsect_employee_certifications"("employee_id");
CREATE INDEX "hsect_employee_certifications_valid_until_idx" ON "hsect_employee_certifications"("valid_until");
CREATE INDEX "hsect_employee_certifications_source_updated_at_idx" ON "hsect_employee_certifications"("source_updated_at");
CREATE INDEX "talent_position_skill_requirements_position_id_idx" ON "talent_position_skill_requirements"("position_id");
CREATE INDEX "talent_employee_skills_employee_id_idx" ON "talent_employee_skills"("employee_id");
CREATE INDEX "talent_promotion_cases_employee_id_idx" ON "talent_promotion_cases"("employee_id");
CREATE INDEX "talent_promotion_cases_case_status_idx" ON "talent_promotion_cases"("case_status");
CREATE INDEX "talent_mobility_cases_employee_id_idx" ON "talent_mobility_cases"("employee_id");
CREATE INDEX "talent_mobility_cases_case_status_idx" ON "talent_mobility_cases"("case_status");
CREATE INDEX "learning_employee_histories_employee_id_idx" ON "learning_employee_histories"("employee_id");
CREATE INDEX "retire_knowledge_transfer_plans_employee_id_idx" ON "retire_knowledge_transfer_plans"("employee_id");
CREATE INDEX "onboarding_programs_employee_id_idx" ON "onboarding_programs"("employee_id");
CREATE INDEX "onboarding_tasks_onboarding_program_id_idx" ON "onboarding_tasks"("onboarding_program_id");
CREATE INDEX "onboarding_coaching_sessions_employee_id_idx" ON "onboarding_coaching_sessions"("employee_id");
CREATE INDEX "integration_sync_errors_sync_run_id_idx" ON "integration_sync_errors"("sync_run_id");
CREATE INDEX "audit_activity_logs_user_id_idx" ON "audit_activity_logs"("user_id");
CREATE INDEX "audit_activity_logs_entity_type_entity_id_idx" ON "audit_activity_logs"("entity_type","entity_id");

ALTER TABLE "organization_divisions" ADD CONSTRAINT "organization_divisions_directorate_id_fkey" FOREIGN KEY ("directorate_id") REFERENCES "organization_directorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_departments" ADD CONSTRAINT "organization_departments_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "organization_divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_positions" ADD CONSTRAINT "organization_positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "organization_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_position_reporting_lines" ADD CONSTRAINT "organization_position_reporting_lines_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_position_reporting_lines" ADD CONSTRAINT "organization_position_reporting_lines_reports_to_position_id_fkey" FOREIGN KEY ("reports_to_position_id") REFERENCES "organization_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_current_position_id_fkey" FOREIGN KEY ("current_position_id") REFERENCES "organization_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_current_department_id_fkey" FOREIGN KEY ("current_department_id") REFERENCES "organization_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_supervisor_employee_id_fkey" FOREIGN KEY ("supervisor_employee_id") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_career_histories" ADD CONSTRAINT "employee_career_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_career_histories" ADD CONSTRAINT "employee_career_histories_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_career_histories" ADD CONSTRAINT "employee_career_histories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "organization_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_educations" ADD CONSTRAINT "employee_educations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_project_assignments" ADD CONSTRAINT "employee_project_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_performances" ADD CONSTRAINT "employee_performances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_assessments" ADD CONSTRAINT "employee_assessments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_potentials" ADD CONSTRAINT "employee_potentials_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_skills" ADD CONSTRAINT "talent_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "talent_skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_skill_level_definitions" ADD CONSTRAINT "talent_skill_level_definitions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "talent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "talent_position_skill_requirements" ADD CONSTRAINT "talent_position_skill_requirements_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_position_skill_requirements" ADD CONSTRAINT "talent_position_skill_requirements_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "talent_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_employee_skills" ADD CONSTRAINT "talent_employee_skills_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_employee_skills" ADD CONSTRAINT "talent_employee_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "talent_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_employee_skills" ADD CONSTRAINT "talent_employee_skills_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "talent_employee_skill_evidences" ADD CONSTRAINT "talent_employee_skill_evidences_employee_skill_id_fkey" FOREIGN KEY ("employee_skill_id") REFERENCES "talent_employee_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_employee_aspirations" ADD CONSTRAINT "talent_employee_aspirations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_employee_aspirations" ADD CONSTRAINT "talent_employee_aspirations_target_position_id_fkey" FOREIGN KEY ("target_position_id") REFERENCES "organization_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "talent_promotion_cases" ADD CONSTRAINT "talent_promotion_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_promotion_cases" ADD CONSTRAINT "talent_promotion_cases_current_position_id_fkey" FOREIGN KEY ("current_position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_promotion_cases" ADD CONSTRAINT "talent_promotion_cases_target_position_id_fkey" FOREIGN KEY ("target_position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_mobility_cases" ADD CONSTRAINT "talent_mobility_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_mobility_cases" ADD CONSTRAINT "talent_mobility_cases_source_position_id_fkey" FOREIGN KEY ("source_position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_mobility_cases" ADD CONSTRAINT "talent_mobility_cases_target_position_id_fkey" FOREIGN KEY ("target_position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_successor_pools" ADD CONSTRAINT "talent_successor_pools_target_position_id_fkey" FOREIGN KEY ("target_position_id") REFERENCES "organization_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "talent_successor_pools" ADD CONSTRAINT "talent_successor_pools_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hsect_mcu_records" ADD CONSTRAINT "hsect_mcu_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hsect_simper_records" ADD CONSTRAINT "hsect_simper_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hsect_employee_certifications" ADD CONSTRAINT "hsect_employee_certifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hsect_employee_certifications" ADD CONSTRAINT "hsect_employee_certifications_related_skill_id_fkey" FOREIGN KEY ("related_skill_id") REFERENCES "talent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hsect_safety_summaries" ADD CONSTRAINT "hsect_safety_summaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning_employee_histories" ADD CONSTRAINT "learning_employee_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning_employee_histories" ADD CONSTRAINT "learning_employee_histories_learning_program_id_fkey" FOREIGN KEY ("learning_program_id") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning_employee_histories" ADD CONSTRAINT "learning_employee_histories_related_skill_id_fkey" FOREIGN KEY ("related_skill_id") REFERENCES "talent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "retire_retirement_monitoring" ADD CONSTRAINT "retire_retirement_monitoring_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "retire_knowledge_transfer_plans" ADD CONSTRAINT "retire_knowledge_transfer_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "retire_knowledge_transfer_plans" ADD CONSTRAINT "retire_knowledge_transfer_plans_successor_employee_id_fkey" FOREIGN KEY ("successor_employee_id") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "onboarding_programs" ADD CONSTRAINT "onboarding_programs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_onboarding_program_id_fkey" FOREIGN KEY ("onboarding_program_id") REFERENCES "onboarding_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_coaching_sessions" ADD CONSTRAINT "onboarding_coaching_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_coaching_sessions" ADD CONSTRAINT "onboarding_coaching_sessions_coach_employee_id_fkey" FOREIGN KEY ("coach_employee_id") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_sync_errors" ADD CONSTRAINT "integration_sync_errors_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "integration_sync_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
