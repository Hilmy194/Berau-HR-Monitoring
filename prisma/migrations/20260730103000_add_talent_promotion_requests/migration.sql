CREATE TABLE IF NOT EXISTS "talent_promotion_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" TEXT NOT NULL,
  "employee_name" TEXT NOT NULL,
  "employee_status" TEXT,
  "company_name" TEXT,
  "business_area" TEXT,
  "personnel_area" TEXT,
  "personnel_subarea" TEXT,
  "position_code" TEXT,
  "position_name" TEXT NOT NULL,
  "business_unit" TEXT,
  "business_unit_name" TEXT,
  "directorate_code" TEXT,
  "directorate_name" TEXT,
  "division_code" TEXT,
  "division_name" TEXT,
  "department_code" TEXT,
  "department_name" TEXT,
  "talent_class" TEXT,
  "eligibility_status" TEXT,
  "year_of_service" DECIMAL(8, 2),
  "year_of_service_position" DECIMAL(8, 2),
  "join_date" DATE,
  "last_promotion_date" DATE,
  "promotion_plan" TEXT,
  "promotion_plan_desc" TEXT,
  "justification" TEXT,
  "project_assignment" TEXT,
  "promotion_status" TEXT NOT NULL,
  "next_status" TEXT,
  "pic_id" TEXT,
  "pic_name" TEXT,
  "pic_type" TEXT,
  "changed_by" TEXT,
  "changed_by_name" TEXT,
  "changed_on" DATE,
  "source_file" TEXT,
  "source_sheet" TEXT,
  "imported_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "talent_promotion_requests_employee_position_source_key"
  ON "talent_promotion_requests"("employee_id", "position_name", "source_file");

CREATE INDEX IF NOT EXISTS "talent_promotion_requests_promotion_status_idx"
  ON "talent_promotion_requests"("promotion_status");

CREATE INDEX IF NOT EXISTS "talent_promotion_requests_employee_name_idx"
  ON "talent_promotion_requests"("employee_name");

CREATE INDEX IF NOT EXISTS "talent_promotion_requests_position_name_idx"
  ON "talent_promotion_requests"("position_name");
