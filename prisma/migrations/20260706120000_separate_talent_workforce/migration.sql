ALTER TABLE "Profile"
ADD COLUMN "workforceStage" TEXT NOT NULL DEFAULT 'PROBATION',
ADD COLUMN "talentData" JSONB;

CREATE INDEX "Profile_workforceStage_idx" ON "Profile"("workforceStage");
