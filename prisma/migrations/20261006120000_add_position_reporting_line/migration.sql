ALTER TABLE "organization_positions"
  ADD COLUMN IF NOT EXISTS "holder_personnel_number" TEXT,
  ADD COLUMN IF NOT EXISTS "reports_to_id" UUID,
  ADD COLUMN IF NOT EXISTS "external_supervisor" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_positions_reports_to_id_fkey'
  ) THEN
    ALTER TABLE "organization_positions"
      ADD CONSTRAINT "organization_positions_reports_to_id_fkey"
      FOREIGN KEY ("reports_to_id") REFERENCES "organization_positions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "organization_positions_reports_to_id_idx" ON "organization_positions"("reports_to_id");
