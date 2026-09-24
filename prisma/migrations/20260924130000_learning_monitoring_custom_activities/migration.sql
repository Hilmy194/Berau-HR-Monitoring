ALTER TABLE "learning_monitoring"
ADD COLUMN "activity_key" TEXT;

UPDATE "learning_monitoring"
SET "activity_key" = "activity_type";

ALTER TABLE "learning_monitoring"
ALTER COLUMN "activity_key" SET NOT NULL;

ALTER TABLE "learning_monitoring"
DROP CONSTRAINT IF EXISTS "learning_monitoring_employee_activity_key";

DROP INDEX IF EXISTS "learning_monitoring_employee_activity_key";

CREATE UNIQUE INDEX "learning_monitoring_employee_activity_key"
ON "learning_monitoring"("employee_personnel_number", "activity_key");
