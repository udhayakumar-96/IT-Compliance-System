import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { FrameworkTags } from "@/components/framework-tags";
import { CHECK_CATEGORIES, SEVERITIES } from "@/lib/catalog";
import { createCheck, listChecks, toggleCheck } from "@/lib/compliance-api";

export const Route = createFileRoute("/policies")({ component: Page });

type Check = Awaited<ReturnType<typeof listChecks>>[number];

function Page() {
  return (
    <Protected>
      <PoliciesPage />
    </Protected>
  );
}

function PoliciesPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [name, setName] = useState("");
  const [expected, setExpected] = useState("");
  const [category, setCategory] = useState("Access Control");
  const [severity, setSeverity] = useState("High");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setChecks(await listChecks());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load policies");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createCheck({
        data: {
          name: name.trim(),
          description: "Custom organization control authored from the operations console.",
          category,
          checkType: "registry",
          expectedValue: expected.trim() || "Compliant",
          severity,
          remediation: "Remediate according to internal policy.",
        },
      });
      setName("");
      setExpected("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add check");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-subtle">Baselines</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Compliance policies</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Built-in checks map to CIS Windows Benchmarks, NIST CSF 2.0, and ISO 27001:2022. Add
          organization-specific controls without waiting on a vendor catalog.
        </p>
      </div>

      <form
        onSubmit={(e) => void add(e)}
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Custom check name"
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary lg:col-span-2"
        />
        <input
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Expected value"
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm"
        >
          {CHECK_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-11 flex-1 rounded-md border border-border bg-elevated px-3 text-sm"
          >
            {SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
      {error ? <p className="text-sm text-bad">{error}</p> : null}

      <div className="space-y-2">
        {checks.map((check) => (
          <article key={check.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{check.name}</p>
                  <StatusBadge status={check.severity} />
                  <span className="text-xs text-subtle">{check.is_builtin ? "Built-in" : "Custom"}</span>
                  {!check.is_active ? <span className="text-xs text-warn">Disabled</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">{check.description}</p>
                <p className="mt-1 text-xs text-subtle">
                  {check.category} · expect {check.expected_value}
                </p>
                <FrameworkTags name={check.is_builtin ? check.name : null} />
              </div>
              <button
                type="button"
                onClick={() =>
                  void toggleCheck({ data: { id: check.id, isActive: !check.is_active } }).then(load)
                }
                className="h-11 rounded-md border border-border px-4 text-sm"
              >
                {check.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
