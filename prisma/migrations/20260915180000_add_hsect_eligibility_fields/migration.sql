-- Eligibility fields returned by the HSE employee endpoints. MCU and SIMPER
-- do not originate in BigQuery and must stay attached to the verified SID link.
ALTER TABLE "hr_hsect_employee_links"
  ADD COLUMN IF NOT EXISTS "mcu_status" TEXT,
  ADD COLUMN IF NOT EXISTS "mcu_description" TEXT,
  ADD COLUMN IF NOT EXISTS "simper_status" TEXT,
  ADD COLUMN IF NOT EXISTS "simper_summary" TEXT;

DROP VIEW IF EXISTS "hr_employee_360_view";

CREATE VIEW "hr_employee_360_view" AS
SELECT
  e.id,
  e.personnel_number,
  e.global_personnel_number,
  e.employee_name,
  e.office_email,
  e.join_date,
  s.company,
  s.business_unit,
  s.direktorat,
  s.divisi,
  s.department,
  s.position_name,
  s.ps_level,
  s.layer,
  s.work_contract,
  s.end_of_contract,
  s.supervisor_name,
  t.talent_year,
  t.performance_category,
  t.potential_grow_category,
  t.talent_class_9_box,
  t.talent_class_12_box,
  t.last_promotion_date,
  t.aspiration,
  t.project_involvement,
  h.sid AS hsect_sid,
  h.mcu_status AS hsect_mcu_status,
  h.mcu_description AS hsect_mcu_description,
  h.simper_status AS hsect_simper_status,
  h.simper_summary AS hsect_simper_summary,
  COALESCE(d.document_count, 0)::INTEGER AS hsect_document_count,
  COALESCE(d.expiring_document_count, 0)::INTEGER AS hsect_expiring_document_count
FROM "hr_employee_profiles" e
LEFT JOIN LATERAL (
  SELECT * FROM "hr_employee_employment_snapshots" s
  WHERE s.employee_id = e.id
  ORDER BY s.data_period DESC
  LIMIT 1
) s ON TRUE
LEFT JOIN LATERAL (
  SELECT * FROM "hr_employee_talent_profiles" t
  WHERE t.employee_id = e.id
  ORDER BY t.talent_year DESC
  LIMIT 1
) t ON TRUE
LEFT JOIN "hr_hsect_employee_links" h ON h.employee_id = e.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS document_count,
         COUNT(*) FILTER (WHERE expires_at >= CURRENT_DATE AND expires_at < CURRENT_DATE + INTERVAL '90 days') AS expiring_document_count
  FROM "hr_hsect_document_records" d
  WHERE d.employee_id = e.id
) d ON TRUE;
