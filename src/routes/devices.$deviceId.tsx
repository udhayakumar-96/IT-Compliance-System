import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { FrameworkTags } from "@/components/framework-tags";
import { formatScore, relativeTime } from "@/lib/format";
import { getDevice } from "@/lib/compliance-api";

export const Route = createFileRoute("/devices/$deviceId")({ component: Page });

type Detail = Awaited<ReturnType<typeof getDevice>>;

function Page() {
  return (
    <Protected>
      <DeviceDetail />
    </Protected>
  );
}

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const [device, setDevice] = useState<Detail>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDevice({ data: deviceId })
      .then((row) => {
        setDevice(row);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load device"))
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (loading) return <p className="text-sm text-muted">Loading device…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (!device) return <p className="text-sm text-muted">Device not found.</p>;

  const failed = device.results.filter((r) => r.status === "fail").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/devices" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" />
        All devices
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{device.hostname}</h1>
          <p className="mt-1 text-sm text-muted">
            {device.os_version} · {device.ip_address}
          </p>
          <p className="mt-1 text-xs text-subtle">Last seen {relativeTime(device.last_seen)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl tabular-nums">{formatScore(device.compliance_score)}</span>
          <StatusBadge status={device.status} />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Checks</p>
          <p className="mt-2 font-mono text-2xl tabular-nums">{device.results.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Failed</p>
          <p className="mt-2 font-mono text-2xl tabular-nums">{failed}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Reports</p>
          <p className="mt-2 font-mono text-2xl tabular-nums">{device.reports.length}</p>
        </div>
      </section>

      {device.reports.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Scan history</h2>
          <ul className="mt-3 space-y-2">
            {device.reports.map((report) => (
              <li key={report.id} className="flex items-center justify-between text-sm">
                <span className="text-muted">{relativeTime(report.created_at)}</span>
                <span className="font-mono tabular-nums">
                  {formatScore(report.compliance_score)} · {report.passed_checks} pass / {report.failed_checks} fail
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="space-y-2">
        {device.results.map((result) => (
          <article key={result.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{result.name ?? "Check"}</p>
                <p className="text-xs text-muted">{result.category}</p>
                <FrameworkTags name={result.name} />
              </div>
              <div className="flex items-center gap-2">
                {result.severity ? <StatusBadge status={result.severity} /> : null}
                <StatusBadge status={result.status} />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">
              Expected {result.expected_value ?? "—"} · observed {result.actual_value ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted">{result.message}</p>
            {result.status === "fail" && result.remediation ? (
              <p className="mt-2 text-sm text-fg">{result.remediation}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
