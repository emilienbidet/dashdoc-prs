import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { Effect, Layer } from "effect"
import { runPromise } from "#/server/effect/runtime.ts"
import type { AppBindings } from "#/server/env.ts"
import { D1Store } from "#/server/services/D1Store.ts"

const list = Effect.gen(function* () {
	const db = yield* D1Store
	return yield* db.listPrs
}).pipe(Effect.provide(Layer.mergeAll(D1Store.Default)))

export const Route = createFileRoute("/api/prs")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const data = await runPromise(env as AppBindings, list)
					return Response.json(data, {
						headers: { "cache-control": "no-store" },
					})
				} catch (e) {
					return Response.json({ error: String(e) }, { status: 500 })
				}
			},
		},
	},
})
