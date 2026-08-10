ALTER TABLE "organization_positions"
  ADD COLUMN IF NOT EXISTS "current_holder" TEXT;

CREATE INDEX IF NOT EXISTS "organization_positions_current_holder_idx" ON "organization_positions"("current_holder");
