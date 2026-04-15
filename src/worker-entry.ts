import tanstack from "@tanstack/react-start/server-entry"
import { Effect, Layer } from "effect"
import { runPromise } from "./server/effect/runtime.ts"
import type { AppBindings } from "./server/env.ts"
import { D1Store } from "./server/services/D1Store.ts"
import { EtagCacheD1 } from "./server/services/EtagCache.ts"
import { GithubClient } from "./server/services/GithubClient.ts"
import { GithubGraphql } from "./server/services/GithubGraphql.ts"
import { runSync } from "./server/services/PrSync.ts"

const services = Layer.mergeAll(
	GithubClient.Default.pipe(Layer.provide(EtagCacheD1)),
	GithubGraphql.Default.pipe(Layer.provide(EtagCacheD1)),
	D1Store.Default,
)

const syncEffect = runSync.pipe(
	Effect.provide(services),
	Effect.tap((r) => Effect.logInfo(`sync ok: ${JSON.stringify(r)}`)),
	Effect.tapError((e) => Effect.logError("sync failed", e)),
	Effect.catchAll(() => Effect.void),
)

export default {
	fetch: tanstack.fetch as unknown as ExportedHandlerFetchHandler<AppBindings>,
	async scheduled(_event, env, ctx) {
		ctx.waitUntil(runPromise(env, syncEffect))
	},
} satisfies ExportedHandler<AppBindings>

export { runPromise, syncEffect }
