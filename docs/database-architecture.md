# Arsitektur Database HR Monitoring

## Stack

Aplikasi menggunakan Next.js 15, TypeScript, NextAuth, PostgreSQL, dan Prisma. Prisma sudah ada di repository, sehingga operational database HR Monitoring dibuat melalui migration SQL Prisma dan script seed/sync berbasis Prisma Client.

## Keputusan schema

Implementasi memakai prefix tabel, bukan PostgreSQL schema terpisah. Alasannya: repo sudah memakai satu datasource Prisma tanpa fitur multiSchema, dan prefix tabel lebih sederhana untuk migration, deployment Supabase/PostgreSQL pooler, serta tidak mengganggu model UI lama seperti `User`, `Profile`, `ProbationTask`, dan `Presentation`.

Prefix domain:

- `organization_*`
- `employee_*`
- `talent_*`
- `hsect_*`
- `learning_*`
- `retire_*`
- `onboarding_*`
- `integration_*`
- `audit_*`

Semua tabel operasional memakai UUID primary key, foreign key, index, `created_at`, `updated_at`, dan field provenance source pada tabel yang menerima data dari mock BigQuery/HSECT.

## Domain

Organization Development menyimpan directorate, division, department, position, dan reporting line.

Employee menyimpan profile master, career history, education, project assignment, performance, assessment, dan potential. Business key utama adalah `employee_number`; foreign key tetap memakai UUID.

Talent menyimpan skill category, skill, level definition, requirement posisi, employee skill, evidence, aspiration, promotion case, mobility case, dan successor pool.

HSECT menyimpan MCU, SIMPER, certification, dan safety summary secara terpisah dari Talent.

Learning, Retire, dan Onboarding masing-masing memiliki tabel domain sendiri. Onboarding tidak digabung ke Talent.

Integration menyimpan audit proses sync dan error sync. Audit menyimpan aktivitas aplikasi tanpa password, token, payroll, rekening, atau data keluarga.

## ERD

```mermaid
erDiagram
  organization_directorates ||--o{ organization_divisions : has
  organization_divisions ||--o{ organization_departments : has
  organization_departments ||--o{ organization_positions : has
  organization_positions ||--o{ organization_position_reporting_lines : reports
  organization_positions ||--o{ talent_position_skill_requirements : requires

  employee_profiles }o--|| organization_departments : current_department
  employee_profiles }o--|| organization_positions : current_position
  employee_profiles ||--o{ employee_career_histories : has
  employee_profiles ||--o{ employee_performances : has
  employee_profiles ||--o{ employee_assessments : has
  employee_profiles ||--o{ employee_potentials : has

  talent_skill_categories ||--o{ talent_skills : groups
  talent_skills ||--o{ talent_position_skill_requirements : required_by
  employee_profiles ||--o{ talent_employee_skills : owns
  talent_skills ||--o{ talent_employee_skills : measured
  talent_employee_skills ||--o{ talent_employee_skill_evidences : evidenced_by

  employee_profiles ||--o{ hsect_mcu_records : has
  employee_profiles ||--o{ hsect_simper_records : has
  employee_profiles ||--o{ hsect_employee_certifications : has
  employee_profiles ||--o{ hsect_safety_summaries : has

  learning_programs ||--o{ learning_employee_histories : completed_by
  employee_profiles ||--o{ learning_employee_histories : has

  employee_profiles ||--o{ retire_retirement_monitoring : monitored
  employee_profiles ||--o{ retire_knowledge_transfer_plans : transfers
  employee_profiles ||--o{ onboarding_programs : onboarded
  onboarding_programs ||--o{ onboarding_tasks : contains

  integration_sync_runs ||--o{ integration_sync_errors : logs
```

## Production notes

Gunakan SSL untuk database production, user database dengan privilege terbatas, backup PITR, monitoring slow query, dan connection pooler. BigQuery/HSECT production sebaiknya masuk ke staging table atau temporary import batch sebelum merge ke tabel operasional.
