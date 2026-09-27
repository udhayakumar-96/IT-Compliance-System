import { createFileRoute } from "@tanstack/react-router";
import { ingestAgentReport } from "@/lib/agent-ingest";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

export const Route = createFileRoute("/api/agent/report")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }
        const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
        const token = typeof rec.token === "string" ? rec.token.trim() : "";
        if (token.length < 8) return json({ ok: false, error: "Missing token" }, 401);
        const resultsRaw = Array.isArray(rec.results) ? rec.results : [];
        const results = resultsRaw
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const key = typeof row.key === "string" ? row.key : "";
            const status = row.status === "fail" ? "fail" : "pass";
            if (!key) return null;
            return {
              key,
              status: status as "pass" | "fail",
              actual_value: typeof row.actual_value === "string" ? row.actual_value : undefined,
              message: typeof row.message === "string" ? row.message : undefined,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        const result = await ingestAgentReport({
          token,
          hostname: typeof rec.hostname === "string" ? rec.hostname : undefined,
          os_version: typeof rec.os_version === "string" ? rec.os_version : undefined,
          ip_address: typeof rec.ip_address === "string" ? rec.ip_address : undefined,
          results,
        });
        return json(result, result.ok ? 200 : 404);
      },
    },
  },
});
