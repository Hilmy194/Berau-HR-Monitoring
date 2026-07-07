# User Manual HR Full Workspace

Panduan ini menjelaskan cara memakai seluruh workspace HR Admin dan employee area pada project HR Monitoring.

## 1. Login

1. Buka halaman login.
2. Masukkan email dan password.
3. Klik `Sign In`.

Jika akun adalah HR Admin, sistem akan masuk ke halaman menu HR Admin.
Jika akun adalah New Hire, sistem masuk ke dashboard probation employee.

## 2. HR Admin home

Setelah login sebagai HR Admin, halaman awal menampilkan 4 menu utama:

- Recruitment
- Organization Development
- Talent
- Learning

Semua menu ini berada di sidebar yang sama dan tetap terlihat saat berpindah halaman.

## 3. Recruitment workspace

Recruitment dipakai untuk flow probation existing.

### Fungsi

- melihat dashboard probation
- melihat employee probation
- mengelola task probation
- menjadwalkan presentation
- mengelola coaching probation
- melihat report probation

### Cara pakai

1. Klik `Recruitment`.
2. Buka `Probation Monitoring` untuk dashboard utama.
3. Buka submenu lain bila ingin mengelola employee probation.

### Catatan

- Workspace ini khusus untuk new hire/probation.
- Flow existing tidak berubah.

## 4. Organization Development workspace

OD dipakai untuk struktur organisasi, required skills, dan job description.

### 4.1 Organization Structure

Menampilkan hierarchy:

- Direktorat
- Divisi
- Department
- Position
- Employee

### Cara pakai

1. Klik `Organization Development`.
2. Buka `Struktur Organisasi`.
3. Expand level yang ingin dilihat.
4. Klik employee untuk membuka Employee Card.

### 4.2 Skills

Menampilkan skill yang dibutuhkan setiap posisi.

### Cara pakai

1. Klik `Skills`.
2. Gunakan search untuk posisi atau skill.
3. Filter bertahap:
   - pilih Direktorat
   - pilih Divisi
   - pilih Department
4. Lihat required skills dan level posisi.

### 4.3 Job Descriptions

Menampilkan job description per posisi.

### Cara pakai

1. Klik `Job Descriptions`.
2. Gunakan search dan filter bertahap.
3. Baca responsibilities, requirements, dan related skills.

## 5. Talent workspace

Talent dipakai untuk employee post-probation.

### Aturan penting

- NIK tidak tampil di tabel/list.
- Semua employee row bisa diklik ke Employee Card.
- Filter bertahap dari Direktorat ke Divisi ke Department.
- Talent Directory tetap berada di workspace Talent.

### 5.1 Talent Overview

Halaman ringkasan untuk Promotion, Development Program, Rotation, dan GAP.

### 5.2 Promotion

Menampilkan:

- Employee
- Current Position
- Directorate
- Division
- Department
- Current Level
- Last Promotion
- Time in Current Position
- Successor

### Cara pakai

1. Klik `Talent`.
2. Buka `Promotion`.
3. Filter employee bila perlu.
4. Klik employee untuk membuka Employee Card.

### 5.3 Development Program

Menampilkan employee yang sedang mengikuti development program.

Field utama:

- Employee
- Current Position
- Directorate
- Division
- Department
- Program Type
- Program Name
- Join Year
- Status

### 5.4 Rotation

Dipakai untuk mencari kandidat pengganti posisi.

### Cara pakai

1. Buka `Rotation`.
2. Pilih target position.
3. Lihat candidate list beserta match score, matched skill, missing skill, dan development need.
4. Klik candidate untuk membuka Employee Card.

### 5.5 GAP

Dipakai untuk melihat skill gap employee terhadap current position.

### Cara pakai

1. Buka `GAP`.
2. Cari employee terlebih dahulu.
3. Lihat required skills, current skills, gap, dan summary.

## 6. Learning workspace

Learning adalah area pengembangan employee yang lebih lengkap.

### Submenu

- Integrated IDP
- Coaching Governance
- Learning Alignment
- Career Evolution

### 6.1 Integrated IDP

Menampilkan rekomendasi pengembangan berdasarkan gap analysis.

Struktur yang dipakai:

- 70% Project / OJT
- 20% Coaching / Mentoring
- 10% Certification / Formal Learning

### Cara pakai

1. Klik `Learning`.
2. Buka `Integrated IDP`.
3. Gunakan filter employee atau organization.
4. Baca gap, rekomendasi, success metric, timeline, dan status.

### 6.2 Coaching Governance

Menampilkan coaching yang sedang berjalan, goals, follow-up, dan sesi berikutnya.

### Cara pakai

1. Buka `Coaching Governance`.
2. Cari employee.
3. Baca active goal, last discussion, follow-up, dan next session.

### 6.3 Learning Alignment

Menampilkan hubungan antara competency gap, training program, provider, dan improvement metrics.

### Cara pakai

1. Buka `Learning Alignment`.
2. Filter employee atau organization.
3. Lihat training program yang terhubung ke gap dan metrik improvement.

### 6.4 Career Evolution

Menampilkan timeline perkembangan karier employee.

### Cara pakai

1. Buka `Career Evolution`.
2. Cari employee.
3. Lihat join date, last promotion, next milestone, dan future growth path.

## 7. Employee Card

Employee Card adalah halaman detail bersama untuk Talent dan Learning.

### Dibuka dari mana saja

- Talent Directory
- Promotion
- Development Program
- Rotation
- GAP
- Learning

### Yang ditampilkan

- basic profile
- career history
- performance
- assessment
- HSE / medical
- project
- certification
- AI Insight for Current Position

### AI Insight

Bagian AI Insight membantu HR melihat:

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

## 8. Search and filter behavior

### Prinsip umum

Filter dibuat bertahap:

1. Direktorat
2. Divisi
3. Department

Filter employee dipakai pada workspace yang memang butuh pencarian kandidat individual.

### Hasil filter

- Divisi hanya menampilkan data yang ada di direktorat terpilih.
- Department hanya menampilkan data yang ada di divisi terpilih.
- Filter tidak memunculkan posisi di UI filter umum.

## 9. Data dummy

Data dummy dirancang menyerupai perusahaan coal mining.

Direktorat yang muncul antara lain:

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

Level karier yang disimulasikan:

- Staff
- Officer
- Specialist
- Supervisor
- Superintendent
- Manager
- GM / Head

## 10. HR Admin and employee access

### HR Admin

Bisa mengakses seluruh workspace dan melakukan perubahan data.

### New Hire / Employee

Hanya mengakses area probation dan profil pribadinya.

## 11. Integrasi real di masa depan

Saat data real tersedia, flow yang disarankan:

1. SAP HR menjadi sumber master employee, organization, job level, dan career history.
2. OD master menjadi sumber skill requirement dan job description.
3. Performance, assessment, MCU, LMS, dan payroll mengisi talent evidence.
4. Service layer menggabungkan data menjadi read model.
5. AI/LLM dipakai untuk menjelaskan skill gap dan menulis draft IDP.

## 12. Troubleshooting singkat

- Jika menu tidak muncul, pastikan login sebagai HR Admin.
- Jika data employee kosong, cek seed dummy talent dan status workforce.
- Jika filter terasa aneh, refresh halaman karena data dummy mengikuti hierarchy direktorat/divisi/department.
- Jika build/dev bermasalah di Windows, biasanya Prisma engine sedang terkunci oleh proses dev server lain.

