-- CreateTable
CREATE TABLE IF NOT EXISTS "career_options" (
    "id" TEXT NOT NULL,
    "employee_nik" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "current_position" TEXT NOT NULL,
    "current_ps_level" TEXT,
    "current_layer" TEXT,
    "current_job_family" TEXT,
    "current_directorate" TEXT,
    "current_division" TEXT,
    "current_department" TEXT,
    "target_position_id" TEXT,
    "target_position" TEXT NOT NULL,
    "target_ps_level" TEXT,
    "target_layer" TEXT,
    "target_job_family" TEXT,
    "target_job_grouping" TEXT,
    "target_value_chain" TEXT,
    "is_critical_position" BOOLEAN NOT NULL DEFAULT false,
    "target_directorate" TEXT,
    "target_division" TEXT,
    "target_department" TEXT,
    "path_stage" TEXT NOT NULL,
    "transition_type" TEXT NOT NULL,
    "priority_rank" INTEGER NOT NULL DEFAULT 1,
    "match_score" INTEGER NOT NULL,
    "estimated_readiness" TEXT NOT NULL,
    "matched_competencies" JSONB NOT NULL DEFAULT '[]',
    "priority_gaps" JSONB NOT NULL DEFAULT '[]',
    "competency_gaps" JSONB NOT NULL DEFAULT '[]',
    "path_rationale" TEXT NOT NULL,
    "development_need" TEXT NOT NULL,
    "recommendation_note" TEXT NOT NULL,
    "ai_analysis_id" TEXT,
    "data_period" TEXT,
    "source_system" TEXT NOT NULL DEFAULT 'BIGQUERY_RAW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "career_options_employee_nik_target_position_key" ON "career_options"("employee_nik", "target_position");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_employee_nik_idx" ON "career_options"("employee_nik");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_target_position_idx" ON "career_options"("target_position");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_target_position_id_idx" ON "career_options"("target_position_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_path_stage_idx" ON "career_options"("path_stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_target_division_idx" ON "career_options"("target_division");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_options_is_active_idx" ON "career_options"("is_active");
