import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { runPromise } from "#/server/effect/runtime.ts"
import type { AppBindings } from "#/server/env.ts"
import { syncEffect } from "#/worker-entry.ts"

// Awaits the full sync so the Worker runtime keeps the request alive.
// Typical warm sync (ETag-cached) is sub-second per PR → well under limits.
// The client is expected to fire-and-forget (no await).
export const Route = createFileRoute("/api/sync")({
	server: {
		handlers: {
			POST: async () => {
				await runPromise(env as AppBindings, syncEffect)
				return new Response(null, { status: 204 })
			},
		},
	},
})
