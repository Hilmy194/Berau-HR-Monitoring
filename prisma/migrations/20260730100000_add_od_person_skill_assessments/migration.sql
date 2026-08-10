CREATE TABLE IF NOT EXISTS "talent_person_skill_assessments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "skill_id" UUID NOT NULL,
  "employee_code" TEXT,
  "employee_name" TEXT NOT NULL,
  "position_name" TEXT NOT NULL,
  "position_group" TEXT,
  "current_level" INTEGER NOT NULL,
  "source_file" TEXT NOT NULL,
  "source_sheet" TEXT NOT NULL,
  "imported_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_person_skill_assessments_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "talent_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "talent_person_skill_assessments_person_skill_key"
  ON "talent_person_skill_assessments"("employee_name", "position_name", "skill_id", "source_file", "source_sheet");

CREATE INDEX IF NOT EXISTS "talent_person_skill_assessments_employee_name_idx"
  ON "talent_person_skill_assessments"("employee_name");

CREATE INDEX IF NOT EXISTS "talent_person_skill_assessments_position_name_idx"
  ON "talent_person_skill_assessments"("position_name");

CREATE INDEX IF NOT EXISTS "talent_person_skill_assessments_skill_id_idx"
  ON "talent_person_skill_assessments"("skill_id");
