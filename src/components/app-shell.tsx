import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Monitor, Shield, ShieldCheck, SlidersHorizontal, Terminal, UserRound } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/devices", label: "Devices", icon: Monitor },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/policies", label: "Policies", icon: SlidersHorizontal },
  { to: "/agent", label: "Agent", icon: Terminal },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const user = useCurrentUser();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="flex size-9 items-center justify-center rounded-md bg-elevated text-primary">
              <ShieldCheck className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Vigil</p>
              <p className="text-xs text-muted">Asset compliance</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-subtle">Mapped to</p>
            <p className="mt-1 text-xs text-muted">CIS · NIST CSF · ISO 27001</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <Shield className="size-4 text-primary" />
              <span className="text-sm font-semibold">Vigil</span>
            </div>
            <p className="hidden text-sm text-muted md:block">IT security operations</p>
            <div className="flex items-center gap-3">
              {isPending ? (
                <div className="size-8 animate-pulse rounded-full bg-elevated" />
              ) : (
                <>
                  <span className="hidden max-w-40 truncate text-sm text-muted sm:block">
                    {user?.displayName ?? user?.primaryEmail ?? "Analyst"}
                  </span>
                  <UserButton />
                </>
              )}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
          <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-5 border-t border-border bg-surface md:hidden">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3 text-muted">
        <UserRound className="size-5" />
        <span className="text-sm">Loading operations console…</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["Fleet score", "Online devices", "Non-compliant", "Open alerts"].map((label) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
            <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
