import { cn } from "@/lib/cn";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "compliant" || status === "pass" || status === "online"
      ? "bg-ok/15 text-ok"
      : status === "non-compliant" || status === "fail" || status === "Critical"
        ? "bg-bad/15 text-bad"
        : status === "High" || status === "warn"
          ? "bg-warn/15 text-warn"
          : status === "Medium" || status === "Low"
            ? "bg-info/15 text-info"
            : "bg-elevated text-muted";

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium tracking-wide capitalize",
        tone,
      )}
    >
      {status.replace("-", " ")}
    </span>
  );
}
