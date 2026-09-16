-- Reconciliation queue for HSE employees that cannot be matched to the
-- current BigQuery p_emps master by exact personnel_number.
CREATE TABLE IF NOT EXISTS "hr_hsect_employee_reconciliation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sid" TEXT NOT NULL,
  "personnel_number" TEXT,
  "hsect_employee_id" TEXT,
  "company_id" TEXT,
  "reason" TEXT NOT NULL,
  "is_resolved" BOOLEAN NOT NULL DEFAULT false,
  "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source_updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "hr_hsect_employee_reconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_hsect_employee_reconciliation_sid_key" UNIQUE ("sid")
);

CREATE INDEX IF NOT EXISTS "hr_hsect_employee_reconciliation_status_idx"
  ON "hr_hsect_employee_reconciliation"("is_resolved", "reason");
