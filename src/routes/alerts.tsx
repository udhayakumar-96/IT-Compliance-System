import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { FrameworkTags } from "@/components/framework-tags";
import { relativeTime } from "@/lib/format";
import { listAlerts, resolveAlert } from "@/lib/compliance-api";

export const Route = createFileRoute("/alerts")({ component: Page });

type Alert = Awaited<ReturnType<typeof listAlerts>>[number];

function Page() {
  return (
    <Protected>
      <AlertsPage />
    </Protected>
  );
}

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setAlerts(await listAlerts());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function resolve(id: string) {
    await resolveAlert({ data: id });
    await load();
  }

  const open = alerts.filter((a) => !a.is_resolved);
  const visible = useMemo(
    () => (filter === "open" ? open : alerts),
    [alerts, filter, open],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-subtle">Response</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-muted">{open.length} open issues across the fleet</p>
        </div>
        <div className="flex rounded-md border border-border p-1">
          {(["open", "all"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`h-9 rounded px-3 text-sm capitalize ${filter === key ? "bg-elevated text-fg" : "text-muted"}`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted">No alerts in this view. Run a fleet scan from Overview.</p>
        ) : (
          visible.map((alert) => (
            <article key={alert.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    {alert.is_resolved ? <StatusBadge status="compliant" /> : null}
                    <span className="text-xs text-subtle">{relativeTime(alert.created_at)}</span>
                  </div>
                  <p className="mt-2 font-medium">{alert.message}</p>
                  <FrameworkTags name={alert.check_name} />
                  <Link
                    to="/devices/$deviceId"
                    params={{ deviceId: alert.device_id }}
                    className="mt-1 inline-flex h-11 items-center text-sm text-muted hover:text-fg"
                  >
                    {alert.hostname}
                    {alert.check_name ? ` · ${alert.check_name}` : ""}
                  </Link>
                </div>
                {!alert.is_resolved ? (
                  <button
                    type="button"
                    onClick={() => void resolve(alert.id)}
                    className="h-11 rounded-md border border-border px-4 text-sm"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
