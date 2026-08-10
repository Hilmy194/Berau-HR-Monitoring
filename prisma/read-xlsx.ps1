param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipText($zip, [string]$entryPath) {
  $entry = $zip.GetEntry($entryPath)
  if (-not $entry) { return $null }
  $reader = [System.IO.StreamReader]::new($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-ColumnNumber([string]$cellRef) {
  $letters = $cellRef -replace '[0-9]', ''
  $number = 0
  foreach ($char in $letters.ToCharArray()) {
    $number = ($number * 26) + ([int][char]$char - [int][char]'A' + 1)
  }
  return $number
}

function Get-CellValue($cell, $sharedStrings) {
  $value = $cell.v
  if ($null -eq $value -and $cell.is) { $value = $cell.is.InnerText }
  if ($cell.t -eq 's' -and "$value" -match '^\d+$') { return $sharedStrings[[int]$value] }
  return "$value"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
  $sharedStrings = @()
  $sharedXmlText = Read-ZipText $zip 'xl/sharedStrings.xml'
  if ($sharedXmlText) {
    [xml]$sharedXml = $sharedXmlText
    foreach ($item in $sharedXml.sst.si) {
      $sharedStrings += $item.InnerText
    }
  }

  [xml]$workbook = Read-ZipText $zip 'xl/workbook.xml'
  [xml]$rels = Read-ZipText $zip 'xl/_rels/workbook.xml.rels'
  $relMap = @{}
  foreach ($rel in $rels.Relationships.Relationship) {
    $relMap[$rel.Id] = $rel.Target
  }

  $sheets = @()
  foreach ($sheet in $workbook.workbook.sheets.sheet) {
    $relationshipId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target = $relMap[$relationshipId]
    $sheetPath = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { "xl/$target" }
    $sheetPath = $sheetPath -replace 'xl/worksheets/../', 'xl/'
    [xml]$sheetXml = Read-ZipText $zip $sheetPath

    $rows = @()
    foreach ($row in $sheetXml.worksheet.sheetData.row) {
      $values = @{}
      $maxColumn = 0
      foreach ($cell in $row.c) {
        $column = Get-ColumnNumber $cell.r
        $values[$column] = Get-CellValue $cell $sharedStrings
        if ($column -gt $maxColumn) { $maxColumn = $column }
      }
      $cells = @()
      for ($index = 1; $index -le $maxColumn; $index++) {
        $cells += $(if ($values.ContainsKey($index)) { $values[$index] } else { '' })
      }
      $rows += ,$cells
    }

    $sheets += [pscustomobject]@{
      name = "$($sheet.name)"
      rows = $rows
    }
  }

  [pscustomobject]@{
    file = [System.IO.Path]::GetFileName($Path)
    sheets = $sheets
  } | ConvertTo-Json -Depth 12 -Compress
} finally {
  $zip.Dispose()
}
