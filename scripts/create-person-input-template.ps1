param(
  [string]$OutputPath = "requirements/HR_Person_Based_Input_Template_5_Employees.xlsx"
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

$headers = @(
  "ID Karyawan",
  "NIK",
  "Nama",
  "Status Karyawan",
  "Tanggal Lahir",
  "Age",
  "Telp",
  "Email",
  "Site Penugasan",
  "Status Site",
  "Pendidikan Terakhir",
  "Jurusan",
  "Directorate",
  "Division",
  "Department",
  "Personnel Subarea",
  "Jabatan Struktural",
  "Jabatan Fungsional",
  "Current Position",
  "Job Name",
  "Job Level",
  "Join Date",
  "Supervisor Personnel Number",
  "Supervisor Name",
  "Supervisor Position",
  "Performance Scale - Year -1",
  "Performance Scale - Year -2",
  "Performance Scale - Year -3",
  "Education Scale",
  "List Certification",
  "Roles / Job Description",
  "Career Aspiration",
  "Current Position Duration",
  "Successor",
  "Career History",
  "Business Size",
  "Project Involvement",
  "Project Impact A",
  "Project Scope",
  "Fast Track (DP) Scale",
  "Technical Competency Scale",
  "BU Visibility Scale",
  "Talent Class",
  "Last Promotion",
  "MCU",
  "Simper / SID",
  "HSE CT Summary (Last 3 Years)",
  "IQ",
  "EQ",
  "Leadership",
  "Strength",
  "Weakness",
  "Time in Position",
  "Status Promotion",
  "Next / PIC",
  "Skill Gap",
  "Learning Type",
  "Skill Improvement",
  "Program / Training / Project Name",
  "Provider",
  "Timeline",
  "Learning Status",
  "Success Criteria",
  "Retirement Date",
  "Retirement Status",
  "Kolom Tambahan 1",
  "Kolom Tambahan 2",
  "Catatan Senior"
)

$ids = @("EMP-REAL-001","EMP-REAL-002","EMP-REAL-003","EMP-REAL-004","EMP-REAL-005")
$blankRows = @()
foreach ($id in $ids) {
  $row = @()
  foreach ($header in $headers) {
    if ($header -eq "ID Karyawan") { $row += $id }
    elseif ($header -eq "Status Karyawan") { $row += "ACTIVE" }
    else { $row += "" }
  }
  $blankRows += ,$row
}

$example = @(
  "EMP-CONTOH-001",
  "NIK001",
  "Karyawan A",
  "ACTIVE",
  "1990-01-15",
  "36",
  "081234567890",
  "karyawan.a@company.co.id",
  "Head Office",
  "ACTIVE",
  "S1",
  "Mining Engineering",
  "Operations",
  "Mining",
  "Mine Planning",
  "Head Office",
  "Senior Engineer",
  "Mine Planning Engineer",
  "Senior Mine Planning Engineer",
  "Mine Planning Engineer",
  "JG6",
  "2016-06-01",
  "SPV001",
  "Nama Atasan",
  "Mine Planning Superintendent",
  "88",
  "90",
  "89",
  "4",
  "POM; Deswik Advanced",
  "Long-term mine planning; reserve optimization; scheduling",
  "Mine Planning Superintendent",
  "3 tahun 5 bulan",
  "Karyawan B",
  "Mine Engineer; Mine Planning Engineer",
  "Large",
  "Pit optimization project",
  "Produktivitas naik 8%",
  "Lintas fungsi mine planning dan operations",
  "3",
  "4",
  "4",
  "Core Talent",
  "2022-06-01",
  "FIT",
  "ACTIVE",
  "MCU FIT, Simper/SID ACTIVE, 54 bulan tanpa incident tercatat.",
  "124",
  "86",
  "88",
  "Mine planning; analytical thinking",
  "Stakeholder alignment; cost control",
  "3 tahun 5 bulan",
  "Submitted",
  "Approved Div. Head / Nama HRBP",
  "Stakeholder alignment",
  "70% Experience Learning",
  "Stakeholder alignment",
  "Lead cross-functional planning review",
  "Internal Academy",
  "90 hari",
  "In Progress",
  "Output review diterima stakeholder",
  "2046-01-15",
  "Normal",
  "",
  "",
  "Contoh saja, ganti dengan data real."
)

$sheets = @()
$sheets += New-Sheet "README" @(
  @("Panduan","Isi data berdasarkan orang/karyawan. Satu baris mewakili satu karyawan real."),
  @("Kolom","Nama kolom mengikuti label yang tampil di Talent Card, Promotion, Learning, dan Retire; tidak memakai prefix teknis."),
  @("Duplikasi","Kolom seperti Nama, Current Position, Last Promotion, dan Age hanya dibuat satu kali walaupun dipakai beberapa menu."),
  @("Jumlah sample","Isi 5 orang saja."),
  @("Tanggal","Gunakan format YYYY-MM-DD."),
  @("Banyak item","Pisahkan dengan titik koma, contoh: Skill A; Skill B; Skill C."),
  @("Probation","Tidak ada kolom probation/onboarding karena diminta dikecualikan.")
)

$rows = @()
$rows += ,$headers
$rows += $blankRows
$sheets += New-Sheet "Data Orang" $rows
$sheets += New-Sheet "Contoh Pengisian" @($headers, $example)

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$tempRoot = Join-Path (Get-Location) ".tmp-person-xlsx"
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
Write-Utf8NoBom "$tempRoot/docProps/core.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:title>HR Person Based Input Template</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$createdAt</dcterms:modified></cp:coreProperties>"
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
