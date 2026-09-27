import { frameworksFor } from "@/lib/catalog";

export function FrameworkTags({ name }: { name: string | null | undefined }) {
  const fw = frameworksFor(name);
  if (!fw) {
    return <p className="text-xs text-subtle">Organization policy</p>;
  }
  return (
    <p className="text-xs text-subtle">
      {fw.cis} · NIST {fw.nist} · ISO {fw.iso}
    </p>
  );
}
