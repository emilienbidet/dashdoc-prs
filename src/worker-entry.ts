import tanstack from "@tanstack/react-start/server-entry"
import { Effect } from "effect"
import { runPromise } from "./server/effect/runtime.ts"
import type { AppBindings } from "./server/env.ts"
import { D1Store } from "./server/services/D1Store.ts"
import { GithubClient } from "./server/services/GithubClient.ts"
import { runSync } from "./server/services/PrSync.ts"

const syncEffect = runSync.pipe(
	Effect.provide(GithubClient.Default),
	Effect.provide(D1Store.Default),
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
