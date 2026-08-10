param(
  [string]$OutputPath = "requirements/HR_Workspace_Input_Template_5_Employees.xlsx"
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

$ids = @("EMP-REAL-001","EMP-REAL-002","EMP-REAL-003","EMP-REAL-004","EMP-REAL-005")

$sheets = @()
$sheets += New-Sheet "README" @(
  @("Panduan","Workbook ini dibuat sederhana untuk diisi senior/atasan dengan data real 5 orang."),
  @("Aturan utama","Gunakan employee_id yang sama di semua sheet agar data antar-workspace bisa diintegrasikan."),
  @("Jumlah data","Isi hanya 5 orang sample real."),
  @("Probation","Workspace probation sengaja tidak dibuat dan tidak perlu diisi."),
  @("Format tanggal","Gunakan YYYY-MM-DD, contoh 2026-08-04."),
  @("Kolom berisi banyak item","Pisahkan dengan titik koma, contoh: Skill A; Skill B; Skill C.")
)

$sheets += New-Sheet "Employee Master" @(
  @("employee_id","nama_lengkap","email","nik","status_karyawan","tipe_karyawan","jenis_kelamin","tanggal_lahir","tanggal_masuk","lokasi_kerja","directorate","division","department","posisi_saat_ini","job_level","atasan_employee_id","nama_atasan","pendidikan_terakhir","catatan"),
  @($ids[0],"","","","ACTIVE","PERMANENT","","","","","","","","","","","","",""),
  @($ids[1],"","","","ACTIVE","PERMANENT","","","","","","","","","","","","",""),
  @($ids[2],"","","","ACTIVE","PERMANENT","","","","","","","","","","","","",""),
  @($ids[3],"","","","ACTIVE","PERMANENT","","","","","","","","","","","","",""),
  @($ids[4],"","","","ACTIVE","PERMANENT","","","","","","","","","","","","","")
)

$sheets += New-Sheet "OD Workspace" @(
  @("employee_id","nama_lengkap","posisi_saat_ini","job_description_ringkas","kompetensi_wajib_posisi","level_wajib","level_karyawan_saat_ini","gap_kompetensi","posisi_target","successor_candidate","status_mapping_od","catatan_atasan"),
  @($ids[0],"","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","")
)

$sheets += New-Sheet "Talent Workspace" @(
  @("employee_id","nama_lengkap","performance_2024","performance_2025","performance_2026","potential_score","readiness_score","talent_class","strengths","weaknesses","career_history","aspiration","certifications","projects_penting","rekomendasi_talent","catatan_panel"),
  @($ids[0],"","","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","","")
)

$sheets += New-Sheet "Goal Setting Workspace" @(
  @("employee_id","nama_lengkap","cycle_name","goal_1","target_1","actual_1","achievement_1_percent","goal_2","target_2","actual_2","achievement_2_percent","status_goal","smart_complete_percent","pat_final_score","performance_rating","catatan_goal_pat"),
  @($ids[0],"","Performance Cycle 2026","","","","","","","","","","","","",""),
  @($ids[1],"","Performance Cycle 2026","","","","","","","","","","","","",""),
  @($ids[2],"","Performance Cycle 2026","","","","","","","","","","","","",""),
  @($ids[3],"","Performance Cycle 2026","","","","","","","","","","","","",""),
  @($ids[4],"","Performance Cycle 2026","","","","","","","","","","","","","")
)

$sheets += New-Sheet "Learning Workspace" @(
  @("employee_id","nama_lengkap","kompetensi_gap_prioritas","idp_70_project_ojt","idp_20_coaching_mentoring","idp_10_training_certification","learning_provider","target_selesai","status_idp","success_metric","catatan_learning"),
  @($ids[0],"","","","","","","","","",""),
  @($ids[1],"","","","","","","","","",""),
  @($ids[2],"","","","","","","","","",""),
  @($ids[3],"","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","")
)

$sheets += New-Sheet "Coaching Workspace" @(
  @("employee_id","nama_lengkap","nama_coach","tanggal_coaching_terakhir","jumlah_sesi","total_rencana_sesi","status_coaching","tujuan_coaching","ringkasan_diskusi","hasil_coaching","follow_up_action","catatan_atasan"),
  @($ids[0],"","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","")
)

$sheets += New-Sheet "Promotion Workspace" @(
  @("employee_id","nama_lengkap","posisi_saat_ini","posisi_promosi_target","eligibility_status","year_of_service","year_in_position","last_promotion_date","promotion_plan","justification","project_assignment","promotion_status","next_status","pic_hrbp","catatan_promosi"),
  @($ids[0],"","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","")
)

$sheets += New-Sheet "Retire Contract Workspace" @(
  @("employee_id","nama_lengkap","tipe_karyawan","tanggal_lahir","usia_pensiun","tanggal_pensiun","tanggal_akhir_kontrak","perpanjangan_sampai","status_retirement_contract","replacement_plan","knowledge_transfer_status","catatan"),
  @($ids[0],"","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","")
)

$sheets += New-Sheet "HSE Workspace" @(
  @("employee_id","nama_lengkap","mcu_status","mcu_valid_until","simper_status","simper_valid_until","license_number","certification_status","certification_valid_until","incident_free_months","catatan_hse"),
  @($ids[0],"","","","","","","","","",""),
  @($ids[1],"","","","","","","","","",""),
  @($ids[2],"","","","","","","","","",""),
  @($ids[3],"","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","")
)

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$tempRoot = Join-Path (Get-Location) ".tmp-workspace-xlsx"
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
  Write-Utf8NoBom "$tempRoot/xl/worksheets/sheet$sheetId.xml" (Sheet-Xml $sheets[$i])
  [void]$sheetEntries.Append("<sheet name=`"$(Escape-Xml $sheets[$i].Name)`" sheetId=`"$sheetId`" r:id=`"rId$sheetId`"/>")
  [void]$relationshipEntries.Append("<Relationship Id=`"rId$sheetId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$sheetId.xml`"/>")
  [void]$overrideEntries.Append("<Override PartName=`"/xl/worksheets/sheet$sheetId.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>")
}

$stylesRelId = $sheets.Count + 1
[void]$relationshipEntries.Append("<Relationship Id=`"rId$stylesRelId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`" Target=`"styles.xml`"/>")

Write-Utf8NoBom "$tempRoot/[Content_Types].xml" ("<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Types xmlns=`"http://schemas.openxmlformats.org/package/2006/content-types`"><Default Extension=`"rels`" ContentType=`"application/vnd.openxmlformats-package.relationships+xml`"/><Default Extension=`"xml`" ContentType=`"application/xml`"/><Override PartName=`"/xl/workbook.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml`"/><Override PartName=`"/xl/styles.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml`"/><Override PartName=`"/docProps/core.xml`" ContentType=`"application/vnd.openxmlformats-package.core-properties+xml`"/><Override PartName=`"/docProps/app.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.extended-properties+xml`"/>$overrideEntries</Types>")
Write-Utf8NoBom "$tempRoot/_rels/.rels" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Relationships xmlns=`"http://schemas.openxmlformats.org/package/2006/relationships`"><Relationship Id=`"rId1`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument`" Target=`"xl/workbook.xml`"/><Relationship Id=`"rId2`" Type=`"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties`" Target=`"docProps/core.xml`"/><Relationship Id=`"rId3`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties`" Target=`"docProps/app.xml`"/></Relationships>"
Write-Utf8NoBom "$tempRoot/xl/workbook.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><workbook xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`"><sheets>$sheetEntries</sheets></workbook>"
Write-Utf8NoBom "$tempRoot/xl/_rels/workbook.xml.rels" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Relationships xmlns=`"http://schemas.openxmlformats.org/package/2006/relationships`">$relationshipEntries</Relationships>"
Write-Utf8NoBom "$tempRoot/xl/styles.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><styleSheet xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`"><fonts count=`"2`"><font><sz val=`"11`"/><name val=`"Calibri`"/></font><font><b/><sz val=`"11`"/><color rgb=`"FFFFFFFF`"/><name val=`"Calibri`"/></font></fonts><fills count=`"3`"><fill><patternFill patternType=`"none`"/></fill><fill><patternFill patternType=`"gray125`"/></fill><fill><patternFill patternType=`"solid`"><fgColor rgb=`"FF1F4E78`"/><bgColor indexed=`"64`"/></patternFill></fill></fills><borders count=`"1`"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=`"1`"><xf numFmtId=`"0`" fontId=`"0`" fillId=`"0`" borderId=`"0`"/></cellStyleXfs><cellXfs count=`"2`"><xf numFmtId=`"0`" fontId=`"0`" fillId=`"0`" borderId=`"0`" xfId=`"0`"/><xf numFmtId=`"0`" fontId=`"1`" fillId=`"2`" borderId=`"0`" xfId=`"0`" applyFont=`"1`" applyFill=`"1`"/></cellXfs><cellStyles count=`"1`"><cellStyle name=`"Normal`" xfId=`"0`" builtinId=`"0`"/></cellStyles></styleSheet>"
$createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Utf8NoBom "$tempRoot/docProps/core.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:title>HR Workspace Input Template</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:modified></cp:coreProperties>"
Write-Utf8NoBom "$tempRoot/docProps/app.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Properties xmlns=`"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties`"><Application>Codex</Application></Properties>"

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
