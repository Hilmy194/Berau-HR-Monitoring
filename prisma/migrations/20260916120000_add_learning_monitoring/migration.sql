CREATE TABLE IF NOT EXISTS "learning_monitoring" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_personnel_number" TEXT NOT NULL,
  "activity_type" TEXT NOT NULL,
  "target_position" TEXT,
  "skill_improvement" TEXT NOT NULL,
  "program_name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "timeline" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "success_criteria" TEXT NOT NULL,
  "notes" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_monitoring_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_monitoring_employee_activity_key" UNIQUE ("employee_personnel_number", "activity_type"),
  CONSTRAINT "learning_monitoring_activity_type_check" CHECK ("activity_type" IN ('EXPERIENCE_70', 'SOCIAL_20', 'FORMAL_10')),
  CONSTRAINT "learning_monitoring_status_check" CHECK ("status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
  CONSTRAINT "learning_monitoring_version_check" CHECK ("version" > 0)
);

CREATE INDEX IF NOT EXISTS "learning_monitoring_status_idx" ON "learning_monitoring"("status");
CREATE INDEX IF NOT EXISTS "learning_monitoring_updated_at_idx" ON "learning_monitoring"("updated_at");
