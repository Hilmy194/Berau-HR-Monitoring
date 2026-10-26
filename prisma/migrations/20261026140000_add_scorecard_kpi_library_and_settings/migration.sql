-- CreateTable
CREATE TABLE IF NOT EXISTS "scorecard_kpi_libraries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "strategy_pillar" TEXT,
    "goal_name" TEXT NOT NULL,
    "goal_description" TEXT,
    "review_period" TEXT,
    "uom" TEXT,
    "target" TEXT,
    "weight" DECIMAL(6,2),
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "parent_group_name" TEXT,
    "program" TEXT NOT NULL DEFAULT 'Individu',
    "polarity" TEXT,
    "levels" JSONB NOT NULL,
    "source_system" TEXT NOT NULL DEFAULT 'GOAL_SETTING_BC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scorecard_kpi_libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employee_scorecard_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" TEXT NOT NULL,
    "employee_name" TEXT,
    "org_unit" TEXT,
    "supervisor_name" TEXT,
    "program" TEXT NOT NULL DEFAULT 'Individu',
    "strategy_pillar" TEXT,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "parent_group_name" TEXT,
    "goal_name" TEXT NOT NULL,
    "goal_description" TEXT,
    "review_period" TEXT,
    "uom" TEXT,
    "target" TEXT,
    "weight" DECIMAL(6,2),
    "levels" JSONB NOT NULL,
    "status" TEXT,
    "kpi_score" DECIMAL(6,4),
    "scorecard_score" DECIMAL(6,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_scorecard_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scorecard_kpi_libraries_strategy_pillar_idx" ON "scorecard_kpi_libraries"("strategy_pillar");
CREATE INDEX IF NOT EXISTS "scorecard_kpi_libraries_goal_name_idx" ON "scorecard_kpi_libraries"("goal_name");
CREATE INDEX IF NOT EXISTS "scorecard_kpi_libraries_program_idx" ON "scorecard_kpi_libraries"("program");
CREATE INDEX IF NOT EXISTS "scorecard_kpi_libraries_review_period_idx" ON "scorecard_kpi_libraries"("review_period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employee_scorecard_settings_employee_id_idx" ON "employee_scorecard_settings"("employee_id");
CREATE INDEX IF NOT EXISTS "employee_scorecard_settings_org_unit_idx" ON "employee_scorecard_settings"("org_unit");
CREATE INDEX IF NOT EXISTS "employee_scorecard_settings_program_idx" ON "employee_scorecard_settings"("program");
CREATE INDEX IF NOT EXISTS "employee_scorecard_settings_status_idx" ON "employee_scorecard_settings"("status");
