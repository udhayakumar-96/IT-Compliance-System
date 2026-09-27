import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Bell, Monitor, ShieldAlert } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { FrameworkTags } from "@/components/framework-tags";
import { formatScore, relativeTime } from "@/lib/format";
import { getOverview, simulateScan } from "@/lib/compliance-api";

export const Route = createFileRoute("/")({ component: Home });

type Overview = Awaited<ReturnType<typeof getOverview>>;

function Home() {
  return (
    <Protected>
      <OverviewPage />
    </Protected>
  );
}

function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      setData(await getOverview());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load fleet");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function scan() {
    setScanning(true);
    setNotice(null);
    try {
      const result = await simulateScan();
      await load();
      setNotice(`Fleet scan complete · ${result.scanned} hosts`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-muted">Loading fleet posture…</p>;
  }
  if (error) {
    return <p className="text-sm text-bad">{error}</p>;
  }
  if (!data) return null;

  const cards = [
    { label: "Fleet score", value: formatScore(data.averageScore), icon: Activity },
    { label: "Online devices", value: `${data.online}/${data.total}`, icon: Monitor },
    { label: "Non-compliant", value: String(data.nonCompliant), icon: ShieldAlert },
    { label: "Open alerts", value: String(data.openAlerts), icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-subtle">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Fleet posture</h1>
          <p className="mt-1 text-sm text-muted">
            {data.builtinCount} endpoint controls mapped to CIS, NIST CSF 2.0, and ISO 27001:2022.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void scan()}
          disabled={scanning}
          className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {scanning ? "Scanning…" : "Run fleet scan"}
        </button>
      </div>
      {notice ? (
        <p className="rounded-md border border-border bg-elevated px-3 py-2 text-sm text-muted">{notice}</p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between text-muted">
                <p className="text-xs uppercase tracking-widest">{card.label}</p>
                <Icon className="size-4" />
              </div>
              <p className="mt-3 font-mono text-3xl tabular-nums tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Compliance trend</h2>
          <div className="mt-4 h-56">
            {data.trend.length === 0 ? (
              <p className="text-sm text-muted">No historical reports yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-muted)" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-fg)",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Failing controls</h2>
            <Link to="/alerts" className="text-sm text-muted hover:text-fg">
              Alerts
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.failing.length === 0 ? (
              <p className="text-sm text-muted">No failed controls on the latest scan.</p>
            ) : (
              data.failing.map((row) => (
                <div key={row.name} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <FrameworkTags name={row.name} />
                  </div>
                  <div className="text-right">
                    <StatusBadge status={row.severity} />
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted">{row.hosts} hosts</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Devices</h2>
          <Link to="/devices" className="text-sm text-muted hover:text-fg">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-widest text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">OS</th>
                <th className="px-4 py-3 font-medium">Seen</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.devices.map((device) => (
                <tr key={device.id} className="border-t border-border bg-surface">
                  <td className="px-4 py-3">
                    <Link to="/devices/$deviceId" params={{ deviceId: device.id }} className="hover:underline">
                      {device.hostname}
                    </Link>
                    <p className="text-xs text-muted">{device.ip_address}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{device.os_version}</td>
                  <td className="px-4 py-3 text-xs text-muted">{relativeTime(device.last_seen)}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{formatScore(device.compliance_score)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={device.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
