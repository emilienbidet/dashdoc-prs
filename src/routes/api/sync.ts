import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { isAuthenticated } from "#/server/auth.ts"
import { runPromise } from "#/server/effect/runtime.ts"
import type { AppBindings } from "#/server/env.ts"
import { syncEffect } from "#/worker-entry.ts"

export const Route = createFileRoute("/api/sync")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const e = env as AppBindings
				if (!(await isAuthenticated(request, e.AUTH_PASSWORD))) {
					return Response.json({ error: "unauthorized" }, { status: 401 })
				}
				await runPromise(e, syncEffect)
				return new Response(null, { status: 204 })
			},
		},
	},
})
