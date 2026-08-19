# Template Identifikasi Sumber Data 5 Menu HR

Dokumen ini adalah template kerja untuk mengidentifikasi sumber data 5 menu utama HR pada sistem Harmoni. Rujukan utama revisi ini adalah `HR_Data_Integration_Requirement_Revised.xlsx`. File `HR_Data_Quality_Gap_Matrix_v4.xlsx` hanya dipakai sebagai referensi ketersediaan field di BigQuery, bukan sebagai instruksi proses.

## Prinsip sumber data

| Source | Pola sync | Kapan dipakai |
| --- | --- | --- |
| BQ | Periodic / batch | Master, reference, history, dan data yang tidak perlu update sangat sering. Cukup untuk baseline employee, organisasi, posisi, skill, career history, talent profile, dan retirement population. |
| BQ - Entomo | Periodic / batch | KPI, PAT, performance context, strength/weakness dari Entomo. |
| SAP | Frequent | Status proses transaksional yang perlu lebih sering: promotion status, movement/transfer process, retirement/extension process. |
| HSE CT | Periodic / batch | Eligibility HSE seperti MCU, SIMPER, SID, dan certification. |
| People Review | Periodic / batch | Strength/weakness dari assessment People Review jika perlu dipisahkan dari Entomo. |
| App Database / Prisma | Real-time aplikasi | Data yang dibuat/diubah langsung di Harmoni: task probation, presentasi, panelist, coaching, upload, review AI, dan audit log. |

## Sistem saat ini

- 5 menu utama HR berasal dari `NAV_ITEMS.admin`: Onboarding, Organization Development, Talent, Learning, Retire.
- Routing workspace berasal dari `AdminRouteFrame`: `/recruitment` dan beberapa `/admin/*` masuk Onboarding; `/organization-development` masuk OD; `/talent` dan `/admin/employee-management` masuk Talent; `/learning` masuk Learning; `/retire` masuk Retire.
- Saat ini aplikasi masih memakai Prisma DB, read model `Profile.talentData`, seed/fallback, dan beberapa mock integration. Tabel target integrasi di bawah adalah template arah implementasi agar sesuai kebutuhan data.

## Ringkasan 5 Menu

| Menu utama | Sumber yang dipakai di sistem saat ini | Target sumber integrasi sesuai matrix | Contoh fitur |
| --- | --- | --- | --- |
| Onboarding | Prisma `Profile` dengan `workforceStage = "PROBATION"`, `User`, `ProbationTask`, `Presentation`, `Panelist`, `CoachingRecord`, `AuditLog` | BQ periodic untuk employee master dan org reference; Prisma tetap untuk task/presentation/coaching yang dibuat di app | Dashboard probation, probation employees, task onboarding, presentation, coaching, reports, reminder |
| Organization Development | Prisma OD tables: directorate, division, department, position, skill, skill level, position-skill requirement, person skill assessment, competency files; Goal/PAT masih read model/mock | BQ periodic untuk organization/position, competency, job description; BQ - Entomo periodic untuk KPI/PAT | Struktur organisasi, competency matrix, job description, position directory, goal setting, PAT |
| Talent | `Profile` `workforceStage = "EMPLOYEE"` + `talentData`, fallback seed; OD matching memakai position requirement dan person skill assessment | BQ periodic untuk baseline talent/employee/skill/career; SAP frequent untuk promotion dan movement status; HSE CT periodic untuk eligibility; People Review/BQ - Entomo untuk strength/weakness | Promotion, development program, mobility, gap/skill needs, talent directory, AI matching |
| Learning | Derived dari `listEmployeeMaster()` dan `talentData`; coaching governance di Learning masih sample dari employee master | BQ periodic untuk employee/position/career baseline; HSE CT periodic untuk certification; SAP frequent untuk promotion/movement history pada career evolution | IDP monitoring, learning recommendation, coaching governance, career evolution |
| Retire | Derived dari `listEmployeeMaster()` dan field retirement di `Profile`; jika birth date kosong sistem bisa estimasi | BQ periodic untuk retirement population; SAP frequent untuk retirement/extension process | Retire notifications, retirement monitoring, extension status, replacement/handover reminder |

## Detail Per Menu

### 1. Onboarding

| Area | Source | Sync | Field utama | Pemakaian di sistem |
| --- | --- | --- | --- | --- |
| Dashboard / Probation Monitoring | BQ | Periodic | Employee ID, NIK, Name, Department, Position, Join Date, Supervisor, Work Location, Employee Status | Baseline employee dan organisasi untuk monitoring probation. |
| Probation Employees | BQ | Periodic | Employee ID, NIK, Name, Email, Department, Position, Join Date, Supervisor, Work Location, Employee Status | Populasi dan profil probation employee. |
| Reports | BQ | Periodic | Employee ID, NIK, Name, Directorate, Division, Department, Position, Job Level, Supervisor, Work Location | Reference data untuk laporan probation, task, presentation, coaching. |
| Task / Presentation / Coaching | App DB / Prisma | Real-time aplikasi | Task title/status/due date/PIC/attachment, presentation date/time/location/link/panelist/score/recommendation, coaching note/outcome/follow-up | Data operasional yang memang dibuat dan dikelola di Harmoni. |

Catatan edit: untuk Onboarding tidak perlu SAP frequent di matrix saat ini. Data BQ cukup batch/periodic karena dipakai sebagai master dan reference.

### 2. Organization Development

| Area | Source | Sync | Field utama | Pemakaian di sistem |
| --- | --- | --- | --- | --- |
| Struktur Organisasi | BQ | Periodic | Directorate, Division, Department, Position ID, Position, Job Level, Current Holder Employee ID, Current Holder Name, Supervisor Position | Membangun hierarchy, struktur posisi, dan mapping holder. |
| Competencies | BQ | Periodic | Position ID, Position, Job Level, Required Skill, Required Skill Level | Mapping competency dan required skill per posisi. |
| Job Descriptions | BQ | Periodic | Position ID, Position, Job Level, Directorate, Division, Department, Job Description, Responsibilities, Requirements, Related Skill | Menampilkan job description dan requirement posisi. |
| Goal Setting Performance | BQ - Entomo | Periodic | Employee ID/NIK, KPI, Strength, Weakness, Comment PAT | Konteks performance untuk goal setting dan PAT. |
| Competency upload/share | App DB / Prisma | Real-time aplikasi | File name, URL, uploader, upload date, file size, mime type | Penyimpanan file competency yang diupload dari Harmoni. |

Catatan sistem saat ini: halaman OD sudah membaca tabel Prisma OD (`OrganizationPosition`, `TalentSkill`, `TalentPositionSkillRequirement`, dan terkaitnya). Goal/PAT di service saat ini masih dibangun dari read model/mock, jadi label integrasinya tetap BQ - Entomo periodic.

### 3. Talent

| Area | Source | Sync | Field utama | Pemakaian di sistem |
| --- | --- | --- | --- | --- |
| Promotion baseline | BQ | Periodic | Employee ID, NIK, Name, Current Position, Directorate, Division, Department, Job Level, Join Date | Baseline employee dan organisasi yang ditampilkan di menu Promotion. |
| Promotion process/status | SAP | Frequent | Employee ID/NIK, Last Promotion, Time in Position, Next/PIC, Current Status | Status promosi terbaru dan PIC/next step. Ini yang perlu frequent. |
| Development Program | BQ | Periodic | Employee ID, NIK, Name, Current Position, Directorate, Division, Department, Program Name, PAT Score, Comment during DP, Last Promotion, Time in Current Position, Join Year | Data yang ditampilkan di Development Program. |
| Mobility baseline | BQ | Periodic | Employee ID, NIK, Name, Current Position, Target/Vacant Position, Directorate, Division, Department, Job Level, Career History, Work Location | Baseline candidate matching dan mobility. |
| Mobility process/status | SAP | Frequent | Employee ID, Movement/Transfer Request ID, Current Position, Target Position, Approval Status, Effective Date, PIC, Approval History | Tracking proses movement/transfer dan approval. |
| Mobility eligibility | HSE CT | Periodic | Employee ID/NIK, MCU Status, MCU Type, MCU Description, SIMPER Status, SIMPER Expiry, SID, Certification, Certification Expiry | Validasi eligibility target role/location jika diperlukan. |
| Current Gap / Skill Needs | BQ | Periodic | Employee ID, NIK, Name, Current Position, Position ID, Job Level, Current Skill, Current Skill Level, Required Skill, Required Skill Level | Membandingkan capability employee dengan requirement posisi. |
| Current Gap eligibility | HSE CT | Periodic | Employee ID/NIK, Certification, Certification Status, Certification Expiry, SIMPER Status, SID, MCU Status | Eligibility HSE/certification sebagai bagian gap jika relevan. |
| Talent Directory baseline | BQ | Periodic | Employee, organization, position, career, performance/talent, education, experience, project, role scope, readiness, dan field lain yang tampil di Talent Directory | Dataset utama untuk Talent Directory/Talent Card. |
| Strength/Weakness | BQ - Entomo / People Review | Periodic | Employee ID/NIK, Strength, Weakness | Assessment context untuk talent profile dan recommendation. |
| Talent eligibility | HSE CT | Periodic | Employee ID/NIK, MCU Status, MCU Type, MCU Description, SIMPER Status, Certification | Informasi HSE/eligibility di Talent Directory. |
| AI analysis/review | App DB / Prisma | Real-time aplikasi | `TalentAiAnalysis`, structured result, review status, reviewer notes | Menyimpan hasil AI dan review HR di Harmoni. |

Catatan penting: Promotion jangan seluruhnya dianggap SAP. BQ cukup untuk baseline/master yang batch, sedangkan SAP frequent hanya untuk status proses promosi seperti last promotion, time in position, next/PIC, current status.

### 4. Learning

| Area | Source | Sync | Field utama | Pemakaian di sistem |
| --- | --- | --- | --- | --- |
| IDP Progress Monitoring | BQ | Periodic | Employee ID, NIK, Name, Current Position, Target Position, Directorate, Division, Department, Job Level, Supervisor | Employee dan target-position reference untuk IDP monitoring. |
| Certification requirement | HSE CT | Periodic | Employee ID/NIK, Certification, Certification Status, Issue Date, Expiry Date | Monitoring IDP yang terkait sertifikasi. |
| Coaching Governance | BQ | Periodic | Employee ID, NIK, Name, Supervisor ID, Supervisor Name, Department, Position, Job Level | Employee/supervisor reference untuk coaching governance. |
| Career Evolution baseline | BQ | Periodic | Employee ID, NIK, Name, Join Date, Current Position, Career History, Job Level, Directorate, Division, Department | Baseline career dan organisasi. |
| Career Evolution transaction | SAP | Frequent | Employee ID, Transaction Type, Previous Position, New Position, Previous Org Unit, New Org Unit, Effective Date, Process Status | Melengkapi career timeline dengan transaksi promotion/movement. |
| Learning recommendation saat ini | App read model | Derived | competency gap, recommendation type/name, 70-20-10 plan, timeline, priority, status | Saat ini dihitung dari `listEmployeeMaster()` dan helper gap di service, belum LMS live. |

Catatan edit: Learning masih bisa dibatch dari BQ untuk baseline. SAP frequent hanya dibutuhkan saat career evolution perlu status transaksi promosi/movement terbaru.

### 5. Retire

| Area | Source | Sync | Field utama | Pemakaian di sistem |
| --- | --- | --- | --- | --- |
| Notifications | BQ | Periodic | Employee ID, NIK, Name, Birth Date, Age, Retirement Age, Estimated Retirement Date, Employee Status, Position, Department, Supervisor | Identifikasi employee yang mendekati retirement. |
| Retirement Monitoring baseline | BQ | Periodic | Employee ID, NIK, Name, Birth Date, Retirement Age, Estimated Retirement Date, Join Date, Current Position, Job Level, Directorate, Division, Department, Supervisor, Employee Status | Population dan org reference untuk retirement monitoring. |
| Retirement / Extension process | SAP | Frequent | Employee ID, Retirement Process ID, Retirement Status, Extension Status, Proposed Retirement Date, Effective Retirement Date, Approval Status, PIC | Tracking proses administratif retirement/extension yang perlu update lebih sering. |
| Retirement notes override | App DB / Prisma | Real-time aplikasi | `retirementAge`, `retirementExtendedUntil`, `retirementNotes` pada `Profile` | Override/catatan lokal yang sekarang ada di sistem Harmoni. |

Catatan penting: BQ cukup untuk daftar populasi pensiun dan estimasi. SAP frequent hanya untuk proses extension/approval/status administratif.

## Referensi Field BQ Dari HR Data Quality

Field berikut berasal dari `HR_Data_Quality_Gap_Matrix_v4.xlsx` dan hanya dipakai sebagai referensi ketersediaan field BQ. Gunakan daftar ini saat memilih mapping field untuk BQ periodic.

| Kategori | Field BQ tersedia / disebut | Catatan kualitas yang perlu diperhatikan |
| --- | --- | --- |
| Identity | `personnel_number`, `global_personnel_number`, `employee_name`, `date_of_birth`, `gender`, `ktp_passport`, `npwp`, `tax_status`, `marital_status`, `religion`, `nationality`, `birthday_place` | Identity utama terlihat sehat untuk BC dan MTL. |
| Employment | `employee_group`, `work_contract`, `contract_type`, `end_of_contract`, `join_date`, `hiring_date`, `last_working_date`, `years_of_service` | `contract_type` lebih lemah di BC, lebih sehat di MTL. |
| Contact | `office_email`, `personal_email`, `cell_phone` | `personal_email` lemah, terutama MTL; untuk login/notification prioritaskan `office_email` jika tersedia. |
| Position & Job | `position_name`, `position_type`, `job_family`, `ps_level`, `layer`, `stem`, `value_chain`, `job_characteristic`, `critical_position`, `c_level` | Umumnya cukup kuat; `job_family/stem/value_chain` MTL perlu perhatian. |
| Org Structure | `personnel_area`, `personnel_subarea`, `direktorat`, `divisi`, `department`, `section`, `unit`, `business_unit`, `business_area`, `pillar`, `cc_group` | `section` dan `unit` kosong; `direktorat` lemah terutama MTL; `department` perlu validasi. |
| Cost Center | `cost_center_code`, `cost_center_name` | Umumnya sehat. |
| Supervisor / HRBP | `supervisor_nik`, `supervisor_name`, `hrbp_nik`, `hrbp_name` | Umumnya sehat dan cocok untuk coaching/reminder routing. |
| Education | `degree`, `major`, `faculty`, `school` | `major/faculty` lemah terutama MTL; jangan jadikan wajib untuk MVP. |
| Performance | `performance_category`, `pat_2025`, `pat_2024`, `pat_2023`, `pat_2022` | PAT/performance cukup tersedia untuk employee dalam cycle. |
| Potential & Talent | `potential_grow_category`, `potential_grow_score`, `talent_class_9_box`, `talent_class_12_box`, `talent_calibration_now`, `talent_demeter` | `potential_grow_score` kosong; gunakan category/class sampai score tersedia. |
| 360 & Aspiration | `360_strength`, `360_weakness`, `aspiration` | Coverage sedang/lemah; bisa dilengkapi dari Entomo atau People Review. |
| Development | `certification`, `training`, `xdp_history`, `project_involvement` | `xdp_history` dan `project_involvement` lemah, perlu fallback/manual validation. |
| Career | `career_within_organization`, `career_outside_organization`, `start_date_in_current_position`, `last_rotation_date`, `last_promotion_date` | Career internal dan posisi saat ini kuat; career outside lebih lemah. |

## Checklist Edit Lanjutan

- [ ] Isi nama table/view BQ untuk Employee Master, Organization/Position Master, Career History, Competency/Skill, Performance/PAT.
- [ ] Isi endpoint/table SAP untuk Promotion, Movement/Transfer, Retirement/Extension process.
- [ ] Isi sumber HSE CT untuk MCU, SIMPER, SID, dan Certification.
- [ ] Tandai field BQ yang kualitasnya lemah agar tidak menjadi mandatory field MVP.
- [ ] Tentukan join key final: Employee ID, NIK, Position ID, Request ID, atau Process ID.
- [ ] Tentukan refresh final: BQ periodic/batch, SAP frequent, HSE CT periodic, app DB real-time.
