import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6">
        <p className="text-sm text-muted">Loading session…</p>
      </main>
    );
  }
  if (user) return <Navigate to="/" />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
        });
        if (err) throw new Error(err.message || "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || "Could not sign in");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-elevated text-primary">
            <ShieldCheck className="size-6" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Vigil</h1>
            <p className="text-sm text-muted">Security operations sign-in</p>
          </div>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-muted">
          Monitor Windows endpoints, compliance scores, and policy drift from a single operations
          console mapped to CIS, NIST CSF, and ISO 27001.
        </p>

        {authEnabled ? (
          <div className="space-y-5">
            <form onSubmit={(e) => void submit(e)} className="space-y-3">
              {mode === "up" ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  autoComplete="name"
                  className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
                />
              ) : null}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                autoComplete="email"
                required
                className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                required
                minLength={8}
                className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary"
              />
              {error ? <p className="text-sm text-bad">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-fg disabled:opacity-50"
              >
                {busy ? "Please wait…" : mode === "up" ? "Create analyst account" : "Sign in"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError(null);
              }}
              className="w-full text-sm text-muted hover:text-fg"
            >
              {mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
            <div className="relative py-1">
              <div className="h-px bg-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-xs text-subtle">
                or
              </span>
            </div>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <button
                  key={p.providerId}
                  type="button"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  className="h-11 w-full rounded-md border border-border text-sm font-medium transition-opacity duration-150 hover:bg-elevated"
                >
                  Continue with {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
