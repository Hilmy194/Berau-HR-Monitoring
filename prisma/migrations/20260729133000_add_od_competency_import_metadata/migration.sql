ALTER TABLE "organization_positions"
  ADD COLUMN IF NOT EXISTS "source_file" TEXT,
  ADD COLUMN IF NOT EXISTS "source_sheet" TEXT,
  ADD COLUMN IF NOT EXISTS "imported_at" TIMESTAMPTZ;

ALTER TABLE "talent_skills"
  ADD COLUMN IF NOT EXISTS "source_file" TEXT,
  ADD COLUMN IF NOT EXISTS "imported_at" TIMESTAMPTZ;

ALTER TABLE "talent_skill_level_definitions"
  ADD COLUMN IF NOT EXISTS "behavior_indicators" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "talent_position_skill_requirements"
  ADD COLUMN IF NOT EXISTS "source_file" TEXT,
  ADD COLUMN IF NOT EXISTS "source_sheet" TEXT,
  ADD COLUMN IF NOT EXISTS "imported_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "organization_positions_source_file_idx" ON "organization_positions"("source_file");
CREATE INDEX IF NOT EXISTS "talent_skills_source_file_idx" ON "talent_skills"("source_file");
CREATE UNIQUE INDEX IF NOT EXISTS "talent_skill_level_definitions_skill_id_level_key" ON "talent_skill_level_definitions"("skill_id", "level");
