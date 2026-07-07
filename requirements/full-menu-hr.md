# Full Menu HR

Dokumen ini menjadi ringkasan konteks project HR Monitoring setelah evolusi dari probation-only portal menjadi multi-workspace HR Admin portal.

## 1. Project purpose

Project ini tetap bukan HRIS penuh. Scope utamanya adalah portal HR yang mengelola lifecycle karyawan dalam empat workspace:

1. Recruitment
2. Organization Development
3. Talent
4. Learning

Probation Monitoring tetap menjadi flow utama untuk new hire dan tetap dipertahankan tanpa merusak behaviour existing.

## 2. Prinsip utama

- HR Admin mendapat akses penuh ke seluruh workspace.
- Non-HR tetap dibatasi melalui auth dan role guard.
- Talent Management hanya untuk karyawan yang sudah melewati probation.
- Employee Card menjadi halaman detail bersama untuk seluruh workspace talent/learning.
- NIK tidak ditampilkan di tabel/list umum. NIK hanya muncul di Employee Card dan form personal tertentu.
- Semua employee row yang relevan harus clickable menuju Employee Card.
- Semua recommendation, gap, dan IDP adalah decision support. Keputusan akhir tetap di HR.

## 3. Arsitektur workspace

### 3.1 Recruitment

Recruitment berisi flow probation existing.

Route:

- `/recruitment`
- `/recruitment/probation-monitoring`

Komponen existing yang tetap dipakai:

- dashboard probation
- probation employees
- task management
- presentations
- coaching
- reports

### 3.2 Organization Development

Organization Development menjadi sumber struktur organisasi dan definisi posisi.

Route:

- `/organization-development`
- `/organization-development/organization-structure`
- `/organization-development/skills`
- `/organization-development/job-descriptions`

Fungsi utama:

- struktur organisasi bertingkat
- required skills per posisi
- job descriptions per posisi
- basis referensi untuk talent gap, rotation, dan learning

Hierarchy yang dipakai:

`Direktorat -> Divisi -> Department -> Position -> Employee`

### 3.3 Talent

Talent workspace fokus pada employee post-probation dan pengelolaan pipeline talent.

Route:

- `/talent`
- `/talent/promotion`
- `/talent/development-program`
- `/talent/rotation`
- `/talent/gap`

Tambahan route legacy yang masih dipertahankan:

- `/admin/employee-management`
- `/admin/employee-management/[id]`

Fungsi utama:

- Talent Directory
- Promotion
- Development Program
- Rotation
- GAP

Konsep penting:

- employee list harus clickable
- tidak tampilkan NIK di list/table
- filter bertahap dari direktorat ke divisi ke department
- rotation dan gap menggunakan data OD sebagai referensi

### 3.4 Learning

Learning adalah engine pengembangan employee berbasis gap, coaching, program belajar, dan career growth.

Route:

- `/learning`
- `/learning/idp`
- `/learning/coaching-governance`
- `/learning/alignment`
- `/learning/career-evolution`

Fungsi utama:

- Integrated IDP
- Coaching Governance
- Learning Alignment
- Career Evolution

Learning memakai 70-20-10:

- 70% Project / OJT
- 20% Coaching / Mentoring
- 10% Certification / Formal Learning

## 4. Data model concept

### 4.1 Employee master

Employee data dibangun dari profil karyawan yang sudah melewati probation, kemudian diperkaya dengan talent metadata.

Field konseptual:

- employeeId / NIK
- name
- currentPosition
- currentLevel
- department
- division
- directorate
- joinDate
- employmentStatus
- lastPromotionDate
- currentSkills
- careerHistory
- developmentPrograms
- successor

### 4.2 OD master

OD master menyimpan:

- organization units
- position skill requirements
- job descriptions
- related competencies

### 4.3 Talent & learning read model

Read model dipakai untuk:

- promotion summary
- development program summary
- rotation recommendation
- skill gap analysis
- learning recommendation
- career evolution timeline

## 5. Talent Card concept

Employee Card menjadi satu halaman bersama untuk semua workspace talent dan learning.

Halaman ini harus menampilkan:

- basic identity
- current job
- career history
- performance
- assessment
- project involvement
- certification
- HSE/medical
- AI insight untuk current position
- gap
- recommendation

Section yang sudah dihapus dari konsep baru:

- Additional Roles
- managed-by style fields yang tidak relevan
- stakeholder perspective

### AI Insight for Current Position

AI Insight difokuskan pada employee saat ini, bukan hanya promotion.

Field mock:

- Current Position Readiness Score
- Overall Assessment
- Key Strengths
- Skill Gap
- Recommended Training
- Recommended Certification
- Recommended Project Assignment
- Recommended Coaching / Mentoring
- Priority Improvement Area
- Career Risk / Notes

## 6. Learning engine concept

Learning workspace menjadi pusat pengembangan.

### 6.1 Integrated IDP

IDP dihasilkan dari gap analysis dan promotion/rotation need.

Struktur rekomendasi:

- 70% Project / OJT
- 20% Coaching / Mentoring
- 10% Certification / Formal Learning

### 6.2 Coaching Governance

Digunakan untuk tracking:

- sessions
- goals
- discussion points
- follow-up actions
- next session

### 6.3 Learning Alignment

Learning program harus terhubung ke:

- competency gap
- training program
- learning provider
- improvement metrics

### 6.4 Career Evolution

Visual timeline berisi:

- join date
- last promotion
- next milestone
- target position
- future growth path

## 7. Dummy data strategy

Dummy data harus merepresentasikan perusahaan coal mining.

Direktorat yang muncul:

- Operations
- Mining
- Engineering
- Plant / Maintenance
- HSE
- Supply Chain
- HRGA
- Finance
- IT
- Commercial
- Corporate Affairs

Level karier yang dipakai:

- Staff
- Officer
- Specialist
- Supervisor
- Superintendent
- Manager
- GM / Head

Tujuannya:

- list tidak terlihat generik
- rotation dan IDP punya kandidat yang masuk akal
- learning recommendation punya konteks operasional nyata

## 8. Sync and integration direction

Sumber data siap diarahkan ke:

- SAP HR
- MCU
- Payroll
- Performance
- LMS
- Manual HR Input

Arahan arsitektur:

1. sumber eksternal masuk lewat connector/service
2. data divalidasi dan dinormalisasi
3. canonical store menyimpan data terstruktur
4. read model dipakai UI
5. AI/LLM dipakai untuk explanation, skill gap, dan IDP draft

Prinsip penting:

- UI tidak memanggil SAP langsung saat render
- field penting harus bisa dilacak sumbernya
- nilai kosong jangan dipaksa menjadi nol
- recommendation harus dapat diaudit

## 9. Permission model

- `NEW_HIRE`
  - akses dashboard probation, tasks, presentation, coaching, profile

- `HR_ADMIN`
  - akses semua workspace HR
  - akses mutasi dan maintenance data

## 10. Route map

### Public/Auth

- `/login`
- `/register`

### Employee

- `/dashboard`
- `/tasks`
- `/presentation`
- `/coaching`
- `/profile/edit`

### Recruitment

- `/recruitment`
- `/recruitment/probation-monitoring`

### Organization Development

- `/organization-development`
- `/organization-development/organization-structure`
- `/organization-development/skills`
- `/organization-development/job-descriptions`

### Talent

- `/talent`
- `/talent/promotion`
- `/talent/development-program`
- `/talent/rotation`
- `/talent/gap`
- `/admin/employee-management`
- `/admin/employee-management/[id]`

### Learning

- `/learning`
- `/learning/idp`
- `/learning/coaching-governance`
- `/learning/alignment`
- `/learning/career-evolution`

### Legacy probation admin routes

- `/admin/dashboard`
- `/admin/employees`
- `/admin/tasks`
- `/admin/presentations`
- `/admin/coaching`
- `/admin/reports`

## 11. Next implementation notes

- Keep all new menu routes in the shared HR shell.
- Keep Talent Directory and Employee Card reusable.
- Move future SAP/HRIS integration into service layer, not page layer.
- Preserve probation routes until product decides full migration.

