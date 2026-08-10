param(
  [string]$OutputPath = "requirements/HR_Real_Sample_Data_Template_5_Employees.xlsx"
)

$ErrorActionPreference = "Stop"

function Escape-Xml([object]$Value) {
  if ($null -eq $Value) { return "" }
  return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Column-Name([int]$Index) {
  $name = ""
  while ($Index -gt 0) {
    $mod = ($Index - 1) % 26
    $name = [char](65 + $mod) + $name
    $Index = [math]::Floor(($Index - $mod) / 26)
  }
  return $name
}

function New-Sheet([string]$Name, [object[]]$Rows) {
  return [pscustomobject]@{ Name = $Name; Rows = $Rows }
}

function Sheet-Xml($Sheet) {
  $rowsXml = New-Object System.Text.StringBuilder
  for ($r = 0; $r -lt $Sheet.Rows.Count; $r++) {
    $rowNumber = $r + 1
    [void]$rowsXml.Append("<row r=`"$rowNumber`">")
    $row = $Sheet.Rows[$r]
    for ($c = 0; $c -lt $row.Count; $c++) {
      $cellRef = "$(Column-Name ($c + 1))$rowNumber"
      $style = if ($r -eq 0) { " s=`"1`"" } else { "" }
      [void]$rowsXml.Append("<c r=`"$cellRef`" t=`"inlineStr`"$style><is><t>$(Escape-Xml $row[$c])</t></is></c>")
    }
    [void]$rowsXml.Append("</row>")
  }

  $maxCol = ($Sheet.Rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
  if (-not $maxCol) { $maxCol = 1 }
  $dimension = "A1:$(Column-Name $maxCol)$($Sheet.Rows.Count)"
  return "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?>" +
    "<worksheet xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`">" +
    "<dimension ref=`"$dimension`"/><sheetViews><sheetView workbookViewId=`"0`"><pane ySplit=`"1`" topLeftCell=`"A2`" activePane=`"bottomLeft`" state=`"frozen`"/></sheetView></sheetViews>" +
    "<sheetFormatPr defaultRowHeight=`"18`"/><sheetData>$rowsXml</sheetData><autoFilter ref=`"$dimension`"/></worksheet>"
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

$employees = @(
  @("EMP-SAMPLE-001","Nama Karyawan 1","nama1@berau.co.id","BC-SAMPLE-001","ACTIVE","PERMANENT","Mining Operations","Mining","Mine Planning","Senior Mine Planning Engineer","JG6","EMP-SAMPLE-005","Nama Atasan 1","Binungan Site","MALE","1991-04-12","2018-05-16","2047-04-12","Mining Engineering","EMPLOYEE"),
  @("EMP-SAMPLE-002","Nama Karyawan 2","nama2@berau.co.id","BC-SAMPLE-002","ACTIVE","PERMANENT","HSE","Safety","HSE","Senior Safety Officer","JG6","EMP-SAMPLE-005","Nama Atasan 2","Lati Site","FEMALE","1990-08-21","2017-10-10","2046-08-21","Occupational Safety","EMPLOYEE"),
  @("EMP-SAMPLE-003","Nama Karyawan 3","nama3@berau.co.id","BC-SAMPLE-003","ACTIVE","PERMANENT","Finance","Accounting & Control","Finance","Senior Management Accountant","JG6","EMP-SAMPLE-005","Nama Atasan 3","Head Office","FEMALE","1988-01-09","2015-01-20","2044-01-09","Accounting","EMPLOYEE"),
  @("EMP-SAMPLE-004","Nama Karyawan 4","nama4@berau.co.id","BC-SAMPLE-004","ACTIVE","CONTRACT","IT","Digital & Infrastructure","Information Technology","Data & Integration Lead","JG6","EMP-SAMPLE-005","Nama Atasan 4","Head Office","MALE","1993-02-14","2020-07-02","2049-02-14","Information Systems","EMPLOYEE"),
  @("EMP-SAMPLE-005","Nama Karyawan 5","nama5@berau.co.id","BC-SAMPLE-005","ACTIVE","PERMANENT","Operations","Hauling & CPP","Plant Maintenance","Maintenance Supervisor","JG7","","","Binungan Workshop","MALE","1984-06-28","2010-08-14","2040-06-28","Mechanical Engineering","EMPLOYEE")
)

$sheets = @()
$sheets += New-Sheet "README" @(
  @("Tujuan","Template Excel untuk input sample data real 5 orang agar semua workspace/modul terintegrasi, kecuali workspace probation."),
  @("Cara pakai","Ganti baris EMP-SAMPLE-001 sampai EMP-SAMPLE-005 dengan data real. Pertahankan employee_id yang sama di semua sheet."),
  @("Relasi utama","employee_id menghubungkan Employee_Master, Talent_Profile, HSE_Compliance, Goals, PAT, Promotion, Coaching, Learning, Career, dan Retirement."),
  @("Tanggal","Gunakan format YYYY-MM-DD."),
  @("Status","Ikuti nilai pada sheet Data_Dictionary."),
  @("Catatan","Sheet Probation_Task, Probation_Presentation, dan Probation_Panelist sengaja tidak dibuat karena diminta dikecualikan.")
)

$sheets += New-Sheet "Data_Dictionary" @(
  @("sheet","kolom","wajib","contoh/allowed value","keterangan"),
  @("Employee_Master","employee_id","YA","EMP-SAMPLE-001","ID unik karyawan; dipakai sebagai key lintas sheet."),
  @("Employee_Master","workforce_stage","YA","EMPLOYEE","Isi EMPLOYEE agar tidak masuk workspace probation."),
  @("Employee_Master","status","YA","ACTIVE | INACTIVE","Status karyawan."),
  @("Employee_Master","employment_type","YA","PERMANENT | CONTRACT","Tipe pekerja."),
  @("Talent_Profile","performance_y1/performance_y2/performance_y3","YA","88","Skor 0-100 untuk talent matrix."),
  @("Talent_Profile","potential_score/readiness_score","YA","85","Skor 0-100 untuk ranking dan readiness."),
  @("HSE_Compliance","mcu_status","YA","FIT | FIT_WITH_NOTE | TEMPORARILY_UNFIT | UNKNOWN","Status medical check-up."),
  @("HSE_Compliance","simper_status","YA","ACTIVE | EXPIRING | EXPIRED | SUSPENDED | NOT_AVAILABLE","Status SIMPER."),
  @("Employee_Goals","status","YA","Not Started | In Progress | On Track | At Risk | Overdue | Completed | Cancelled","Status goal Entomo."),
  @("Employee_Goals","priority","YA","Low | Medium | High | Critical","Prioritas goal."),
  @("PAT_Assessment","status","YA","Reviewed | In Progress | Complete","Status penilaian PAT/SIL."),
  @("Promotion_Requests","promotion_status","YA","Submitted | Approved Div. Head | Verified by HRBP | Verified by HROD | Approved Dir./Bus. Head | Rejected","Status workflow promosi."),
  @("Coaching_Governance","status","YA","NOT_STARTED | IN_PROGRESS | COMPLETED","Status sesi coaching."),
  @("Learning_IDP","status","YA","Mapped | In Progress | Pending Enrollment | Completed","Status learning/IDP."),
  @("Retirement_Contract","retirement_status","YA","Normal | Warning | Critical | Overdue","Status monitoring pensiun/kontrak.")
)

$sheets += New-Sheet "Employee_Master" @(
  @("employee_id","full_name","email","nik","status","employment_type","directorate","division","department","position_name","job_level","manager_id","manager_name","work_location","gender","birth_date","join_date","retirement_date","education","workforce_stage"),
  $employees[0], $employees[1], $employees[2], $employees[3], $employees[4]
)

$sheets += New-Sheet "Organization_Units" @(
  @("directorate_code","directorate_name","division_code","division_name","department_code","department_name","is_active"),
  @("OPS","Operations","MIN","Mining","MPL","Mine Planning","TRUE"),
  @("HSE","HSE","SFT","Safety","SFT","HSE","TRUE"),
  @("FIN","Finance","ACC","Accounting & Control","FIN","Finance","TRUE"),
  @("IT","IT","DIG","Digital & Infrastructure","DTA","Information Technology","TRUE"),
  @("OPS","Operations","MNT","Maintenance","PLT","Plant Maintenance","TRUE")
)

$sheets += New-Sheet "Positions" @(
  @("position_code","position_name","department_code","job_level","position_summary","job_description","current_holder_employee_id","is_managerial","is_active"),
  @("MPL-SR-ENG","Senior Mine Planning Engineer","MPL","JG6","Menyusun rencana tambang dan evaluasi cadangan.","Long term planning, scheduling, reserve optimization, reporting KPI.","EMP-SAMPLE-001","FALSE","TRUE"),
  @("HSE-SR-OFC","Senior Safety Officer","SFT","JG6","Mengelola risk assessment dan kontrol keselamatan.","Risk assessment, incident investigation, SMKP, emergency response.","EMP-SAMPLE-002","FALSE","TRUE"),
  @("FIN-SR-ACC","Senior Management Accountant","FIN","JG6","Mengelola budget dan analisis biaya tambang.","Budgeting, mine cost analysis, SAP FICO, financial modeling.","EMP-SAMPLE-003","FALSE","TRUE"),
  @("DTA-LEAD","Data & Integration Lead","DTA","JG6","Mengelola platform data dan integrasi sistem.","Data architecture, SAP integration, cloud platform, cyber security.","EMP-SAMPLE-004","TRUE","TRUE"),
  @("MNT-SUP","Maintenance Supervisor","PLT","JG7","Mengawasi maintenance heavy equipment/plant.","Shutdown planning, reliability engineering, RCA, safety leadership.","EMP-SAMPLE-005","TRUE","TRUE")
)

$sheets += New-Sheet "Skills_Catalog" @(
  @("skill_code","skill_category","skill_name","level","level_name","definition","evidence_requirement","behavior_indicators"),
  @("MINE-PLAN","Mining Operation","Long-term mine planning","4","Advanced","Mampu menyusun rencana tambang jangka panjang.","LOM plan tervalidasi; schedule produksi; evaluasi keekonomian.","Plan accuracy; scenario analysis; stakeholder review"),
  @("HSE-RISK","HSE","Risk assessment","4","Advanced","Mampu mengidentifikasi dan mengendalikan risiko kritikal.","Risk register; JSA; corrective action close-out.","Critical control verification; hazard trend analysis"),
  @("FIN-COST","Finance","Mine cost analysis","4","Advanced","Mampu menganalisis biaya operasi tambang.","Cost variance analysis; budget review; action plan.","Cost driver insight; business partnering"),
  @("IT-DATA","Information Technology","Data architecture","4","Advanced","Mampu merancang integrasi dan arsitektur data.","Data model; pipeline; governance checklist.","Reliability; security; integration quality"),
  @("MNT-RCA","Plant Maintenance","Root cause analysis","4","Advanced","Mampu menganalisis failure dan menurunkan downtime.","RCA report; action closure; downtime trend.","Problem solving; preventive action")
)

$sheets += New-Sheet "Position_Skill_Req" @(
  @("position_code","skill_code","required_level","weight","is_mandatory","effective_from","effective_to","evidence_notes"),
  @("MPL-SR-ENG","MINE-PLAN","4","1.00","TRUE","2026-01-01","","Wajib untuk mine planning role."),
  @("HSE-SR-OFC","HSE-RISK","4","1.00","TRUE","2026-01-01","","Wajib untuk HSE role."),
  @("FIN-SR-ACC","FIN-COST","4","1.00","TRUE","2026-01-01","","Wajib untuk finance role."),
  @("DTA-LEAD","IT-DATA","4","1.00","TRUE","2026-01-01","","Wajib untuk IT/data role."),
  @("MNT-SUP","MNT-RCA","4","1.00","TRUE","2026-01-01","","Wajib untuk maintenance role.")
)

$sheets += New-Sheet "Employee_Skill_Assessment" @(
  @("employee_id","employee_name","position_code","position_name","skill_code","skill_name","current_level","assessed_by","assessment_date","evidence_url_or_notes"),
  @("EMP-SAMPLE-001","Nama Karyawan 1","MPL-SR-ENG","Senior Mine Planning Engineer","MINE-PLAN","Long-term mine planning","3","Assessor OD","2026-07-01","Isi bukti assessment real."),
  @("EMP-SAMPLE-002","Nama Karyawan 2","HSE-SR-OFC","Senior Safety Officer","HSE-RISK","Risk assessment","4","Assessor OD","2026-07-01","Isi bukti assessment real."),
  @("EMP-SAMPLE-003","Nama Karyawan 3","FIN-SR-ACC","Senior Management Accountant","FIN-COST","Mine cost analysis","3","Assessor OD","2026-07-01","Isi bukti assessment real."),
  @("EMP-SAMPLE-004","Nama Karyawan 4","DTA-LEAD","Data & Integration Lead","IT-DATA","Data architecture","4","Assessor OD","2026-07-01","Isi bukti assessment real."),
  @("EMP-SAMPLE-005","Nama Karyawan 5","MNT-SUP","Maintenance Supervisor","MNT-RCA","Root cause analysis","3","Assessor OD","2026-07-01","Isi bukti assessment real.")
)

$sheets += New-Sheet "Talent_Profile" @(
  @("employee_id","work_location","job_level","performance_y1","performance_y2","performance_y3","potential_score","readiness_score","technical_skills","behavioral_skills","certifications","projects","career_history","aspiration","strengths","weaknesses","iq_score","eq_score","leadership_score","talent_class"),
  @("EMP-SAMPLE-001","Binungan Site","JG6","88","90","87","86","82","Long-term mine planning; Deswik; reserve optimization","Systems thinking; decision making","POM; Deswik Advanced","Pit optimization 2026","Mine Engineer; Mine Planning Engineer","Mine Planning Superintendent","Mine planning; scheduling","Stakeholder alignment","124","84","86","Core Talent"),
  @("EMP-SAMPLE-002","Lati Site","JG6","89","87","90","85","80","Risk assessment; SMKP; incident investigation","Safety leadership; communication","AK3 Umum; POP","Critical risk control verification","Safety Officer; Senior Safety Officer","HSE Superintendent","Risk assessment; discipline","Trend analytics","116","88","87","Core Talent"),
  @("EMP-SAMPLE-003","Head Office","JG6","91","90","89","88","84","Budgeting; mine cost analysis; SAP FICO","Analytical thinking; collaboration","CMA; SAP FICO","Cost dashboard","Cost Accountant; Management Accountant","Finance Business Partner Manager","Cost analysis; modeling","Field exposure","128","86","85","High Potential"),
  @("EMP-SAMPLE-004","Head Office","JG6","92","90","88","92","86","Data architecture; SAP integration; cloud platform","Innovation; agile leadership","Azure Data Engineer; ITIL","Mine data platform","Business Analyst; Data Engineer","IT Manager","Data architecture; integration","Change adoption","132","88","90","High Potential"),
  @("EMP-SAMPLE-005","Binungan Workshop","JG7","86","88","85","83","81","Heavy equipment maintenance; reliability engineering; RCA","Safety leadership; team development","POP; Reliability Maintenance","Availability recovery","Mechanic; Planner; Supervisor","Maintenance Superintendent","RCA; maintenance planning","Predictive analytics","116","82","86","Core Talent")
)

$sheets += New-Sheet "Performance_Assessment" @(
  @("employee_id","assessment_year","performance_score","potential_score","readiness_score","matrix","classification","assessment_complete","reviewer","review_notes"),
  @("EMP-SAMPLE-001","2026","88","86","82","HIGH_PERFORMANCE_MEDIUM_POTENTIAL","PROMOTABLE","TRUE","HRBP","Isi review real."),
  @("EMP-SAMPLE-002","2026","89","85","80","HIGH_PERFORMANCE_MEDIUM_POTENTIAL","CORE_TALENT","TRUE","HRBP","Isi review real."),
  @("EMP-SAMPLE-003","2026","90","88","84","HIGH_PERFORMANCE_HIGH_POTENTIAL","READY_NOW","TRUE","HRBP","Isi review real."),
  @("EMP-SAMPLE-004","2026","90","92","86","HIGH_PERFORMANCE_HIGH_POTENTIAL","READY_NOW","TRUE","HRBP","Isi review real."),
  @("EMP-SAMPLE-005","2026","86","83","81","HIGH_PERFORMANCE_MEDIUM_POTENTIAL","CORE_TALENT","TRUE","HRBP","Isi review real.")
)

$sheets += New-Sheet "HSE_Compliance" @(
  @("employee_id","mcu_status","mcu_valid_until","simper_status","simper_valid_until","license_number","cert_status","cert_valid_until","incident_free_months","hse_notes"),
  @("EMP-SAMPLE-001","FIT","2027-05-10","ACTIVE","2027-03-15","SMP-REAL-001","ACTIVE","2027-09-20","54",""),
  @("EMP-SAMPLE-002","FIT_WITH_NOTE","2026-09-01","ACTIVE","2027-01-19","SMP-REAL-002","EXPIRING","2026-08-30","72",""),
  @("EMP-SAMPLE-003","FIT","2027-02-11","NOT_AVAILABLE","","","ACTIVE","2027-05-11","84","Office role."),
  @("EMP-SAMPLE-004","FIT","2027-04-01","NOT_AVAILABLE","","","ACTIVE","2027-12-12","79","Office role."),
  @("EMP-SAMPLE-005","FIT","2027-06-14","ACTIVE","2027-06-14","SMP-REAL-005","ACTIVE","2028-02-10","67","")
)

$sheets += New-Sheet "Goal_Cycles" @(
  @("cycle_external_id","cycle_name","start_date","end_date","status","source_system","last_synced_at"),
  @("ENTOMO-2026-H1","Performance Cycle 2026 H1","2026-01-01","2026-06-30","Closed","Entomo","2026-07-15T08:00:00"),
  @("ENTOMO-2026-H2","Performance Cycle 2026 H2","2026-07-01","2026-12-31","Active","Entomo","2026-07-15T08:00:00")
)

$sheets += New-Sheet "Employee_Goals" @(
  @("goal_external_id","employee_id","manager_id","cycle_external_id","goal_title","goal_description","goal_category","organization_objective","department_objective","target_value","actual_value","unit","achievement_percentage","weight","priority","status","start_date","due_date","completion_date","specific_status","measurable_status","achievable_status","relevant_status","time_bound_status","smart_percentage","source_system","source_updated_at","last_synced_at"),
  @("GOAL-001","EMP-SAMPLE-001","EMP-SAMPLE-005","ENTOMO-2026-H2","Improve mine plan accuracy","Tingkatkan akurasi rencana tambang bulanan.","Operational Excellence","Improve productivity","Improve planning accuracy","95","82","percent","86.32","25","High","On Track","2026-07-01","2026-12-31","","TRUE","TRUE","TRUE","TRUE","TRUE","100","Entomo","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("GOAL-002","EMP-SAMPLE-002","EMP-SAMPLE-005","ENTOMO-2026-H2","Close critical risk actions","Selesaikan action risiko kritikal tepat waktu.","HSE","Zero harm","Improve critical control","100","76","percent","76.00","25","Critical","At Risk","2026-07-01","2026-12-31","","TRUE","TRUE","TRUE","TRUE","TRUE","100","Entomo","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("GOAL-003","EMP-SAMPLE-003","EMP-SAMPLE-005","ENTOMO-2026-H2","Reduce cost variance","Turunkan variance biaya operasi.","Finance","Cost discipline","Budget control","5","3","percent variance","60.00","20","High","In Progress","2026-07-01","2026-12-31","","TRUE","TRUE","TRUE","TRUE","TRUE","100","Entomo","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("GOAL-004","EMP-SAMPLE-004","EMP-SAMPLE-005","ENTOMO-2026-H2","Stabilize data pipeline","Tingkatkan reliability pipeline integrasi.","Digital","Data reliability","Integration uptime","99","97","percent uptime","97.98","20","High","On Track","2026-07-01","2026-12-31","","TRUE","TRUE","TRUE","TRUE","TRUE","100","Entomo","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("GOAL-005","EMP-SAMPLE-005","","ENTOMO-2026-H2","Improve equipment availability","Naikkan availability alat utama.","Operational Excellence","Improve productivity","Maintenance reliability","92","88","percent","95.65","30","Critical","On Track","2026-07-01","2026-12-31","","TRUE","TRUE","TRUE","TRUE","TRUE","100","Entomo","2026-07-15T08:00:00","2026-07-15T08:00:00")
)

$sheets += New-Sheet "Goal_Progress" @(
  @("goal_external_id","progress_date","previous_actual_value","updated_actual_value","previous_achievement","updated_achievement","progress_description","updated_by","source_system","source_updated_at","last_synced_at"),
  @("GOAL-001","2026-07-31","75","82","78.95","86.32","Update July progress.","EMP-SAMPLE-001","Entomo","2026-07-31T08:00:00","2026-07-31T08:00:00"),
  @("GOAL-002","2026-07-31","70","76","70.00","76.00","Action close-out meningkat.","EMP-SAMPLE-002","Entomo","2026-07-31T08:00:00","2026-07-31T08:00:00"),
  @("GOAL-003","2026-07-31","2","3","40.00","60.00","Variance mulai turun.","EMP-SAMPLE-003","Entomo","2026-07-31T08:00:00","2026-07-31T08:00:00"),
  @("GOAL-004","2026-07-31","95","97","95.96","97.98","Pipeline lebih stabil.","EMP-SAMPLE-004","Entomo","2026-07-31T08:00:00","2026-07-31T08:00:00"),
  @("GOAL-005","2026-07-31","85","88","92.39","95.65","Availability membaik.","EMP-SAMPLE-005","Entomo","2026-07-31T08:00:00","2026-07-31T08:00:00")
)

$sheets += New-Sheet "PAT_Assessment" @(
  @("pat_external_id","employee_id","employee_name","assessment_year","pat_name","cycle_name","status","final_score","performance_rating","dynamic_fields_json","feedback360_strengths","feedback360_weaknesses","feedback360_comments","source_system","source_updated_at","last_synced_at"),
  @("PAT-001","EMP-SAMPLE-001","Nama Karyawan 1","2026","PAT 2026","Performance Cycle 2026 H2","In Progress","86","Exceed","[{""key"":""kpi"",""label"":""KPI"",""value"":86}]","Planning detail","Stakeholder alignment","Manager: progres baik.","SIL/PAT","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("PAT-002","EMP-SAMPLE-002","Nama Karyawan 2","2026","PAT 2026","Performance Cycle 2026 H2","In Progress","82","Meet","[{""key"":""kpi"",""label"":""KPI"",""value"":82}]","Safety discipline","Data trend analysis","Manager: perlu penguatan analytics.","SIL/PAT","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("PAT-003","EMP-SAMPLE-003","Nama Karyawan 3","2026","PAT 2026","Performance Cycle 2026 H2","Reviewed","90","Exceed","[{""key"":""kpi"",""label"":""KPI"",""value"":90}]","Cost insight","Field exposure","Peer: sangat support budget review.","SIL/PAT","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("PAT-004","EMP-SAMPLE-004","Nama Karyawan 4","2026","PAT 2026","Performance Cycle 2026 H2","Reviewed","91","Exceed","[{""key"":""kpi"",""label"":""KPI"",""value"":91}]","Integration quality","Change management","Manager: high ownership.","SIL/PAT","2026-07-15T08:00:00","2026-07-15T08:00:00"),
  @("PAT-005","EMP-SAMPLE-005","Nama Karyawan 5","2026","PAT 2026","Performance Cycle 2026 H2","In Progress","85","Meet","[{""key"":""kpi"",""label"":""KPI"",""value"":85}]","Maintenance execution","Predictive analytics","Manager: stabil dan kuat di RCA.","SIL/PAT","2026-07-15T08:00:00","2026-07-15T08:00:00")
)

$sheets += New-Sheet "Promotion_Requests" @(
  @("employee_id","employee_name","employee_status","company_name","business_area","personnel_area","personnel_subarea","position_code","position_name","business_unit","business_unit_name","directorate_code","directorate_name","division_code","division_name","department_code","department_name","talent_class","eligibility_status","year_of_service","year_of_service_position","join_date","last_promotion_date","promotion_plan","promotion_plan_desc","justification","project_assignment","promotion_status","next_status","pic_id","pic_name","pic_type","changed_by","changed_by_name","changed_on"),
  @("EMP-SAMPLE-001","Nama Karyawan 1","ACTIVE","PT Berau Coal","Mining","Binungan","Mine Planning","MPL-SR-ENG","Senior Mine Planning Engineer","BU1","Mining","OPS","Operations","MIN","Mining","MPL","Mine Planning","Core Talent","Eligible","8.2","3.1","2018-05-16","2023-05-16","PROMO","Promotion to Superintendent","Kinerja dan readiness baik.","Pit optimization 2026","Submitted","Approved Div. Head","HRBP-001","Nama HRBP","HRBP","HR-001","Nama HR","2026-07-15"),
  @("EMP-SAMPLE-002","Nama Karyawan 2","ACTIVE","PT Berau Coal","Mining","Lati","HSE","HSE-SR-OFC","Senior Safety Officer","BU2","HSE","HSE","HSE","SFT","Safety","SFT","HSE","Core Talent","Eligible","8.8","4.0","2017-10-10","2022-10-10","PROMO","Promotion to Superintendent","HSE leadership kuat.","Critical risk control","Verified by HRBP","Verified by HROD","HRBP-001","Nama HRBP","HRBP","HR-001","Nama HR","2026-07-15"),
  @("EMP-SAMPLE-003","Nama Karyawan 3","ACTIVE","PT Berau Coal","Head Office","HO","Finance","FIN-SR-ACC","Senior Management Accountant","BU3","Finance","FIN","Finance","ACC","Accounting & Control","FIN","Finance","High Potential","Eligible","11.5","3.5","2015-01-20","2022-01-20","PROMO","Promotion to Manager","Financial impact kuat.","Cost dashboard","Approved Div. Head","Verified by HRBP","HRBP-002","Nama HRBP","HRBP","HR-001","Nama HR","2026-07-15"),
  @("EMP-SAMPLE-004","Nama Karyawan 4","ACTIVE","PT Berau Coal","Head Office","HO","IT","DTA-LEAD","Data & Integration Lead","BU4","IT","IT","IT","DIG","Digital & Infrastructure","DTA","Information Technology","High Potential","Eligible","6.0","2.0","2020-07-02","2024-07-02","PROMO","Promotion to IT Manager","Data platform berdampak.","Mine data platform","Verified by HROD","Approved Dir./Bus. Head","HRBP-003","Nama HRBP","HRBP","HR-001","Nama HR","2026-07-15"),
  @("EMP-SAMPLE-005","Nama Karyawan 5","ACTIVE","PT Berau Coal","Mining","Binungan","Maintenance","MNT-SUP","Maintenance Supervisor","BU1","Mining","OPS","Operations","MNT","Maintenance","PLT","Plant Maintenance","Core Talent","Need Review","15.9","5.2","2010-08-14","2021-08-14","PROMO","Promotion to Superintendent","Perlu validasi readiness.","Availability recovery","Submitted","Approved Div. Head","HRBP-004","Nama HRBP","HRBP","HR-001","Nama HR","2026-07-15")
)

$sheets += New-Sheet "Coaching_Governance" @(
  @("coaching_id","employee_id","employee_name","coach_name","coaching_date","session_number","total_sessions","status","goals","discussion_notes","result_outcome","follow_up_action"),
  @("COACH-001","EMP-SAMPLE-001","Nama Karyawan 1","Nama Coach 1","2026-07-10","1","3","IN_PROGRESS","Stakeholder alignment","Diskusi prioritas lintas fungsi.","Ada progres komunikasi.","Review dua mingguan."),
  @("COACH-002","EMP-SAMPLE-002","Nama Karyawan 2","Nama Coach 2","2026-07-12","1","3","IN_PROGRESS","Risk analytics","Diskusi penggunaan data HSE trend.","Perlu latihan dashboard.","Buat report bulanan."),
  @("COACH-003","EMP-SAMPLE-003","Nama Karyawan 3","Nama Coach 3","2026-07-14","2","3","COMPLETED","Business partnering","Diskusi support cost review.","Outcome baik.","Lanjut project cost control."),
  @("COACH-004","EMP-SAMPLE-004","Nama Karyawan 4","Nama Coach 4","2026-07-16","1","4","IN_PROGRESS","Change management","Diskusi adoption user.","Perlu stakeholder map.","Review adoption plan."),
  @("COACH-005","EMP-SAMPLE-005","Nama Karyawan 5","Nama Coach 5","2026-07-18","1","3","NOT_STARTED","Predictive maintenance","Belum mulai.","Belum ada outcome.","Jadwalkan sesi pertama.")
)

$sheets += New-Sheet "Learning_IDP" @(
  @("idp_id","employee_id","employee_name","competency_gap","recommendation_type","recommendation_name","project_ojt_plan","coaching_plan","certification_plan","success_metric","timeline","priority","project_status","coaching_status","certification_status","overall_status","learning_provider","linked_goal_external_id"),
  @("IDP-001","EMP-SAMPLE-001","Nama Karyawan 1","Stakeholder alignment","Coaching","Stakeholder Alignment Sprint","Lead planning review lintas fungsi.","Mentoring oleh superintendent.","Short course influencing.","Review disetujui stakeholders.","90 hari","High","On Progress","On Progress","Not Started","On Progress","Internal Academy","GOAL-001"),
  @("IDP-002","EMP-SAMPLE-002","Nama Karyawan 2","Trend analytics","Training","HSE Data Analytics","Buat trend dashboard HSE.","Coaching dengan HSE manager.","Training analytics dasar.","Dashboard dipakai review bulanan.","90 hari","Medium","On Progress","On Progress","Not Started","On Progress","LMS Self-paced","GOAL-002"),
  @("IDP-003","EMP-SAMPLE-003","Nama Karyawan 3","Field exposure","Project Assignment","Mine Cost Field Exposure","Ikut site cost review.","Mentoring finance business partner.","Finance for mining ops.","Variance analysis lebih actionable.","6 bulan","High","On Progress","Completed","Completed","In Progress","Internal Academy","GOAL-003"),
  @("IDP-004","EMP-SAMPLE-004","Nama Karyawan 4","Change adoption","Mentoring","Digital Adoption Mentoring","Pimpin adoption pilot.","Mentoring IT Manager.","Change management course.","Adoption rate meningkat.","6 bulan","High","On Progress","On Progress","Not Started","On Progress","External Provider","GOAL-004"),
  @("IDP-005","EMP-SAMPLE-005","Nama Karyawan 5","Predictive analytics","Certification","Reliability Analytics","Mini project predictive maintenance.","Coaching maintenance manager.","Reliability analytics certification.","Downtime trend turun.","6 bulan","Medium","Not Started","Not Started","Not Started","Not Started","External Certification Body","GOAL-005")
)

$sheets += New-Sheet "Career_Evolution" @(
  @("employee_id","employee_name","current_position","target_position","join_date","last_promotion_date","next_milestone","future_growth_path","readiness","successor_candidate_employee_id","successor_candidate_name"),
  @("EMP-SAMPLE-001","Nama Karyawan 1","Senior Mine Planning Engineer","Mine Planning Superintendent","2018-05-16","2023-05-16","Complete OJT project","Senior Mine Planning Engineer -> Mine Planning Superintendent","Ready with development","",""),
  @("EMP-SAMPLE-002","Nama Karyawan 2","Senior Safety Officer","HSE Superintendent","2017-10-10","2022-10-10","Close coaching action items","Senior Safety Officer -> HSE Superintendent","Ready for validation","",""),
  @("EMP-SAMPLE-003","Nama Karyawan 3","Senior Management Accountant","Finance Business Partner Manager","2015-01-20","2022-01-20","Finish formal certification","Senior Management Accountant -> Finance Business Partner Manager","Ready for validation","",""),
  @("EMP-SAMPLE-004","Nama Karyawan 4","Data & Integration Lead","IT Manager","2020-07-02","2024-07-02","Complete adoption project","Data & Integration Lead -> IT Manager","Ready for validation","",""),
  @("EMP-SAMPLE-005","Nama Karyawan 5","Maintenance Supervisor","Maintenance Superintendent","2010-08-14","2021-08-14","Complete analytics IDP","Maintenance Supervisor -> Maintenance Superintendent","Ready with development","","")
)

$sheets += New-Sheet "Retirement_Contract" @(
  @("employee_id","employee_name","employment_type","birth_date","retirement_age","retirement_date","contract_end_date","retirement_extended_until","retirement_notes","retirement_status","replacement_plan","knowledge_transfer_status"),
  @("EMP-SAMPLE-001","Nama Karyawan 1","PERMANENT","1991-04-12","56","2047-04-12","","","","Normal","",""),
  @("EMP-SAMPLE-002","Nama Karyawan 2","PERMANENT","1990-08-21","56","2046-08-21","","","","Normal","",""),
  @("EMP-SAMPLE-003","Nama Karyawan 3","PERMANENT","1988-01-09","56","2044-01-09","","","","Normal","",""),
  @("EMP-SAMPLE-004","Nama Karyawan 4","CONTRACT","1993-02-14","","","2027-07-02","","Contract ends 2027.","Normal","Review renewal H1 2027","Not Started"),
  @("EMP-SAMPLE-005","Nama Karyawan 5","PERMANENT","1984-06-28","56","2040-06-28","","","","Normal","Identify successor","In Progress")
)

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$tempRoot = Join-Path (Get-Location) ".tmp-xlsx-template"
if (Test-Path $tempRoot) {
  $resolvedTemp = [System.IO.Path]::GetFullPath($tempRoot)
  $resolvedWorkspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
  if (-not $resolvedTemp.StartsWith($resolvedWorkspace)) {
    throw "Refusing to delete temp path outside workspace: $resolvedTemp"
  }
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path "$tempRoot/_rels","$tempRoot/xl/_rels","$tempRoot/xl/worksheets","$tempRoot/docProps" | Out-Null

$sheetEntries = New-Object System.Text.StringBuilder
$relationshipEntries = New-Object System.Text.StringBuilder
$overrideEntries = New-Object System.Text.StringBuilder

for ($i = 0; $i -lt $sheets.Count; $i++) {
  $sheetId = $i + 1
  $sheetName = $sheets[$i].Name
  Write-Utf8NoBom "$tempRoot/xl/worksheets/sheet$sheetId.xml" (Sheet-Xml $sheets[$i])
  [void]$sheetEntries.Append("<sheet name=`"$(Escape-Xml $sheetName)`" sheetId=`"$sheetId`" r:id=`"rId$sheetId`"/>")
  [void]$relationshipEntries.Append("<Relationship Id=`"rId$sheetId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$sheetId.xml`"/>")
  [void]$overrideEntries.Append("<Override PartName=`"/xl/worksheets/sheet$sheetId.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>")
}

$stylesRelId = $sheets.Count + 1
[void]$relationshipEntries.Append("<Relationship Id=`"rId$stylesRelId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`" Target=`"styles.xml`"/>")

Write-Utf8NoBom "$tempRoot/[Content_Types].xml" ("<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?>" +
  "<Types xmlns=`"http://schemas.openxmlformats.org/package/2006/content-types`">" +
  "<Default Extension=`"rels`" ContentType=`"application/vnd.openxmlformats-package.relationships+xml`"/><Default Extension=`"xml`" ContentType=`"application/xml`"/>" +
  "<Override PartName=`"/xl/workbook.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml`"/>" +
  "<Override PartName=`"/xl/styles.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml`"/>" +
  "<Override PartName=`"/docProps/core.xml`" ContentType=`"application/vnd.openxmlformats-package.core-properties+xml`"/>" +
  "<Override PartName=`"/docProps/app.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.extended-properties+xml`"/>" +
  "$overrideEntries</Types>")

Write-Utf8NoBom "$tempRoot/_rels/.rels" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Relationships xmlns=`"http://schemas.openxmlformats.org/package/2006/relationships`"><Relationship Id=`"rId1`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument`" Target=`"xl/workbook.xml`"/><Relationship Id=`"rId2`" Type=`"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties`" Target=`"docProps/core.xml`"/><Relationship Id=`"rId3`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties`" Target=`"docProps/app.xml`"/></Relationships>"

Write-Utf8NoBom "$tempRoot/xl/workbook.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><workbook xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`"><sheets>$sheetEntries</sheets></workbook>"
Write-Utf8NoBom "$tempRoot/xl/_rels/workbook.xml.rels" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Relationships xmlns=`"http://schemas.openxmlformats.org/package/2006/relationships`">$relationshipEntries</Relationships>"

Write-Utf8NoBom "$tempRoot/xl/styles.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><styleSheet xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`"><fonts count=`"2`"><font><sz val=`"11`"/><color theme=`"1`"/><name val=`"Calibri`"/><family val=`"2`"/></font><font><b/><sz val=`"11`"/><color rgb=`"FFFFFFFF`"/><name val=`"Calibri`"/><family val=`"2`"/></font></fonts><fills count=`"3`"><fill><patternFill patternType=`"none`"/></fill><fill><patternFill patternType=`"gray125`"/></fill><fill><patternFill patternType=`"solid`"><fgColor rgb=`"FF1F4E78`"/><bgColor indexed=`"64`"/></patternFill></fill></fills><borders count=`"1`"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=`"1`"><xf numFmtId=`"0`" fontId=`"0`" fillId=`"0`" borderId=`"0`"/></cellStyleXfs><cellXfs count=`"2`"><xf numFmtId=`"0`" fontId=`"0`" fillId=`"0`" borderId=`"0`" xfId=`"0`"/><xf numFmtId=`"0`" fontId=`"1`" fillId=`"2`" borderId=`"0`" xfId=`"0`" applyFont=`"1`" applyFill=`"1`"/></cellXfs><cellStyles count=`"1`"><cellStyle name=`"Normal`" xfId=`"0`" builtinId=`"0`"/></cellStyles></styleSheet>"

$createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Utf8NoBom "$tempRoot/docProps/core.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:dcmitype=`"http://purl.org/dc/dcmitype/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:title>HR Real Sample Data Template</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:modified></cp:coreProperties>"
Write-Utf8NoBom "$tempRoot/docProps/app.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Properties xmlns=`"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties`" xmlns:vt=`"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes`"><Application>Codex</Application></Properties>"

if (Test-Path $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($resolvedOutput, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $basePath = [System.IO.Path]::GetFullPath($tempRoot)
  Get-ChildItem -LiteralPath $tempRoot -Recurse -File | ForEach-Object {
    $fullName = [System.IO.Path]::GetFullPath($_.FullName)
    $relativeName = $fullName.Substring($basePath.Length).TrimStart('\','/')
    $entryName = $relativeName.Replace('\','/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $fullName, $entryName) | Out-Null
  }
}
finally {
  $archive.Dispose()
}
Remove-Item -LiteralPath $tempRoot -Recurse -Force

Write-Output "Created $resolvedOutput"
