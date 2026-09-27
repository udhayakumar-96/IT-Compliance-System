import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { formatScore, relativeTime } from "@/lib/format";
import { listDevices } from "@/lib/compliance-api";

export const Route = createFileRoute("/devices/")({ component: Page });

type Device = Awaited<ReturnType<typeof listDevices>>[number];

function Page() {
  return (
    <Protected>
      <DevicesPage />
    </Protected>
  );
}

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDevices()
      .then(setDevices)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load devices"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(
      (d) =>
        d.hostname.toLowerCase().includes(q) ||
        (d.os_version ?? "").toLowerCase().includes(q) ||
        (d.ip_address ?? "").includes(q),
    );
  }, [devices, query]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-subtle">Inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Windows devices</h1>
          <p className="mt-1 text-sm text-muted">{devices.length} enrolled endpoints</p>
        </div>
        <Link
          to="/agent"
          className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm"
        >
          Enroll agent
        </Link>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search hostname, OS, or IP"
        className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
      />

      {error ? <p className="text-sm text-bad">{error}</p> : null}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No devices match that filter.</p>
        ) : (
          filtered.map((device) => (
            <Link
              key={device.id}
              to="/devices/$deviceId"
              params={{ deviceId: device.id }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{device.hostname}</p>
                <p className="text-sm text-muted">
                  {device.os_version} · {device.ip_address ?? "no IP"}
                </p>
                <p className="mt-1 text-xs text-subtle">Last seen {relativeTime(device.last_seen)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">{formatScore(device.compliance_score)}</span>
                <StatusBadge status={device.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
