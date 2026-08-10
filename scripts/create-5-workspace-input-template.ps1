param(
  [string]$OutputPath = "requirements/HR_5_Workspace_Input_Template_5_Employees.xlsx"
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
  @("Panduan","Workbook ini mengikuti 5 workspace di dashboard: Onboarding Transition, Organization Development, Talent, Learning, dan Retire."),
  @("Cara isi","Senior cukup isi data real per karyawan pada sheet workspace terkait. Tidak perlu mengikuti tabel database teknis."),
  @("Relasi","employee_id harus sama di semua sheet supaya data bisa digabung saat integrasi."),
  @("Jumlah sample","Isi 5 orang real saja."),
  @("Tanggal","Gunakan format YYYY-MM-DD."),
  @("Banyak item","Pisahkan dengan titik koma, contoh: Skill A; Skill B; Skill C."),
  @("Catatan probation","Kalau workspace probation tetap dikecualikan, abaikan sheet 01 Onboarding dan isi 4 workspace lainnya saja.")
)

$sheets += New-Sheet "01 Onboarding Transition" @(
  @("employee_id","nama_lengkap","email","nik","tanggal_masuk","department","posisi","atasan","status_probation","progress_task_onboarding","status_coaching_probation","tanggal_presentasi_probation","hasil_presentasi","score_presentasi","catatan_onboarding"),
  @($ids[0],"","","","","","","","Tidak diisi jika probation dikecualikan","","","","","",""),
  @($ids[1],"","","","","","","","Tidak diisi jika probation dikecualikan","","","","","",""),
  @($ids[2],"","","","","","","","Tidak diisi jika probation dikecualikan","","","","","",""),
  @($ids[3],"","","","","","","","Tidak diisi jika probation dikecualikan","","","","","",""),
  @($ids[4],"","","","","","","","Tidak diisi jika probation dikecualikan","","","","","","")
)

$sheets += New-Sheet "02 Organization Development" @(
  @("employee_id","nama_lengkap","directorate","division","department","posisi_saat_ini","job_level","job_description_ringkas","required_skills_posisi","required_skill_level","current_skill_level","gap_kompetensi","organization_structure_notes","position_current_holder","mobility_target_position","idp_need_from_od","catatan_od"),
  @($ids[0],"","","","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","","","")
)

$sheets += New-Sheet "03 Talent" @(
  @("employee_id","nama_lengkap","posisi_saat_ini","department","promotion_status","target_promosi","promotion_justification","development_program","rotation_readiness","rotation_target_area","skill_needs","talent_dictionary_skill","talent_dictionary_level","performance_2024","performance_2025","performance_2026","potential_score","readiness_score","talent_class","strengths","weaknesses","career_history","certifications","projects_penting","aspiration","catatan_talent"),
  @($ids[0],"","","","","","","","","","","","","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","","","","","","","","","","","","")
)

$sheets += New-Sheet "04 Learning" @(
  @("employee_id","nama_lengkap","idp_priority","competency_gap","recommended_learning","training_program","certification_plan","assignment_project","coaching_plan","mentoring_plan","learning_provider","target_completion_date","status_learning","success_metric","catatan_learning"),
  @($ids[0],"","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","")
)

$sheets += New-Sheet "05 Retire" @(
  @("employee_id","nama_lengkap","tipe_karyawan","tanggal_lahir","usia_pensiun","tanggal_pensiun","tanggal_akhir_kontrak","remaining_time","retirement_status","risk_status","replacement_plan","successor_candidate","knowledge_transfer_status","extension_until","catatan_retire"),
  @($ids[0],"","","","","","","","","","","","","",""),
  @($ids[1],"","","","","","","","","","","","","",""),
  @($ids[2],"","","","","","","","","","","","","",""),
  @($ids[3],"","","","","","","","","","","","","",""),
  @($ids[4],"","","","","","","","","","","","","","")
)

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$tempRoot = Join-Path (Get-Location) ".tmp-5-workspace-xlsx"
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
Write-Utf8NoBom "$tempRoot/docProps/core.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:title>HR 5 Workspace Input Template</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:modified></cp:coreProperties>"
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
