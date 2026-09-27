export type Severity = "Critical" | "High" | "Medium" | "Low";
export type CheckCategory =
  | "Encryption"
  | "Firewall"
  | "Antivirus"
  | "Updates"
  | "Access Control"
  | "System Integrity"
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

export const BUILTIN_CHECKS: BuiltInCheck[] = [
  {
    key: "bitlocker",
    name: "BitLocker Encryption",
    description: "Full disk encryption must be enabled on the system volume.",
    category: "Encryption",
    checkType: "bitlocker",
    expectedValue: "On",
    severity: "Critical",
    remediation: "Enable BitLocker on C: and escrow the recovery key.",
    frameworks: { cis: "CIS 3.1", nist: "PR.DS-01", iso: "A.8.24" },
  },
  {
    key: "fw-domain",
    name: "Windows Firewall (Domain)",
    description: "Domain profile of Windows Firewall must be enabled.",
    category: "Firewall",
    checkType: "firewall",
    expectedValue: "Enabled",
    severity: "Critical",
    remediation: "Turn on the Domain firewall profile in Windows Defender Firewall.",
    frameworks: { cis: "CIS 9.1.1", nist: "PR.IR-01", iso: "A.8.20" },
  },
  {
    key: "fw-private",
    name: "Windows Firewall (Private)",
    description: "Private profile of Windows Firewall must be enabled.",
    category: "Firewall",
    checkType: "firewall",
    expectedValue: "Enabled",
    severity: "Critical",
    remediation: "Turn on the Private firewall profile.",
    frameworks: { cis: "CIS 9.2.1", nist: "PR.IR-01", iso: "A.8.20" },
  },
  {
    key: "fw-public",
    name: "Windows Firewall (Public)",
    description: "Public profile of Windows Firewall must be enabled.",
    category: "Firewall",
    checkType: "firewall",
    expectedValue: "Enabled",
    severity: "Critical",
    remediation: "Turn on the Public firewall profile.",
    frameworks: { cis: "CIS 9.3.1", nist: "PR.IR-01", iso: "A.8.21" },
  },
  {
    key: "defender-rt",
    name: "Defender Real-time Protection",
    description: "Microsoft Defender real-time protection must be running.",
    category: "Antivirus",
    checkType: "defender",
    expectedValue: "Enabled",
    severity: "Critical",
    remediation: "Enable real-time protection in Windows Security.",
    frameworks: { cis: "CIS 18.9.47", nist: "DE.CM-09", iso: "A.8.7" },
  },
  {
    key: "defender-defs",
    name: "Defender Definition Age",
    description: "Antivirus signatures must be less than 48 hours old.",
    category: "Antivirus",
    checkType: "defender",
    expectedValue: "<= 48h",
    severity: "High",
    remediation: "Force a definition update via Windows Security or WSUS.",
    frameworks: { cis: "CIS 18.9.47", nist: "DE.CM-09", iso: "A.8.7" },
  },
  {
    key: "updates",
    name: "Pending Windows Updates",
    description: "No critical security updates should remain pending.",
    category: "Updates",
    checkType: "windows_update",
    expectedValue: "0 critical",
    severity: "High",
    remediation: "Install pending quality updates and reboot if required.",
    frameworks: { cis: "CIS 18.9.102", nist: "ID.RA-01", iso: "A.8.8" },
  },
  {
    key: "uac",
    name: "User Account Control",
    description: "UAC (EnableLUA) must be enabled.",
    category: "Access Control",
    checkType: "registry",
    expectedValue: "1",
    severity: "High",
    remediation: "Set HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\EnableLUA to 1.",
    frameworks: { cis: "CIS 2.3.17", nist: "PR.AA-01", iso: "A.8.2" },
  },
  {
    key: "lock",
    name: "Screen Lock Timeout",
    description: "Idle timeout should be 15 minutes or less.",
    category: "Access Control",
    checkType: "registry",
    expectedValue: "<= 900s",
    severity: "Medium",
    remediation: "Set the screen saver / lock timeout to 15 minutes or less.",
    frameworks: { cis: "CIS 1.1.1", nist: "PR.AA-03", iso: "A.8.5" },
  },
  {
    key: "admins",
    name: "Local Administrators",
    description: "Only approved accounts should be in the local Administrators group.",
    category: "Access Control",
    checkType: "powershell",
    expectedValue: "Approved only",
    severity: "High",
    remediation: "Remove unexpected local administrators.",
    frameworks: { cis: "CIS 2.2.21", nist: "PR.AA-05", iso: "A.8.2" },
  },
  {
    key: "password",
    name: "Password Policy Strength",
    description: "Minimum password length should be 14 characters.",
    category: "Access Control",
    checkType: "powershell",
    expectedValue: ">= 14",
    severity: "Medium",
    remediation: "Raise minimum password length via local or domain policy.",
    frameworks: { cis: "CIS 1.1.4", nist: "PR.AA-01", iso: "A.5.17" },
  },
  {
    key: "secureboot",
    name: "Secure Boot",
    description: "UEFI Secure Boot should be enabled.",
    category: "System Integrity",
    checkType: "powershell",
    expectedValue: "Enabled",
    severity: "Medium",
    remediation: "Enable Secure Boot in firmware.",
    frameworks: { cis: "CIS 18.1.1", nist: "PR.PS-01", iso: "A.8.9" },
  },
  {
    key: "tpm",
    name: "TPM Presence",
    description: "TPM 2.0 should be present and ready.",
    category: "System Integrity",
    checkType: "powershell",
    expectedValue: "Ready",
    severity: "Medium",
    remediation: "Enable TPM in firmware and take ownership if needed.",
    frameworks: { cis: "CIS 3.2", nist: "PR.PS-01", iso: "A.8.24" },
  },
  {
    key: "guest",
    name: "Guest Account Disabled",
    description: "The local Guest account must be disabled.",
    category: "Access Control",
    checkType: "powershell",
    expectedValue: "Disabled",
    severity: "Medium",
    remediation: "Disable the Guest account.",
    frameworks: { cis: "CIS 2.3.1.1", nist: "PR.AA-05", iso: "A.5.16" },
  },
  {
    key: "inventory",
    name: "Unauthorized Software",
    description: "No unauthorized remote-access tools should be installed.",
    category: "Inventory",
    checkType: "file",
    expectedValue: "None",
    severity: "Low",
    remediation: "Uninstall unapproved remote-access or hacking tools.",
    frameworks: { cis: "CIS 18.3", nist: "ID.AM-02", iso: "A.8.1" },
  },
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
  "Access Control",
  "System Integrity",
  "Inventory",
];

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
