CREATE TABLE "talent_ai_analyses" (
  "id" TEXT NOT NULL,
  "analysisType" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "employeeId" TEXT,
  "targetPosition" TEXT,
  "selectedCandidates" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "dataVersion" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "sanitizedContext" JSONB NOT NULL,
  "structuredResult" JSONB,
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewerId" TEXT,
  "reviewerNotes" TEXT,
  "sanitizedError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "talent_ai_analyses_type_hash_status_key" ON "talent_ai_analyses"("analysisType", "inputHash", "status");
CREATE INDEX "talent_ai_analyses_analysisType_idx" ON "talent_ai_analyses"("analysisType");
CREATE INDEX "talent_ai_analyses_employeeId_idx" ON "talent_ai_analyses"("employeeId");
CREATE INDEX "talent_ai_analyses_targetPosition_idx" ON "talent_ai_analyses"("targetPosition");
CREATE INDEX "talent_ai_analyses_reviewStatus_idx" ON "talent_ai_analyses"("reviewStatus");
