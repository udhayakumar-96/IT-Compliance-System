import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/status-badge";
import { FrameworkTags } from "@/components/framework-tags";
import { CHECK_CATEGORIES, SEVERITIES } from "@/lib/catalog";
import { createCheck, listChecks, setChecksActive, toggleCheck } from "@/lib/compliance-api";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/policies")({ component: Page });

type Check = Awaited<ReturnType<typeof listChecks>>[number];

function Page() {
  return (
    <Protected>
      <PoliciesPage />
    </Protected>
  );
}

function YesNo({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={value ? "Check this control" : "Skip this control"}
      className="inline-flex h-11 shrink-0 rounded-lg border border-border bg-elevated p-0.5"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          "min-w-14 rounded-md px-3 text-sm font-medium transition-colors duration-150",
          value ? "bg-ok/20 text-ok" : "text-subtle hover:text-fg",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          "min-w-14 rounded-md px-3 text-sm font-medium transition-colors duration-150",
          !value ? "bg-elevated text-muted ring-1 ring-border" : "text-subtle hover:text-fg",
        )}
      >
        No
      </button>
    </div>
  );
}

function PoliciesPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [name, setName] = useState("");
  const [expected, setExpected] = useState("");
  const [category, setCategory] = useState("Access Control");
  const [severity, setSeverity] = useState("High");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");

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

  async function setActive(check: Check, isActive: boolean) {
    setChecks((prev) => prev.map((row) => (row.id === check.id ? { ...row, is_active: isActive } : row)));
    setSaving(check.id);
    try {
      await toggleCheck({ data: { id: check.id, isActive } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      await load();
    } finally {
      setSaving(null);
    }
  }

  async function setCategoryAll(ids: string[], isActive: boolean) {
    setChecks((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, is_active: isActive } : row)));
    setSaving(ids[0] ?? "cat");
    try {
      await setChecksActive({ data: { ids, isActive } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      await load();
    } finally {
      setSaving(null);
    }
  }

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return checks.filter((check) => {
      if (filter !== "All" && check.category !== filter) return false;
      if (!q) return true;
      return (
        check.name.toLowerCase().includes(q) ||
        (check.description ?? "").toLowerCase().includes(q) ||
        check.category.toLowerCase().includes(q)
      );
    });
  }, [checks, filter, query]);

  const builtin = filtered.filter((c) => c.is_builtin);
  const custom = filtered.filter((c) => !c.is_builtin);
  const enabledCount = checks.filter((c) => c.is_active).length;

  const byCategory = CHECK_CATEGORIES.map((cat) => ({
    cat,
    items: builtin.filter((c) => c.category === cat),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-subtle">Baselines</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Compliance policies</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Choose which Windows components the fleet must be evaluated against. Yes includes the
          control in every scan. No skips it on all devices.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Enabled</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">
            {enabledCount}
            <span className="text-sm text-muted"> / {checks.length}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Built-in catalog</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">{checks.filter((c) => c.is_builtin).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-widest text-subtle">Skipped</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">{checks.length - enabledCount}</p>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search controls (BitLocker, screen lock, password…)"
          className="h-11 flex-1 rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 rounded-md border border-border bg-elevated px-3 text-sm sm:w-52"
        >
          <option value="All">All categories</option>
          {CHECK_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-bad">{error}</p> : null}

      {checks.length === 0 ? <p className="text-sm text-muted">Loading control catalog…</p> : null}

      <div className="space-y-8">
        {byCategory.map(({ cat, items }) => {
          const ids = items.map((item) => item.id);
          const on = items.filter((item) => item.is_active).length;
          return (
            <section key={cat}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">{cat}</h2>
                  <p className="text-xs text-subtle">
                    {on} of {items.length} checked
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void setCategoryAll(ids, true)}
                    className="h-11 rounded-md border border-border px-3 text-sm text-muted hover:text-fg"
                  >
                    Check all
                  </button>
                  <button
                    type="button"
                    onClick={() => void setCategoryAll(ids, false)}
                    className="h-11 rounded-md border border-border px-3 text-sm text-muted hover:text-fg"
                  >
                    Skip all
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                {items.map((check, index) => (
                  <article
                    key={check.id}
                    className={cn(
                      "flex flex-col gap-3 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between",
                      index > 0 ? "border-t border-border" : "",
                      !check.is_active ? "opacity-70" : "",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{check.name}</p>
                        <StatusBadge status={check.severity} />
                      </div>
                      <p className="mt-1 text-sm text-muted">{check.description}</p>
                      <p className="mt-1 text-xs text-subtle">Expect {check.expected_value}</p>
                      <FrameworkTags name={check.name} />
                    </div>
                    <YesNo
                      value={check.is_active}
                      disabled={saving === check.id}
                      onChange={(next) => void setActive(check, next)}
                    />
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Organization checks</h2>
          <p className="text-xs text-subtle">Add a custom control. It also gets a Yes / No switch.</p>
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
        {custom.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            {custom.map((check, index) => (
              <article
                key={check.id}
                className={cn(
                  "flex flex-col gap-3 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between",
                  index > 0 ? "border-t border-border" : "",
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{check.name}</p>
                    <StatusBadge status={check.severity} />
                    <span className="text-xs text-subtle">Custom</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{check.description}</p>
                  <p className="mt-1 text-xs text-subtle">
                    {check.category} · expect {check.expected_value}
                  </p>
                </div>
                <YesNo value={check.is_active} onChange={(next) => void setActive(check, next)} />
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
