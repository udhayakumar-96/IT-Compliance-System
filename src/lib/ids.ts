export function newId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand}`;
}

export function builtinCheckId(userId: string, key: string): string {
  return `chk_${userId.slice(0, 8)}_${key}`;
}

export function deviceId(userId: string, hostname: string): string {
  return `dev_${userId.slice(0, 8)}_${hostname.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
