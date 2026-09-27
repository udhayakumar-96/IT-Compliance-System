#!/usr/bin/env node
/**
 * Dev-server entry used by `npm run dev`.
 *
 * In GitHub Codespaces, email/password sign-in must trust the forwarded
 * https://<name>-8080.app.github.dev origin (Better Auth "Invalid origin"
 * otherwise). Local / Grok preview are unchanged.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.CODESPACES === "true") {
  const name = (process.env.CODESPACE_NAME || "").trim();
  const domain = (process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev").trim();
  if (name && !process.env.BETTER_AUTH_URL) {
    process.env.BETTER_AUTH_URL = `https://${name}-8080.${domain}`;
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = "vigil-codespace-demo-secret-min-32-chars";
  }
  if (process.env.BETTER_AUTH_URL) {
    console.log(`\n  Vigil Codespace URL:\n  ${process.env.BETTER_AUTH_URL}\n`);
    console.log("  Ports tab → 8080 → set visibility to Public → Open in Browser\n");
  }
}

const root = dirname(fileURLToPath(import.meta.url));
const child = spawn(
  process.execPath,
  [join(root, "with-app-env.mjs"), "vite", "dev", "--host", "0.0.0.0", "--port", "8080"],
  { stdio: "inherit", env: process.env, cwd: join(root, "..") },
);

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
