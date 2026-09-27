import { getSql } from "@/lib/db";
import { BUILTIN_CHECKS } from "@/lib/catalog";
import { newId } from "@/lib/ids";

type IncomingResult = {
  key: string;
  status: "pass" | "fail";
  actual_value?: string;
  message?: string;
};

export type AgentPayload = {
  token: string;
  hostname?: string;
  os_version?: string;
  ip_address?: string;
  results: IncomingResult[];
};

export async function ingestAgentReport(payload: AgentPayload) {
  const sql = await getSql();
  const devices = await sql<{
    id: string;
    user_id: string;
    hostname: string;
  }>`
    select id, user_id, hostname from devices where agent_token = ${payload.token} limit 1
  `;
  const device = devices[0];
  if (!device) {
    return { ok: false as const, error: "Unknown agent token" };
  }

  const checks = await sql<{
    id: string;
    name: string;
    expected_value: string | null;
    severity: string;
  }>`
    select id, name, expected_value, severity
    from compliance_checks
    where user_id = ${device.user_id} and is_active = true
  `;

  const byKey = new Map<string, IncomingResult>();
  for (const result of payload.results) {
    byKey.set(result.key, result);
  }

  const reportId = newId("rpt");
  let passed = 0;
  let failCount = 0;
  const now = new Date().toISOString();

  await sql`
    insert into compliance_reports (id, user_id, device_id, compliance_score, passed_checks, failed_checks)
    values (${reportId}, ${device.user_id}, ${device.id}, 0, 0, 0)
  `;

  for (const check of checks) {
    const builtin = BUILTIN_CHECKS.find((c) => c.name === check.name);
    const key = builtin?.key ?? check.id;
    const reported = byKey.get(key) ?? byKey.get(check.name);
    const isFail = reported?.status === "fail";
    if (isFail) failCount += 1;
    else passed += 1;
    const actual = reported?.actual_value ?? (isFail ? "Non-compliant" : check.expected_value);
    const message = reported?.message ?? (isFail ? `${check.name} failed policy baseline.` : "Meets baseline.");
    await sql`
      insert into device_check_results (id, user_id, report_id, check_id, status, actual_value, message)
      values (
        ${newId("res")}, ${device.user_id}, ${reportId}, ${check.id},
        ${isFail ? "fail" : "pass"}, ${actual}, ${message}
      )
    `;
    if (isFail && (check.severity === "Critical" || check.severity === "High")) {
      const open = await sql<{ id: string }>`
        select id from alerts
        where user_id = ${device.user_id} and device_id = ${device.id} and check_id = ${check.id} and is_resolved = false
        limit 1
      `;
      if (open.length === 0) {
        await sql`
          insert into alerts (id, user_id, device_id, check_id, severity, message, is_resolved)
          values (${newId("al")}, ${device.user_id}, ${device.id}, ${check.id}, ${check.severity}, ${message}, false)
        `;
      }
    }
  }

  const total = passed + failCount;
  const score = total ? Math.round((passed / total) * 10000) / 100 : 0;
  const status = failCount > 0 ? "non-compliant" : "compliant";

  await sql`
    update compliance_reports
    set compliance_score = ${score}, passed_checks = ${passed}, failed_checks = ${failCount}
    where id = ${reportId}
  `;
  await sql`
    update devices set
      last_seen = ${now},
      status = ${status},
      compliance_score = ${score},
      os_version = coalesce(${payload.os_version ?? null}, os_version),
      ip_address = coalesce(${payload.ip_address ?? null}, ip_address),
      hostname = coalesce(${payload.hostname ?? null}, hostname)
    where id = ${device.id}
  `;

  return {
    ok: true as const,
    device_id: device.id,
    hostname: payload.hostname ?? device.hostname,
    score,
    passed,
    failed: failCount,
  };
}
