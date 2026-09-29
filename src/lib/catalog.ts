export type Severity = "Critical" | "High" | "Medium" | "Low";
export type CheckCategory =
  | "Encryption"
  | "Firewall"
  | "Antivirus"
  | "Updates"
  | "Password Policy"
  | "Screen & Session"
  | "Access Control"
  | "System Integrity"
  | "Remote Access"
  | "Audit & Logging"
  | "Device & Media"
  | "Inventory";

export type CheckType =
  | "bitlocker"
  | "firewall"
  | "defender"
  | "windows_update"
  | "registry"
  | "service"
  | "file"
  | "powershell";

export type Frameworks = {
  cis: string;
  nist: string;
  iso: string;
};

export type BuiltInCheck = {
  key: string;
  name: string;
  description: string;
  category: CheckCategory;
  checkType: CheckType;
  expectedValue: string;
  severity: Severity;
  remediation: string;
  frameworks: Frameworks;
};

function item(
  key: string,
  name: string,
  description: string,
  category: CheckCategory,
  checkType: CheckType,
  expectedValue: string,
  severity: Severity,
  remediation: string,
  cis: string,
  nist: string,
  iso: string,
): BuiltInCheck {
  return {
    key,
    name,
    description,
    category,
    checkType,
    expectedValue,
    severity,
    remediation,
    frameworks: { cis, nist, iso },
  };
}

export const BUILTIN_CHECKS: BuiltInCheck[] = [
  item("bitlocker", "BitLocker system volume", "Full disk encryption must be on for the Windows system drive (C:).", "Encryption", "bitlocker", "On", "Critical", "Enable BitLocker on C: and escrow the recovery key in AD or MBAM.", "CIS 3.1", "PR.DS-01", "A.8.24"),
  item("bitlocker-fixed", "BitLocker fixed data drives", "Fixed (non-OS) data volumes must be BitLocker-protected.", "Encryption", "bitlocker", "On", "High", "Turn on BitLocker for every fixed data drive.", "CIS 3.1.2", "PR.DS-01", "A.8.24"),
  item("bitlocker-removable", "BitLocker removable drives", "Removable media should require encryption before write access.", "Encryption", "bitlocker", "On", "Medium", "Enable BitLocker To Go for removable drives.", "CIS 3.1.3", "PR.DS-01", "A.8.24"),

  item("fw-domain", "Windows Firewall (Domain)", "Domain profile of Windows Defender Firewall must be enabled.", "Firewall", "firewall", "Enabled", "Critical", "Turn on the Domain firewall profile.", "CIS 9.1.1", "PR.IR-01", "A.8.20"),
  item("fw-private", "Windows Firewall (Private)", "Private profile of Windows Defender Firewall must be enabled.", "Firewall", "firewall", "Enabled", "Critical", "Turn on the Private firewall profile.", "CIS 9.2.1", "PR.IR-01", "A.8.20"),
  item("fw-public", "Windows Firewall (Public)", "Public profile of Windows Defender Firewall must be enabled.", "Firewall", "firewall", "Enabled", "Critical", "Turn on the Public firewall profile.", "CIS 9.3.1", "PR.IR-01", "A.8.21"),
  item("fw-inbound-block", "Firewall inbound default block", "Inbound connections should default to Block on all profiles.", "Firewall", "firewall", "Block", "High", "Set default inbound action to Block in Windows Defender Firewall.", "CIS 9.1.2", "PR.IR-01", "A.8.20"),
  item("fw-notify", "Firewall notifications", "Notify the user when Windows Firewall blocks a new program (Public profile).", "Firewall", "firewall", "Enabled", "Low", "Enable firewall notifications for the Public profile.", "CIS 9.3.3", "PR.IR-01", "A.8.20"),

  item("defender-rt", "Defender real-time protection", "Microsoft Defender real-time protection must be running.", "Antivirus", "defender", "Enabled", "Critical", "Enable real-time protection in Windows Security.", "CIS 18.9.47.4", "DE.CM-09", "A.8.7"),
  item("defender-defs", "Defender definition age", "Antivirus signatures must be no older than 48 hours.", "Antivirus", "defender", "<= 48h", "High", "Force a definition update via Windows Security or WSUS.", "CIS 18.9.47", "DE.CM-09", "A.8.7"),
  item("defender-cloud", "Defender cloud protection", "Cloud-delivered protection (MAPS) must be enabled.", "Antivirus", "defender", "Enabled", "High", "Enable Cloud-delivered protection in Defender settings.", "CIS 18.9.47.5", "DE.CM-09", "A.8.7"),
  item("defender-pua", "Defender PUA protection", "Potentially unwanted application protection must be enabled.", "Antivirus", "defender", "Enabled", "Medium", "Set PUAProtection to Enabled.", "CIS 18.9.47.12", "DE.CM-09", "A.8.7"),
  item("defender-tamper", "Defender tamper protection", "Tamper protection must prevent unauthorized Defender changes.", "Antivirus", "defender", "Enabled", "High", "Enable Tamper Protection in Windows Security.", "CIS 18.9.47.15", "PR.PS-01", "A.8.7"),
  item("defender-behavior", "Defender behavior monitoring", "Behavior monitoring must be enabled.", "Antivirus", "defender", "Enabled", "High", "Enable behavior monitoring in Defender antivirus policy.", "CIS 18.9.47.9", "DE.CM-09", "A.8.7"),
  item("defender-ioav", "Scan downloaded files and attachments", "IOAV protection must scan files as they are downloaded or attached.", "Antivirus", "defender", "Enabled", "Medium", "Enable 'Scan all downloaded files and attachments'.", "CIS 18.9.47.10", "DE.CM-09", "A.8.7"),

  item("updates", "Pending critical Windows updates", "No critical security updates should remain pending.", "Updates", "windows_update", "0 critical", "High", "Install pending quality updates and reboot if required.", "CIS 18.9.102", "ID.RA-01", "A.8.8"),
  item("wu-auto", "Automatic updates", "Windows Update must be configured to download and install automatically.", "Updates", "windows_update", "Enabled", "High", "Set AUOptions to 4 (auto download and schedule install).", "CIS 18.9.102.2", "ID.RA-01", "A.8.8"),
  item("wu-no-pause", "Updates not paused", "Windows Update must not be paused by the user.", "Updates", "windows_update", "Not paused", "Medium", "Clear any pause on Windows Update.", "CIS 18.9.102", "ID.RA-01", "A.8.8"),

  item("password", "Minimum password length", "Minimum password length should be 14 characters or more.", "Password Policy", "powershell", ">= 14", "High", "Raise minimum password length via local or domain policy.", "CIS 1.1.4", "PR.AA-01", "A.5.17"),
  item("pwd-complexity", "Password complexity", "Passwords must meet complexity requirements (mixed case, digit, symbol).", "Password Policy", "powershell", "Enabled", "High", "Enable 'Password must meet complexity requirements'.", "CIS 1.1.5", "PR.AA-01", "A.5.17"),
  item("pwd-history", "Password history", "Remember 24 previous passwords so they cannot be reused.", "Password Policy", "powershell", ">= 24", "Medium", "Set 'Enforce password history' to 24.", "CIS 1.1.1", "PR.AA-01", "A.5.17"),
  item("pwd-max-age", "Maximum password age", "Passwords must expire within 60 days or less (and not 0 / never).", "Password Policy", "powershell", "<= 60 days", "Medium", "Set maximum password age to 60 or less, not 0.", "CIS 1.1.3", "PR.AA-01", "A.5.17"),
  item("pwd-min-age", "Minimum password age", "Users must wait at least 1 day before changing a password again.", "Password Policy", "powershell", ">= 1 day", "Low", "Set minimum password age to 1 day.", "CIS 1.1.2", "PR.AA-01", "A.5.17"),
  item("pwd-lockout-threshold", "Account lockout threshold", "Lock the account after 5 or fewer invalid logon attempts.", "Password Policy", "powershell", "<= 5", "High", "Set account lockout threshold to 5 or fewer (not 0).", "CIS 1.2.2", "PR.AA-01", "A.5.17"),
  item("pwd-lockout-duration", "Account lockout duration", "Locked accounts must stay locked for 15 minutes or more.", "Password Policy", "powershell", ">= 15 min", "Medium", "Set account lockout duration to 15 minutes or more.", "CIS 1.2.1", "PR.AA-01", "A.5.17"),
  item("pwd-reversible", "Reversible password encryption", "Store passwords using reversible encryption must be disabled.", "Password Policy", "powershell", "Disabled", "Critical", "Disable 'Store passwords using reversible encryption'.", "CIS 1.1.6", "PR.AA-01", "A.5.17"),

  item("screen-saver-on", "Screen lock enabled", "A screen saver / lock screen must be enabled.", "Screen & Session", "registry", "Enabled", "High", "Enable the screen saver and require it on resume.", "CIS 1.1.1", "PR.AA-03", "A.8.5"),
  item("lock", "Screen lock timeout", "Idle lock timeout must be 15 minutes (900 seconds) or less.", "Screen & Session", "registry", "<= 900s", "High", "Set ScreenSaveTimeOut / inactivity limit to 900 seconds or less.", "CIS 1.1.2", "PR.AA-03", "A.8.5"),
  item("screen-secure", "Password on wake / resume", "A password must be required when the display wakes from screen saver.", "Screen & Session", "registry", "Enabled", "High", "Enable 'Password protect the screen saver' (ScreenSaverIsSecure).", "CIS 1.1.3", "PR.AA-03", "A.8.5"),
  item("machine-inactivity", "Machine inactivity limit", "Interactive logon machine inactivity limit must be 900 seconds or less.", "Screen & Session", "registry", "<= 900s", "High", "Set InactivityTimeoutSecs to 900 or less.", "CIS 2.3.7.3", "PR.AA-03", "A.8.5"),
  item("ctrl-alt-del", "Require Ctrl+Alt+Del", "Interactive logon must require Ctrl+Alt+Del (no auto-logon friendly path).", "Screen & Session", "registry", "Enabled", "Medium", "Disable 'Do not require CTRL+ALT+DEL'.", "CIS 2.3.7.2", "PR.AA-03", "A.5.16"),
  item("hide-last-user", "Do not display last signed-in user", "The last interactive user name must not be shown on the logon screen.", "Screen & Session", "registry", "Enabled", "Medium", "Enable 'Do not display last user name'.", "CIS 2.3.7.1", "PR.AA-05", "A.5.16"),

  item("uac", "User Account Control", "UAC (EnableLUA) must be enabled.", "Access Control", "registry", "Enabled", "High", "Set EnableLUA to 1.", "CIS 2.3.17.1", "PR.AA-01", "A.8.2"),
  item("uac-consent-admin", "UAC admin consent prompt", "Administrators must be prompted for consent on elevation.", "Access Control", "registry", "Prompt", "High", "Set ConsentPromptBehaviorAdmin to 2 (prompt on secure desktop).", "CIS 2.3.17.3", "PR.AA-05", "A.8.2"),
  item("uac-secure-desktop", "UAC prompt on secure desktop", "Elevation prompts must switch to the secure desktop.", "Access Control", "registry", "Enabled", "High", "Set PromptOnSecureDesktop to 1.", "CIS 2.3.17.7", "PR.AA-05", "A.8.2"),
  item("guest", "Guest account disabled", "The local Guest account must be disabled.", "Access Control", "powershell", "Disabled", "High", "Disable the Guest account.", "CIS 2.3.1.1", "PR.AA-05", "A.5.16"),
  item("admins", "Local Administrators membership", "Only approved accounts should be in the local Administrators group.", "Access Control", "powershell", "Approved only", "High", "Remove unexpected local administrators.", "CIS 2.2.21", "PR.AA-05", "A.8.2"),
  item("blank-passwords", "No blank local passwords", "Local accounts with blank passwords must not be able to log on.", "Access Control", "registry", "Enabled", "High", "Enable 'Limit local account use of blank passwords to console logon only'.", "CIS 2.3.1.4", "PR.AA-01", "A.5.17"),
  item("anonymous-sam", "Restrict anonymous SAM", "Do not allow anonymous enumeration of SAM accounts.", "Access Control", "registry", "Enabled", "Medium", "Enable RestrictAnonymousSAM.", "CIS 2.3.10.1", "PR.AA-05", "A.8.3"),
  item("everyone-anon", "Everyone includes anonymous", "The Everyone SID must not include anonymous users.", "Access Control", "registry", "Disabled", "Medium", "Disable 'Network access: Let Everyone permissions apply to anonymous users'.", "CIS 2.3.10.5", "PR.AA-05", "A.8.3"),
  item("cached-logons", "Cached logon count", "Number of cached logons must be 4 or fewer.", "Access Control", "registry", "<= 4", "Low", "Set CachedLogonsCount to 4 or fewer.", "CIS 2.3.7.6", "PR.AA-03", "A.5.16"),

  item("secureboot", "Secure Boot", "UEFI Secure Boot should be enabled.", "System Integrity", "powershell", "Enabled", "High", "Enable Secure Boot in firmware.", "CIS 18.1.1", "PR.PS-01", "A.8.9"),
  item("tpm", "TPM 2.0 present and ready", "TPM 2.0 should be present and ready.", "System Integrity", "powershell", "Ready", "Medium", "Enable TPM in firmware and take ownership if needed.", "CIS 3.2", "PR.PS-01", "A.8.24"),
  item("lsa-ppl", "LSA protection (RunAsPPL)", "Local Security Authority must run as a protected process.", "System Integrity", "registry", "Enabled", "High", "Set RunAsPPL to 1 under LSA.", "CIS 18.9.77", "PR.AA-06", "A.8.5"),
  item("credential-guard", "Credential Guard", "Virtualization-based security Credential Guard should be enabled.", "System Integrity", "powershell", "Enabled", "High", "Enable Credential Guard via Windows Security / Group Policy.", "CIS 18.8.5", "PR.AA-06", "A.8.5"),
  item("hvci", "Memory integrity (HVCI)", "Hypervisor-protected code integrity should be enabled.", "System Integrity", "registry", "Enabled", "Medium", "Enable Memory integrity in Core isolation.", "CIS 18.8.5.1", "PR.PS-01", "A.8.9"),
  item("smbv1", "SMBv1 disabled", "The insecure SMBv1 protocol must be disabled.", "System Integrity", "powershell", "Disabled", "High", "Disable the SMB1Protocol Windows feature.", "CIS 18.3.1", "PR.PS-01", "A.8.9"),
  item("llmnr", "LLMNR disabled", "Link-Local Multicast Name Resolution should be disabled.", "System Integrity", "registry", "Disabled", "Medium", "Enable 'Turn off multicast name resolution'.", "CIS 18.5.4.1", "PR.PS-01", "A.8.9"),
  item("wdigest", "WDigest authentication", "WDigest must not store credentials in memory (disabled).", "System Integrity", "registry", "Disabled", "High", "Set UseLogonCredential to 0 for WDigest.", "CIS 18.3.6", "PR.AA-06", "A.8.5"),
  item("ntlmv1", "LM / NTLMv1 refused", "LAN Manager authentication level must refuse LM and NTLMv1.", "System Integrity", "registry", "NTLMv2 only", "High", "Set LmCompatibilityLevel to 5.", "CIS 2.3.11.7", "PR.AA-01", "A.8.5"),
  item("autoplay", "AutoPlay disabled", "AutoPlay must be disabled for all drives.", "System Integrity", "registry", "Disabled", "Medium", "Turn off Autoplay for all drives.", "CIS 18.9.8.2", "PR.PS-01", "A.8.19"),
  item("autorun", "AutoRun disabled", "Default AutoRun behavior must not execute commands from media.", "System Integrity", "registry", "Disabled", "Medium", "Set NoAutorun / set default AutoRun behavior to disabled.", "CIS 18.9.8.1", "PR.PS-01", "A.8.19"),
  item("powershell-scriptblock", "PowerShell script block logging", "PowerShell script block logging must be enabled.", "System Integrity", "registry", "Enabled", "Medium", "Enable ScriptBlockLogging in PowerShell policies.", "CIS 18.9.95.1", "DE.CM-01", "A.8.16"),

  item("rdp-nla", "RDP Network Level Authentication", "Remote Desktop must require Network Level Authentication.", "Remote Access", "registry", "Enabled", "High", "Enable NLA on the Remote Desktop service.", "CIS 18.9.62.3", "PR.AA-03", "A.8.20"),
  item("rdp-nla-user", "RDP restricted admin / NLA users", "Remote Desktop users group must not be overly broad (Users / Everyone).", "Remote Access", "powershell", "Restricted", "High", "Remove Users/Everyone from Remote Desktop Users.", "CIS 2.2.26", "PR.AA-05", "A.8.2"),
  item("remote-assistance", "Remote Assistance offers", "Unsolicited Remote Assistance offers must be disabled.", "Remote Access", "registry", "Disabled", "Medium", "Disable 'Configure Offer Remote Assistance'.", "CIS 18.8.22.1", "PR.AA-03", "A.8.20"),
  item("winrm-unencrypted", "WinRM unencrypted traffic", "WinRM must not allow unencrypted traffic.", "Remote Access", "registry", "Disabled", "High", "Disable AllowUnencryptedTraffic for WinRM service and client.", "CIS 18.9.97", "PR.DS-02", "A.8.24"),

  item("audit-logon", "Audit logon events", "Success and failure logon events must be audited.", "Audit & Logging", "powershell", "Success, Failure", "Medium", "Enable Audit Logon for Success and Failure.", "CIS 17.5.4", "DE.CM-01", "A.8.15"),
  item("audit-account-logon", "Audit account logon", "Credential validation success and failure must be audited.", "Audit & Logging", "powershell", "Success, Failure", "Medium", "Enable Audit Credential Validation Success and Failure.", "CIS 17.1.1", "DE.CM-01", "A.8.15"),
  item("audit-policy-change", "Audit policy change", "Audit policy change success (and failure) must be recorded.", "Audit & Logging", "powershell", "Success", "Low", "Enable Audit Audit Policy Change.", "CIS 17.7.1", "DE.CM-01", "A.8.15"),
  item("audit-privilege", "Audit sensitive privilege use", "Use of sensitive privileges must be audited (failure at minimum).", "Audit & Logging", "powershell", "Failure", "Low", "Enable Audit Sensitive Privilege Use.", "CIS 17.8.1", "DE.CM-01", "A.8.15"),

  item("usb-storage", "Removable storage write", "Write access to removable storage should be denied on managed endpoints.", "Device & Media", "registry", "Denied", "Medium", "Deny write access to removable storage via Group Policy.", "CIS 18.7.1", "PR.DS-01", "A.8.13"),
  item("cdrom-autorun", "Optical media AutoPlay", "AutoPlay on CD-ROM / DVD drives must be disabled.", "Device & Media", "registry", "Disabled", "Low", "Turn off Autoplay on optical drives.", "CIS 18.9.8.2", "PR.PS-01", "A.8.19"),

  item("inventory", "Unauthorized remote-access tools", "No unapproved remote-access tools (TeamViewer, AnyDesk, etc.) should be installed.", "Inventory", "file", "None", "Low", "Uninstall unapproved remote-access software.", "CIS 18.3", "ID.AM-02", "A.8.1"),
];

export const DEMO_HOSTS = [
  { hostname: "FIN-LAPTOP-04", os: "Windows 11 Pro 24H2", ip: "10.8.12.41", profile: "clean" as const },
  { hostname: "HR-WS-12", os: "Windows 11 Enterprise 23H2", ip: "10.8.14.22", profile: "drift" as const },
  { hostname: "DEV-WKS-08", os: "Windows 11 Pro 24H2", ip: "10.8.21.90", profile: "dev" as const },
  { hostname: "ACCT-PC-02", os: "Windows 10 Enterprise 22H2", ip: "10.8.9.17", profile: "clean" as const },
  { hostname: "IT-ADMIN-01", os: "Windows 11 Pro 24H2", ip: "10.8.1.10", profile: "admin" as const },
  { hostname: "SALES-NB-19", os: "Windows 11 Pro 23H2", ip: "10.8.33.54", profile: "offline" as const },
];

export function frameworksFor(name: string | null | undefined): Frameworks | null {
  if (!name) return null;
  return BUILTIN_CHECKS.find((c) => c.name === name)?.frameworks ?? null;
}

export const CHECK_CATEGORIES: CheckCategory[] = [
  "Encryption",
  "Firewall",
  "Antivirus",
  "Updates",
  "Password Policy",
  "Screen & Session",
  "Access Control",
  "System Integrity",
  "Remote Access",
  "Audit & Logging",
  "Device & Media",
  "Inventory",
];

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
