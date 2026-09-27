import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { listDevices, registerDevice } from "@/lib/compliance-api";

export const Route = createFileRoute("/agent")({ component: Page });

type Device = Awaited<ReturnType<typeof listDevices>>[number];

function Page() {
  return (
    <Protected>
      <AgentPage />
    </Protected>
  );
}

function AgentPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [hostname, setHostname] = useState("");
  const [osVersion, setOsVersion] = useState("Windows 11 Pro");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setDevices(await listDevices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load enrollment");
    }
  }

  useEffect(() => {
    void load();
    setOrigin(window.location.origin);
  }, []);

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim()) return;
    setBusy(true);
    try {
      const result = await registerDevice({
        data: {
          hostname: hostname.trim(),
          osVersion: osVersion.trim() || "Windows 11 Pro",
          ipAddress: "pending",
        },
      });
      setToken(result.token);
      setHostname("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register device");
    } finally {
      setBusy(false);
    }
  }

  const sampleToken = token ?? devices[0]?.agent_token ?? "tok_YOUR_TOKEN";
  const command = useMemo(
    () =>
      `powershell -ExecutionPolicy Bypass -File vigil-agent.ps1 -Server ${origin || "https://your-vigil-host"} -Token ${sampleToken}`,
    [origin, sampleToken],
  );

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied("Copy failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-subtle">Enrollment</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Windows agent</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Lightweight PowerShell — no extra software on the endpoint. Register a host, copy its
          token, and run the agent as Administrator. This console also includes a fleet simulator
          so you can demo without a Windows PC.
        </p>
      </div>

      <form
        onSubmit={(e) => void addDevice(e)}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="Hostname to enroll"
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
        />
        <input
          value={osVersion}
          onChange={(e) => setOsVersion(e.target.value)}
          placeholder="OS version"
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          Issue token
        </button>
      </form>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {token ? (
        <p className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-xs text-muted">
          New agent token: {token}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Install command</h2>
          <div className="flex gap-2">
            <a
              href="/agent/vigil-agent.ps1"
              download
              className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm"
            >
              Download script
            </a>
            <button
              type="button"
              onClick={() => void copy(command, "command")}
              className="h-11 rounded-md border border-border px-4 text-sm"
            >
              {copied === "command" ? "Copied" : "Copy command"}
            </button>
          </div>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-md bg-elevated p-4 text-xs text-muted">
          {command}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Issued tokens</h2>
        {devices.map((device) => (
          <article
            key={device.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{device.hostname}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">{device.agent_token}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={device.status} />
              <button
                type="button"
                onClick={() => void copy(device.agent_token ?? "", device.id)}
                className="h-11 rounded-md border border-border px-4 text-sm"
              >
                {copied === device.id ? "Copied" : "Copy token"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
