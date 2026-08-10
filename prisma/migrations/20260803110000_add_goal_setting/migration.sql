CREATE TABLE "goal_cycles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_id" TEXT NOT NULL,
  "cycle_name" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "source_system" TEXT NOT NULL,
  "last_synced_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goal_cycles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_goals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "manager_id" TEXT,
  "cycle_id" UUID NOT NULL,
  "goal_title" TEXT NOT NULL,
  "goal_description" TEXT,
  "goal_category" TEXT,
  "organization_objective" TEXT,
  "department_objective" TEXT,
  "target_value" DECIMAL(12,2),
  "actual_value" DECIMAL(12,2),
  "unit_of_measurement" TEXT,
  "achievement_percentage" DECIMAL(6,2),
  "weight" DECIMAL(6,2),
  "priority" TEXT,
  "status" TEXT NOT NULL,
  "start_date" DATE,
  "due_date" DATE,
  "completion_date" DATE,
  "specific_status" BOOLEAN,
  "measurable_status" BOOLEAN,
  "achievable_status" BOOLEAN,
  "relevant_status" BOOLEAN,
  "time_bound_status" BOOLEAN,
  "smart_percentage" DECIMAL(6,2),
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goal_progress_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_goal_id" UUID NOT NULL,
  "progress_date" DATE NOT NULL,
  "previous_actual_value" DECIMAL(12,2),
  "updated_actual_value" DECIMAL(12,2),
  "previous_achievement" DECIMAL(6,2),
  "updated_achievement" DECIMAL(6,2),
  "progress_description" TEXT,
  "updated_by" TEXT,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goal_progress_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goal_sync_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_system" TEXT NOT NULL,
  "sync_type" TEXT NOT NULL,
  "sync_started_at" TIMESTAMP(3) NOT NULL,
  "sync_finished_at" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "records_received" INTEGER NOT NULL DEFAULT 0,
  "records_inserted" INTEGER NOT NULL DEFAULT 0,
  "records_updated" INTEGER NOT NULL DEFAULT 0,
  "records_failed" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goal_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "goal_cycles_external_id_source_system_key" ON "goal_cycles"("external_id", "source_system");
CREATE UNIQUE INDEX "employee_goals_external_id_source_system_key" ON "employee_goals"("external_id", "source_system");
CREATE INDEX "goal_cycles_status_idx" ON "goal_cycles"("status");
CREATE INDEX "employee_goals_employee_id_idx" ON "employee_goals"("employee_id");
CREATE INDEX "employee_goals_manager_id_idx" ON "employee_goals"("manager_id");
CREATE INDEX "employee_goals_cycle_id_idx" ON "employee_goals"("cycle_id");
CREATE INDEX "employee_goals_status_idx" ON "employee_goals"("status");
CREATE INDEX "goal_progress_history_employee_goal_id_idx" ON "goal_progress_history"("employee_goal_id");
CREATE INDEX "goal_progress_history_progress_date_idx" ON "goal_progress_history"("progress_date");
CREATE INDEX "goal_sync_logs_source_system_idx" ON "goal_sync_logs"("source_system");
CREATE INDEX "goal_sync_logs_status_idx" ON "goal_sync_logs"("status");

ALTER TABLE "employee_goals" ADD CONSTRAINT "employee_goals_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "goal_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goal_progress_history" ADD CONSTRAINT "goal_progress_history_employee_goal_id_fkey" FOREIGN KEY ("employee_goal_id") REFERENCES "employee_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "employee_pat_assessments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "employee_name" TEXT NOT NULL,
  "assessment_year" INTEGER NOT NULL,
  "pat_name" TEXT NOT NULL,
  "cycle_name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "final_score" DECIMAL(6,2),
  "performance_rating" TEXT,
  "dynamic_fields" JSONB NOT NULL,
  "feedback_360" JSONB NOT NULL,
  "source_system" TEXT NOT NULL,
  "source_updated_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_pat_assessments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_pat_assessments_external_id_source_system_key" ON "employee_pat_assessments"("external_id", "source_system");
CREATE INDEX "employee_pat_assessments_employee_id_idx" ON "employee_pat_assessments"("employee_id");
CREATE INDEX "employee_pat_assessments_assessment_year_idx" ON "employee_pat_assessments"("assessment_year");
CREATE INDEX "employee_pat_assessments_status_idx" ON "employee_pat_assessments"("status");
