import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { BUILTIN_CHECKS, DEMO_HOSTS } from "@/lib/catalog";
import { builtinCheckId, deviceId, newId } from "@/lib/ids";

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export type DeviceRow = {
  id: string;
  hostname: string;
  os_version: string | null;
  ip_address: string | null;
  last_seen: string | null;
  compliance_score: string | number | null;
  status: string;
  created_at: string;
  agent_token?: string;
};

type CheckRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  check_type: string;
  expected_value: string | null;
  severity: string;
  remediation: string | null;
  is_builtin: boolean;
  is_active: boolean;
};

type AlertRow = {
  id: string;
  device_id: string;
  hostname: string;
  check_id: string | null;
  check_name: string | null;
  severity: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
};

type ResultRow = {
  id: string;
  check_id: string | null;
  name: string | null;
  category: string | null;
  severity: string | null;
  status: string;
  actual_value: string | null;
  message: string | null;
  remediation: string | null;
  expected_value: string | null;
};

function failKeys(profile: (typeof DEMO_HOSTS)[number]["profile"]): Set<string> {
  if (profile === "clean") return new Set(["inventory"]);
  if (profile === "drift") return new Set(["bitlocker", "fw-public", "updates", "lock"]);
  if (profile === "dev") return new Set(["uac", "admins", "inventory", "password"]);
  if (profile === "admin") return new Set(["lock", "admins"]);
  return new Set(["updates", "defender-defs", "fw-private"]);
}

function checkKey(check: CheckRow): string {
  return BUILTIN_CHECKS.find((c) => c.name === check.name)?.key ?? check.id;
}

async function ensureFleet(userId: string) {
  const sql = await getSql();
  const existing = await sql<{ c: number }>`select count(*)::int as c from devices where user_id = ${userId}`;
  if ((existing[0]?.c ?? 0) > 0) return;

  for (const check of BUILTIN_CHECKS) {
    const id = builtinCheckId(userId, check.key);
    await sql`
      insert into compliance_checks (
        id, user_id, name, description, category, check_type, expected_value,
        severity, remediation, is_builtin, is_active
      ) values (
        ${id}, ${userId}, ${check.name}, ${check.description}, ${check.category},
        ${check.checkType}, ${check.expectedValue}, ${check.severity},
        ${check.remediation}, true, true
      )
    `;
  }

  const checks = await sql<CheckRow>`
    select id, name, description, category, check_type, expected_value, severity, remediation, is_builtin, is_active
    from compliance_checks where user_id = ${userId} and is_active = true
  `;

  const now = Date.now();
  for (const host of DEMO_HOSTS) {
    const id = deviceId(userId, host.hostname);
    const token = newId("tok");
    const lastSeen =
      host.profile === "offline"
        ? new Date(now - 36 * 3600 * 1000).toISOString()
        : new Date(now - 4 * 60 * 1000).toISOString();
    await sql`
      insert into devices (id, user_id, hostname, agent_token, os_version, ip_address, last_seen, status)
      values (${id}, ${userId}, ${host.hostname}, ${token}, ${host.os}, ${host.ip}, ${lastSeen}, ${host.profile === "offline" ? "offline" : "online"})
    `;
    await writeReport(userId, id, checks, failKeys(host.profile), host.profile === "offline");
  }
}

async function writeReport(
  userId: string,
  devId: string,
  checks: CheckRow[],
  failed: Set<string>,
  offline: boolean,
) {
  const sql = await getSql();
  const reportId = newId("rpt");
  let passed = 0;
  let failCount = 0;
  const failDetails: { check: CheckRow; actual: string; message: string }[] = [];

  for (const check of checks) {
    const key = checkKey(check);
    const isFail = failed.has(key) || failed.has(check.name);
    if (isFail) {
      failCount += 1;
      const actual = check.expected_value === "On" || check.expected_value === "Enabled" ? "Off" : "Non-compliant";
      const message = `${check.name} failed policy baseline.`;
      failDetails.push({ check, actual, message });
    } else {
      passed += 1;
    }
  }

  const total = passed + failCount;
  const score = total ? Math.round((passed / total) * 10000) / 100 : 0;
  const status = offline ? "offline" : failCount > 0 ? "non-compliant" : "compliant";

  await sql`
    insert into compliance_reports (id, user_id, device_id, compliance_score, passed_checks, failed_checks)
    values (${reportId}, ${userId}, ${devId}, ${score}, ${passed}, ${failCount})
  `;
  await sql`
    update devices set compliance_score = ${score}, status = ${status}
    where id = ${devId} and user_id = ${userId}
  `;

  for (const check of checks) {
    const key = checkKey(check);
    const isFail = failed.has(key) || failed.has(check.name);
    const resultId = newId("res");
    const actual = isFail
      ? check.expected_value === "On" || check.expected_value === "Enabled"
        ? "Off"
        : "Non-compliant"
      : check.expected_value;
    const message = isFail ? `${check.name} failed policy baseline.` : "Meets baseline.";
    await sql`
      insert into device_check_results (id, user_id, report_id, check_id, status, actual_value, message)
      values (${resultId}, ${userId}, ${reportId}, ${check.id}, ${isFail ? "fail" : "pass"}, ${actual}, ${message})
    `;
  }

  for (const detail of failDetails) {
    if (detail.check.severity !== "Critical" && detail.check.severity !== "High") continue;
    const open = await sql<{ id: string }>`
      select id from alerts
      where user_id = ${userId} and device_id = ${devId} and check_id = ${detail.check.id} and is_resolved = false
      limit 1
    `;
    if (open.length > 0) continue;
    const alertId = newId("al");
    await sql`
      insert into alerts (id, user_id, device_id, check_id, severity, message, is_resolved)
      values (${alertId}, ${userId}, ${devId}, ${detail.check.id}, ${detail.check.severity}, ${detail.message}, false)
    `;
  }
}

export const getOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureFleet(context.userId);
    const sql = await getSql();
    const devices = await sql<DeviceRow>`
      select id, hostname, os_version, ip_address, last_seen, compliance_score, status, created_at
      from devices where user_id = ${context.userId} order by hostname
    `;
    const alerts = await sql<{ c: number }>`
      select count(*)::int as c from alerts where user_id = ${context.userId} and is_resolved = false
    `;
    const critical = await sql<{ c: number }>`
      select count(*)::int as c from alerts
      where user_id = ${context.userId} and is_resolved = false and severity = 'Critical'
    `;
    const scores = devices.map((d) => toNum(d.compliance_score) ?? 0);
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const trend = await sql<{ day: string; avg_score: string | number }>`
      select created_at::date as day, avg(compliance_score) as avg_score
      from compliance_reports
      where user_id = ${context.userId}
      group by 1
      order by 1 desc
      limit 8
    `;
    const failing = await sql<{ name: string; severity: string; category: string; hosts: number }>`
      select c.name, c.severity, c.category, count(*)::int as hosts
      from device_check_results r
      inner join compliance_checks c on c.id = r.check_id
      inner join compliance_reports rp on rp.id = r.report_id
      inner join (
        select device_id, max(created_at) as ts
        from compliance_reports
        where user_id = ${context.userId}
        group by device_id
      ) latest on latest.device_id = rp.device_id and latest.ts = rp.created_at
      where r.user_id = ${context.userId} and r.status = 'fail'
      group by c.name, c.severity, c.category
      order by hosts desc, c.severity
      limit 8
    `;

    return {
      total: devices.length,
      online: devices.filter((d) => d.status !== "offline").length,
      compliant: devices.filter((d) => d.status === "compliant").length,
      nonCompliant: devices.filter((d) => d.status === "non-compliant").length,
      openAlerts: alerts[0]?.c ?? 0,
      criticalAlerts: critical[0]?.c ?? 0,
      averageScore: avg,
      builtinCount: BUILTIN_CHECKS.length,
      devices: devices.map((d) => ({
        ...d,
        compliance_score: toNum(d.compliance_score),
      })),
      trend: trend
        .slice()
        .reverse()
        .map((t) => ({ day: String(t.day).slice(5), score: toNum(t.avg_score) ?? 0 })),
      failing,
    };
  });

export const listDevices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureFleet(context.userId);
    const sql = await getSql();
    const devices = await sql<DeviceRow>`
      select id, hostname, os_version, ip_address, last_seen, compliance_score, status, created_at, agent_token
      from devices where user_id = ${context.userId} order by hostname
    `;
    return devices.map((d) => ({ ...d, compliance_score: toNum(d.compliance_score) }));
  });

export const getDevice = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const devices = await sql<DeviceRow>`
      select id, hostname, os_version, ip_address, last_seen, compliance_score, status, created_at, agent_token
      from devices where id = ${id} and user_id = ${context.userId}
    `;
    const device = devices[0];
    if (!device) return null;
    const reports = await sql<{
      id: string;
      compliance_score: string | number | null;
      passed_checks: number;
      failed_checks: number;
      created_at: string;
    }>`
      select id, compliance_score, passed_checks, failed_checks, created_at
      from compliance_reports
      where device_id = ${id} and user_id = ${context.userId}
      order by created_at desc
      limit 6
    `;
    const reportId = reports[0]?.id;
    const results = reportId
      ? await sql<ResultRow>`
          select r.id, r.check_id, c.name, c.category, c.severity, r.status, r.actual_value, r.message, c.remediation, c.expected_value
          from device_check_results r
          left join compliance_checks c on c.id = r.check_id
          where r.report_id = ${reportId} and r.user_id = ${context.userId}
          order by
            case c.severity when 'Critical' then 0 when 'High' then 1 when 'Medium' then 2 else 3 end,
            c.name
        `
      : [];
    return {
      ...device,
      compliance_score: toNum(device.compliance_score),
      results,
      reports: reports.map((r) => ({
        ...r,
        compliance_score: toNum(r.compliance_score),
      })),
    };
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureFleet(context.userId);
    const sql = await getSql();
    return sql<AlertRow>`
      select a.id, a.device_id, d.hostname, a.check_id, c.name as check_name,
             a.severity, a.message, a.is_resolved, a.created_at
      from alerts a
      join devices d on d.id = a.device_id
      left join compliance_checks c on c.id = a.check_id
      where a.user_id = ${context.userId}
      order by a.is_resolved, a.created_at desc
      limit 80
    `;
  });

export const resolveAlert = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update alerts set is_resolved = true
      where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const listChecks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureFleet(context.userId);
    const sql = await getSql();
    return sql<CheckRow>`
      select id, name, description, category, check_type, expected_value, severity, remediation, is_builtin, is_active
      from compliance_checks where user_id = ${context.userId}
      order by is_builtin desc, category, name
    `;
  });

export const createCheck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    name: string;
    description: string;
    category: string;
    checkType: string;
    expectedValue: string;
    severity: string;
    remediation: string;
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = newId("chk");
    await sql`
      insert into compliance_checks (
        id, user_id, name, description, category, check_type, expected_value, severity, remediation, is_builtin, is_active
      ) values (
        ${id}, ${context.userId}, ${data.name.trim()}, ${data.description.trim()},
        ${data.category}, ${data.checkType}, ${data.expectedValue.trim()},
        ${data.severity}, ${data.remediation.trim()}, false, true
      )
    `;
    return { id };
  });

export const toggleCheck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; isActive: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update compliance_checks set is_active = ${data.isActive}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const registerDevice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { hostname: string; osVersion: string; ipAddress: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = newId("dev");
    const token = newId("tok");
    await sql`
      insert into devices (id, user_id, hostname, agent_token, os_version, ip_address, status)
      values (${id}, ${context.userId}, ${data.hostname.trim()}, ${token}, ${data.osVersion.trim()}, ${data.ipAddress.trim()}, 'offline')
    `;
    return { id, token };
  });

export const simulateScan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureFleet(context.userId);
    const sql = await getSql();
    const devices = await sql<{ id: string; hostname: string; status: string }>`
      select id, hostname, status from devices where user_id = ${context.userId}
    `;
    const checks = await sql<CheckRow>`
      select id, name, description, category, check_type, expected_value, severity, remediation, is_builtin, is_active
      from compliance_checks where user_id = ${context.userId} and is_active = true
    `;
    const now = new Date().toISOString();
    for (const device of devices) {
      const host = DEMO_HOSTS.find((h) => h.hostname === device.hostname);
      const failed = host ? failKeys(host.profile) : new Set<string>();
      if (!host && Math.random() < 0.25 && checks[0]) failed.add(checks[0].name);
      const offline = host?.profile === "offline";
      if (!offline) {
        await sql`
          update devices set last_seen = ${now} where id = ${device.id} and user_id = ${context.userId}
        `;
      }
      await writeReport(context.userId, device.id, checks, failed, Boolean(offline));
    }
    return { scanned: devices.length };
  });
