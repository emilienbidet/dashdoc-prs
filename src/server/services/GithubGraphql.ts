import { Data, Duration, Effect, Option, Schedule, Schema } from "effect"
import { Env } from "../env.ts"
import { BoardQueryResponse, BOARD_QUERY } from "../graphql/BoardQuery.ts"
import { EtagCache, type EtagCacheShape } from "./EtagCache.ts"

const ENDPOINT = "https://api.github.com/graphql"

export class GraphqlError extends Data.TaggedError("GraphqlError")<{
	readonly op: string
	readonly status?: number
	readonly cause?: unknown
}> {}

const retryable = Schedule.exponential("500 millis").pipe(
	Schedule.compose(Schedule.recurs(4)),
	Schedule.whileInput(
		(e: GraphqlError) => e.status === undefined || e.status === 429 || e.status >= 500,
	),
)

const post = <A, I>(
	env: typeof Env.Service,
	cache: EtagCacheShape,
	op: string,
	schema: Schema.Schema<A, I>,
	query: string,
	variables: Record<string, unknown>,
) =>
	Effect.gen(function* () {
		const key = `gql:${op}:${JSON.stringify(variables)}`
		const cached = yield* cache.get(key)
		const res = yield* Effect.tryPromise({
			try: () =>
				fetch(ENDPOINT, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${env.GITHUB_TOKEN}`,
						"Content-Type": "application/json",
						Accept: "application/vnd.github+json",
						"User-Agent": "dashdoc-prs-kanban",
						...(Option.isSome(cached) ? { "If-None-Match": cached.value.etag } : {}),
					},
					body: JSON.stringify({ query, variables }),
				}),
			catch: (cause) => new GraphqlError({ op, cause }),
		})

		if (res.status === 304 && Option.isSome(cached)) {
			return yield* Schema.decodeUnknown(schema)(JSON.parse(cached.value.body)).pipe(
				Effect.mapError((cause) => new GraphqlError({ op, cause })),
			)
		}

		if (!res.ok) {
			return yield* Effect.fail(new GraphqlError({ op, status: res.status }))
		}

		const bodyText = yield* Effect.tryPromise({
			try: () => res.text(),
			catch: (cause) => new GraphqlError({ op, status: res.status, cause }),
		})
		const etag = res.headers.get("etag")
		if (etag) yield* cache.set(key, { etag, body: bodyText })

		return yield* Schema.decodeUnknown(schema)(JSON.parse(bodyText)).pipe(
			Effect.mapError((cause) => new GraphqlError({ op, cause })),
		)
	}).pipe(
		Effect.retry(retryable),
		Effect.timeout(Duration.seconds(20)),
		Effect.mapError((e) =>
			e instanceof GraphqlError ? e : new GraphqlError({ op, cause: e }),
		),
	)

export class GithubGraphql extends Effect.Service<GithubGraphql>()("GithubGraphql", {
	effect: Effect.gen(function* () {
		const env = yield* Env
		const cache = yield* EtagCache

		return {
			board: (since: string) =>
				post(env, cache, "board", BoardQueryResponse, BOARD_QUERY, {
					q: `repo:${env.GITHUB_REPO} author:${env.GITHUB_USER} is:pr updated:>=${since}`,
				}).pipe(Effect.map((r) => r.data.search.nodes)),
		}
	}),
}) {}
