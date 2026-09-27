import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell, AuthSkeleton } from "@/components/app-shell";

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <AppShell>
        <AuthSkeleton />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <AppShell>{children}</AppShell>;
}
