# Vigil Windows compliance agent
# Lightweight, no extra software. Run as Administrator:
#   powershell -ExecutionPolicy Bypass -File vigil-agent.ps1 -Server https://YOUR-HOST -Token AGENT_TOKEN

param(
  [Parameter(Mandatory = $true)][string]$Server,
  [Parameter(Mandatory = $true)][string]$Token
)

$ErrorActionPreference = "SilentlyContinue"

function Get-Check([string]$Key, [string]$Status, [string]$Actual, [string]$Message) {
  return @{
    key          = $Key
    status       = $Status
    actual_value = $Actual
    message      = $Message
  }
}

function PassFail([bool]$Ok, [string]$Key, [string]$Actual, [string]$FailMessage) {
  if ($Ok) { return Get-Check $Key "pass" $Actual "Meets baseline." }
  return Get-Check $Key "fail" $Actual $FailMessage
}

$results = @()

# BitLocker on C:
$bl = Get-BitLockerVolume -MountPoint "C:"
$blOn = $bl -and ($bl.ProtectionStatus -eq "On" -or $bl.VolumeStatus -eq "FullyEncrypted")
$results += PassFail $blOn "bitlocker" $(if ($blOn) { "On" } else { "Off" }) "BitLocker is not protecting the system volume."

# Firewall profiles
foreach ($pair in @(
    @{ Key = "fw-domain"; Name = "Domain" },
    @{ Key = "fw-private"; Name = "Private" },
    @{ Key = "fw-public"; Name = "Public" }
  )) {
  $profile = Get-NetFirewallProfile -Name $pair.Name
  $enabled = $profile -and $profile.Enabled
  $results += PassFail $enabled $pair.Key $(if ($enabled) { "Enabled" } else { "Disabled" }) "$($pair.Name) firewall profile is off."
}

# Defender
$mp = Get-MpComputerStatus
$rt = $mp -and $mp.RealTimeProtectionEnabled
$results += PassFail $rt "defender-rt" $(if ($rt) { "Enabled" } else { "Disabled" }) "Defender real-time protection is off."
$ageHours = 999
if ($mp -and $mp.AntivirusSignatureLastUpdated) {
  $ageHours = [math]::Round(((Get-Date) - $mp.AntivirusSignatureLastUpdated).TotalHours, 1)
}
$results += PassFail ($ageHours -le 48) "defender-defs" "$ageHours h" "Defender signatures are older than 48 hours."

# Pending updates (best-effort)
$pending = 0
try {
  $session = New-Object -ComObject Microsoft.Update.Session
  $searcher = $session.CreateUpdateSearcher()
  $found = $searcher.Search("IsInstalled=0 and Type='Software' and IsHidden=0")
  $pending = @($found.Updates | Where-Object { $_.MsrcSeverity -eq "Critical" }).Count
} catch { $pending = 0 }
$results += PassFail ($pending -eq 0) "updates" "$pending critical" "Critical Windows updates are pending."

# UAC
$uac = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name EnableLUA).EnableLUA
$results += PassFail ($uac -eq 1) "uac" "$uac" "User Account Control (EnableLUA) is disabled."

# Screen lock
$timeout = (Get-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name ScreenSaveTimeOut).ScreenSaveTimeOut
$timeoutNum = 0
[void][int]::TryParse($timeout, [ref]$timeoutNum)
$lockOk = $timeoutNum -gt 0 -and $timeoutNum -le 900
$results += PassFail $lockOk "lock" "$timeoutNum s" "Idle lock timeout exceeds 15 minutes."

# Local administrators
$admins = @(Get-LocalGroupMember -Group "Administrators" | Select-Object -ExpandProperty Name)
$unexpected = @($admins | Where-Object { $_ -notmatch "Administrator|Domain Admins|Enabled" })
$results += PassFail ($unexpected.Count -eq 0) "admins" ($admins -join ", ") "Unexpected local administrators present."

# Password policy
$minLen = (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Netlogon\Parameters" -ErrorAction SilentlyContinue).MinimumPasswordLength
if (-not $minLen) {
  try { $minLen = (net accounts | Select-String "Minimum password length").ToString() -replace "\D", "" } catch { $minLen = 0 }
}
$minLenNum = 0
[void][int]::TryParse("$minLen", [ref]$minLenNum)
$results += PassFail ($minLenNum -ge 14) "password" "$minLenNum" "Minimum password length is below 14."

# Secure Boot / TPM
$sb = $false
try { $sb = Confirm-SecureBootUEFI } catch { $sb = $false }
$results += PassFail $sb "secureboot" $(if ($sb) { "Enabled" } else { "Disabled" }) "Secure Boot is not enabled."

$tpmReady = $false
try {
  $tpm = Get-Tpm
  $tpmReady = $tpm.TpmPresent -and $tpm.TpmReady
} catch { $tpmReady = $false }
$results += PassFail $tpmReady "tpm" $(if ($tpmReady) { "Ready" } else { "Missing" }) "TPM 2.0 is not ready."

# Guest
$guest = Get-LocalUser -Name "Guest"
$guestDisabled = $guest -and (-not $guest.Enabled)
$results += PassFail $guestDisabled "guest" $(if ($guestDisabled) { "Disabled" } else { "Enabled" }) "Guest account is enabled."

# Unauthorized remote-access tools
$suspect = @(
  "$env:ProgramFiles\TeamViewer",
  "$env:ProgramFiles\AnyDesk",
  "$env:ProgramFiles(x86)\TeamViewer"
) | Where-Object { Test-Path $_ }
$results += PassFail ($suspect.Count -eq 0) "inventory" $(if ($suspect.Count -eq 0) { "None" } else { $suspect -join ", " }) "Unauthorized remote-access software detected."

$os = (Get-CimInstance Win32_OperatingSystem)
$body = @{
  token      = $Token
  hostname   = $env:COMPUTERNAME
  os_version = $os.Caption + " " + $os.Version
  ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1 -ExpandProperty IPAddress)
  results    = $results
} | ConvertTo-Json -Depth 6

$uri = $Server.TrimEnd("/") + "/api/agent/report"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body | ConvertTo-Json
