-- CreateTable
CREATE TABLE IF NOT EXISTS "development_program_cadence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL,
    "category_label" TEXT NOT NULL,
    "start_date_display" TEXT NOT NULL,
    "end_date_display" TEXT NOT NULL,
    "start_iso" TEXT NOT NULL,
    "end_iso" TEXT NOT NULL,
    "pax" INTEGER,
    "remarks" TEXT,
    "target_audience" TEXT,
    "vendor_or_provider" TEXT,
    "budget_code" TEXT,
    "estimated_cost" DECIMAL(15,2),
    "active_months" TEXT[],
    "color_tone" TEXT NOT NULL DEFAULT 'emerald',
    "stem_type" TEXT,
    "training_type" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "development_program_cadence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "training_catalog" (
    "id" TEXT NOT NULL,
    "training_title" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "stem_type" TEXT NOT NULL,
    "training_type" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "flight_cost" DECIMAL(15,2) DEFAULT 0,
    "hotel_cost" DECIMAL(15,2) DEFAULT 0,
    "upd_cost" DECIMAL(15,2) DEFAULT 0,
    "transport_cost" DECIMAL(15,2) DEFAULT 0,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "budget_code" TEXT NOT NULL,
    "schedule_date" TEXT NOT NULL,
    "pre_assessment_required" TEXT NOT NULL,
    "target_audience" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_training_requests" (
    "id" TEXT NOT NULL,
    "employee_personnel_number" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "catalog_item_id" TEXT,
    "training_title" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "stem_type" TEXT NOT NULL,
    "training_type" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "budget_code" TEXT NOT NULL,
    "schedule_date" TEXT NOT NULL,
    "pre_assessment_required" TEXT NOT NULL,
    "pre_assessment_notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'EMPLOYEE_INITIATED',
    "status" TEXT NOT NULL DEFAULT 'PENDING_LEADER_APPROVAL',
    "leader_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_training_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "succession_targets" (
    "id" TEXT NOT NULL,
    "incumbent_name" TEXT NOT NULL,
    "incumbent_nik" TEXT,
    "position_title" TEXT NOT NULL,
    "position_code" TEXT,
    "golongan" TEXT,
    "directorate" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CRITICAL_POSITION',
    "period_year" INTEGER NOT NULL DEFAULT 2026,
    "is_current_period" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "succession_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "succession_candidates" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nik" TEXT,
    "current_position" TEXT,
    "golongan" TEXT,
    "department" TEXT,
    "division" TEXT,
    "readiness" TEXT NOT NULL DEFAULT 'READY_LATER',
    "source" TEXT NOT NULL DEFAULT 'INTERNAL_SUBDIV',
    "priority_order" INTEGER NOT NULL DEFAULT 1,
    "period_year" INTEGER NOT NULL DEFAULT 2026,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nominated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nominated_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "succession_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "succession_candidate_history" (
    "id" TEXT NOT NULL,
    "target_id" TEXT,
    "candidate_id" TEXT,
    "candidate_nik" TEXT,
    "candidate_name" TEXT NOT NULL,
    "target_position" TEXT NOT NULL,
    "target_incumbent" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "period_year" INTEGER NOT NULL,
    "previous_readiness" TEXT,
    "new_readiness" TEXT,
    "previous_position" TEXT,
    "new_position" TEXT,
    "previous_department" TEXT,
    "new_department" TEXT,
    "previous_priority" INTEGER,
    "new_priority" INTEGER,
    "performed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "succession_candidate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "position_certification_requirements" (
    "id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "category_number" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "work_permit_position" TEXT NOT NULL,
    "employee_identity" TEXT,
    "license" TEXT,
    "internal_certificates" TEXT,
    "external_certificates" TEXT,
    "health_requirement" TEXT,
    "location" TEXT,
    "document_number" TEXT NOT NULL DEFAULT 'S-HCT-04.01',
    "page_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_certification_requirements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "development_program_cadence_category_idx" ON "development_program_cadence"("category");
CREATE INDEX IF NOT EXISTS "development_program_cadence_start_iso_idx" ON "development_program_cadence"("start_iso");
CREATE INDEX IF NOT EXISTS "development_program_cadence_end_iso_idx" ON "development_program_cadence"("end_iso");
CREATE INDEX IF NOT EXISTS "training_catalog_stem_type_idx" ON "training_catalog"("stem_type");
CREATE INDEX IF NOT EXISTS "training_catalog_skill_idx" ON "training_catalog"("skill");
CREATE INDEX IF NOT EXISTS "employee_training_requests_employee_personnel_number_idx" ON "employee_training_requests"("employee_personnel_number");
CREATE INDEX IF NOT EXISTS "employee_training_requests_status_idx" ON "employee_training_requests"("status");
CREATE INDEX IF NOT EXISTS "succession_targets_position_title_idx" ON "succession_targets"("position_title");
CREATE INDEX IF NOT EXISTS "succession_targets_incumbent_nik_idx" ON "succession_targets"("incumbent_nik");
CREATE INDEX IF NOT EXISTS "succession_targets_period_year_idx" ON "succession_targets"("period_year");
CREATE INDEX IF NOT EXISTS "succession_candidates_target_id_idx" ON "succession_candidates"("target_id");
CREATE INDEX IF NOT EXISTS "succession_candidates_nik_idx" ON "succession_candidates"("nik");
CREATE INDEX IF NOT EXISTS "succession_candidates_readiness_idx" ON "succession_candidates"("readiness");
CREATE INDEX IF NOT EXISTS "succession_candidates_period_year_idx" ON "succession_candidates"("period_year");
CREATE INDEX IF NOT EXISTS "succession_candidate_history_candidate_nik_idx" ON "succession_candidate_history"("candidate_nik");
CREATE INDEX IF NOT EXISTS "succession_candidate_history_target_id_idx" ON "succession_candidate_history"("target_id");
CREATE INDEX IF NOT EXISTS "succession_candidate_history_action_type_idx" ON "succession_candidate_history"("action_type");
CREATE INDEX IF NOT EXISTS "succession_candidate_history_period_year_idx" ON "succession_candidate_history"("period_year");
CREATE INDEX IF NOT EXISTS "position_certification_requirements_category_number_idx" ON "position_certification_requirements"("category_number");
CREATE INDEX IF NOT EXISTS "position_certification_requirements_work_permit_position_idx" ON "position_certification_requirements"("work_permit_position");
CREATE INDEX IF NOT EXISTS "position_certification_requirements_page_number_idx" ON "position_certification_requirements"("page_number");

DO $$ BEGIN
  ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "succession_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "succession_candidate_history" ADD CONSTRAINT "succession_candidate_history_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "succession_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "succession_candidate_history" ADD CONSTRAINT "succession_candidate_history_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "succession_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
