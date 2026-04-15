import { Context, Effect, Layer, Option } from "effect"
import { Env } from "../env.ts"

export interface EtagEntry {
	readonly etag: string
	readonly body: string
}

export interface EtagCacheShape {
	readonly get: (key: string) => Effect.Effect<Option.Option<EtagEntry>>
	readonly set: (key: string, entry: EtagEntry) => Effect.Effect<void>
}

export class EtagCache extends Context.Tag("EtagCache")<EtagCache, EtagCacheShape>() {}

// Best-effort: cache failures degrade to "no cache" rather than killing the request.
export const EtagCacheD1 = Layer.effect(
	EtagCache,
	Effect.gen(function* () {
		const env = yield* Env
		const db = env.DB
		return {
			get: (key) =>
				Effect.tryPromise(() =>
					db
						.prepare("SELECT etag, body FROM etag_cache WHERE key = ?")
						.bind(key)
						.first<{ etag: string; body: string }>(),
				).pipe(
					Effect.map((r) => (r ? Option.some({ etag: r.etag, body: r.body }) : Option.none())),
					Effect.catchAll(() => Effect.succeed(Option.none<EtagEntry>())),
				),
			set: (key, entry) =>
				Effect.tryPromise(() =>
					db
						.prepare(
							"INSERT INTO etag_cache (key, etag, body, updated_at) VALUES (?, ?, ?, ?) " +
								"ON CONFLICT(key) DO UPDATE SET etag=excluded.etag, body=excluded.body, updated_at=excluded.updated_at",
						)
						.bind(key, entry.etag, entry.body, new Date().toISOString())
						.run(),
				).pipe(
					Effect.asVoid,
					Effect.catchAll(() => Effect.void),
				),
		}
	}),
)

export const EtagCacheNoop = Layer.succeed(EtagCache, {
	get: () => Effect.succeed(Option.none()),
	set: () => Effect.void,
})
