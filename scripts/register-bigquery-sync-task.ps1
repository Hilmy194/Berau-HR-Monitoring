<##
.SYNOPSIS
Registers a Windows Task Scheduler job for the BigQuery HR sync on the 4th and 17th of every month.

.EXAMPLE
.\scripts\register-bigquery-sync-task.ps1 -ConfigPath "C:\secure\bq-hr-sync.env" -At "04:00"
##>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$ConfigPath,
  [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')]
  [string]$At = "04:00",
  [string]$TaskName = "Harmoni BigQuery HR Sync",
  [string]$PythonPath = "py.exe"
)

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$syncScript = Join-Path $PSScriptRoot "sync_bigquery_hr.py"
$pythonCommand = Get-Command $PythonPath -ErrorAction Stop
$startBoundary = "$(Get-Date -Format 'yyyy-MM')-04T$At:00"
$taskUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$escapedConfig = [System.Security.SecurityElement]::Escape((Resolve-Path -LiteralPath $ConfigPath).Path)
$escapedPython = [System.Security.SecurityElement]::Escape($pythonCommand.Source)
$escapedScript = [System.Security.SecurityElement]::Escape($syncScript)
$escapedRoot = [System.Security.SecurityElement]::Escape($repositoryRoot)
$escapedUser = [System.Security.SecurityElement]::Escape($taskUser)

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Exports approved HR views from BigQuery and imports them into Harmoni.</Description></RegistrationInfo>
  <Triggers><CalendarTrigger><StartBoundary>$startBoundary</StartBoundary><Enabled>true</Enabled><ScheduleByMonth><DaysOfMonth><Day>4</Day><Day>17</Day></DaysOfMonth><Months><January/><February/><March/><April/><May/><June/><July/><August/><September/><October/><November/><December/></Months></ScheduleByMonth></CalendarTrigger></Triggers>
  <Principals><Principal id="Author"><UserId>$escapedUser</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><StartWhenAvailable>true</StartWhenAvailable><ExecutionTimeLimit>PT2H</ExecutionTimeLimit><Enabled>true</Enabled></Settings>
  <Actions Context="Author"><Exec><Command>$escapedPython</Command><Arguments>&quot;$escapedScript&quot; --config &quot;$escapedConfig&quot;</Arguments><WorkingDirectory>$escapedRoot</WorkingDirectory></Exec></Actions>
</Task>
"@

Register-ScheduledTask -TaskName $TaskName -Xml $taskXml -Force | Out-Null
Write-Host "Task '$TaskName' is registered for the 4th and 17th of each month at $At."
Write-Host "It runs only while this Windows user is signed in, so it can safely access the service-account file."
