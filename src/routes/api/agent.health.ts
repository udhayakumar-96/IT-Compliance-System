import { createFileRoute } from "@tanstack/react-router";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}

export const Route = createFileRoute("/api/agent/health")({
  server: {
    handlers: {
      GET: () => json({ ok: true, service: "vigil-agent" }),
    },
  },
});
