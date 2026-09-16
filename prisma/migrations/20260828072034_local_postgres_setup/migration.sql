/*
  Warnings:

  - You are about to drop the `audit_activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_assessments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_career_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_educations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_performances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_potentials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_project_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hsect_employee_certifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hsect_mcu_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hsect_safety_summaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hsect_simper_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integration_sync_errors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integration_sync_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `learning_employee_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `learning_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_coaching_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_position_reporting_lines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `retire_knowledge_transfer_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `retire_retirement_monitoring` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_employee_aspirations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_employee_skill_evidences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_employee_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_mobility_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_promotion_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talent_successor_pools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee_assessments" DROP CONSTRAINT "employee_assessments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_career_histories" DROP CONSTRAINT "employee_career_histories_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_career_histories" DROP CONSTRAINT "employee_career_histories_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_career_histories" DROP CONSTRAINT "employee_career_histories_position_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_educations" DROP CONSTRAINT "employee_educations_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_performances" DROP CONSTRAINT "employee_performances_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_potentials" DROP CONSTRAINT "employee_potentials_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_current_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_current_position_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_supervisor_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_project_assignments" DROP CONSTRAINT "employee_project_assignments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hsect_employee_certifications" DROP CONSTRAINT "hsect_employee_certifications_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hsect_employee_certifications" DROP CONSTRAINT "hsect_employee_certifications_related_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "hsect_mcu_records" DROP CONSTRAINT "hsect_mcu_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hsect_safety_summaries" DROP CONSTRAINT "hsect_safety_summaries_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "hsect_simper_records" DROP CONSTRAINT "hsect_simper_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "integration_sync_errors" DROP CONSTRAINT "integration_sync_errors_sync_run_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_employee_histories" DROP CONSTRAINT "learning_employee_histories_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_employee_histories" DROP CONSTRAINT "learning_employee_histories_learning_program_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_employee_histories" DROP CONSTRAINT "learning_employee_histories_related_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_coaching_sessions" DROP CONSTRAINT "onboarding_coaching_sessions_coach_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_coaching_sessions" DROP CONSTRAINT "onboarding_coaching_sessions_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_programs" DROP CONSTRAINT "onboarding_programs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "onboarding_tasks_onboarding_program_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_position_reporting_lines" DROP CONSTRAINT "organization_position_reporting_lines_position_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_position_reporting_lines" DROP CONSTRAINT "organization_position_reporting_lines_reports_to_position_id_fk";

-- DropForeignKey
ALTER TABLE "retire_knowledge_transfer_plans" DROP CONSTRAINT "retire_knowledge_transfer_plans_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "retire_knowledge_transfer_plans" DROP CONSTRAINT "retire_knowledge_transfer_plans_successor_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "retire_retirement_monitoring" DROP CONSTRAINT "retire_retirement_monitoring_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_aspirations" DROP CONSTRAINT "talent_employee_aspirations_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_aspirations" DROP CONSTRAINT "talent_employee_aspirations_target_position_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_skill_evidences" DROP CONSTRAINT "talent_employee_skill_evidences_employee_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_skills" DROP CONSTRAINT "talent_employee_skills_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_skills" DROP CONSTRAINT "talent_employee_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_employee_skills" DROP CONSTRAINT "talent_employee_skills_validated_by_fkey";

-- DropForeignKey
ALTER TABLE "talent_mobility_cases" DROP CONSTRAINT "talent_mobility_cases_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_mobility_cases" DROP CONSTRAINT "talent_mobility_cases_source_position_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_mobility_cases" DROP CONSTRAINT "talent_mobility_cases_target_position_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_promotion_cases" DROP CONSTRAINT "talent_promotion_cases_current_position_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_promotion_cases" DROP CONSTRAINT "talent_promotion_cases_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_promotion_cases" DROP CONSTRAINT "talent_promotion_cases_target_position_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_successor_pools" DROP CONSTRAINT "talent_successor_pools_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "talent_successor_pools" DROP CONSTRAINT "talent_successor_pools_target_position_id_fkey";

-- DropIndex
DROP INDEX "organization_positions_current_holder_idx";

-- DropIndex
DROP INDEX "organization_positions_source_file_idx";

-- DropIndex
DROP INDEX "talent_skills_source_file_idx";

-- AlterTable
ALTER TABLE "organization_departments" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organization_directorates" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organization_divisions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organization_positions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "imported_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "talent_ai_analyses" ALTER COLUMN "generatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "talent_position_skill_requirements" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "imported_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "talent_skill_categories" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "talent_skill_level_definitions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "talent_skills" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "imported_at" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "audit_activity_logs";

-- DropTable
DROP TABLE "employee_assessments";

-- DropTable
DROP TABLE "employee_career_histories";

-- DropTable
DROP TABLE "employee_educations";

-- DropTable
DROP TABLE "employee_performances";

-- DropTable
DROP TABLE "employee_potentials";

-- DropTable
DROP TABLE "employee_profiles";

-- DropTable
DROP TABLE "employee_project_assignments";

-- DropTable
DROP TABLE "hsect_employee_certifications";

-- DropTable
DROP TABLE "hsect_mcu_records";

-- DropTable
DROP TABLE "hsect_safety_summaries";

-- DropTable
DROP TABLE "hsect_simper_records";

-- DropTable
DROP TABLE "integration_sync_errors";

-- DropTable
DROP TABLE "integration_sync_runs";

-- DropTable
DROP TABLE "learning_employee_histories";

-- DropTable
DROP TABLE "learning_programs";

-- DropTable
DROP TABLE "onboarding_coaching_sessions";

-- DropTable
DROP TABLE "onboarding_programs";

-- DropTable
DROP TABLE "onboarding_tasks";

-- DropTable
DROP TABLE "organization_position_reporting_lines";

-- DropTable
DROP TABLE "retire_knowledge_transfer_plans";

-- DropTable
DROP TABLE "retire_retirement_monitoring";

-- DropTable
DROP TABLE "talent_employee_aspirations";

-- DropTable
DROP TABLE "talent_employee_skill_evidences";

-- DropTable
DROP TABLE "talent_employee_skills";

-- DropTable
DROP TABLE "talent_mobility_cases";

-- DropTable
DROP TABLE "talent_promotion_cases";

-- DropTable
DROP TABLE "talent_successor_pools";

-- CreateIndex
CREATE INDEX "organization_positions_department_id_idx" ON "organization_positions"("department_id");

-- CreateIndex
CREATE INDEX "talent_position_skill_requirements_skill_id_idx" ON "talent_position_skill_requirements"("skill_id");

-- RenameIndex
ALTER INDEX "talent_ai_analyses_type_hash_status_key" RENAME TO "talent_ai_analyses_analysisType_inputHash_status_key";
