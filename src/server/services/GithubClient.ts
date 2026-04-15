import { Data, Duration, Effect, Option, Schedule, Schema } from "effect"
import { Env } from "../env.ts"
import { CommitShas } from "../schemas/Commit.ts"
import { MatchingRefs } from "../schemas/Tag.ts"
import { EtagCache, type EtagCacheShape } from "./EtagCache.ts"

const API = "https://api.github.com"

export class GithubError extends Data.TaggedError("GithubError")<{
	readonly path: string
	readonly status?: number
	readonly cause?: unknown
}> {}

const retryable = Schedule.exponential("500 millis").pipe(
	Schedule.compose(Schedule.recurs(4)),
	Schedule.whileInput(
		(e: GithubError) => e.status === undefined || e.status === 429 || e.status >= 500,
	),
)

type Deps = {
	env: typeof Env.Service
	cache: EtagCacheShape
}

const decode = <A, I>(schema: Schema.Schema<A, I>, path: string, json: unknown) =>
	Schema.decodeUnknown(schema)(json, { errors: "first" }).pipe(
		Effect.mapError((cause) => new GithubError({ path, cause })),
	)

const getJson = <A, I>(deps: Deps, schema: Schema.Schema<A, I>, path: string) =>
	Effect.gen(function* () {
		const cached = yield* deps.cache.get(path)
		const res = yield* Effect.tryPromise({
			try: () =>
				fetch(`${API}${path}`, {
					headers: {
						Authorization: `Bearer ${deps.env.GITHUB_TOKEN}`,
						Accept: "application/vnd.github+json",
						"X-GitHub-Api-Version": "2022-11-28",
						"User-Agent": "dashdoc-prs-kanban",
						...(Option.isSome(cached) ? { "If-None-Match": cached.value.etag } : {}),
					},
				}),
			catch: (cause) => new GithubError({ path, cause }),
		})

		if (res.status === 304 && Option.isSome(cached)) {
			return yield* decode(schema, path, JSON.parse(cached.value.body))
		}

		if (!res.ok) {
			return yield* Effect.fail(new GithubError({ path, status: res.status }))
		}

		const bodyText = yield* Effect.tryPromise({
			try: () => res.text(),
			catch: (cause) => new GithubError({ path, status: res.status, cause }),
		})
		const etag = res.headers.get("etag")
		if (etag) yield* deps.cache.set(path, { etag, body: bodyText })

		return yield* decode(schema, path, JSON.parse(bodyText))
	}).pipe(
		Effect.retry(retryable),
		Effect.timeout(Duration.seconds(15)),
		Effect.mapError((e) => (e instanceof GithubError ? e : new GithubError({ path, cause: e }))),
	)

const CompareResult = Schema.Struct({
	status: Schema.Literal("ahead", "behind", "identical", "diverged"),
	ahead_by: Schema.Number,
	behind_by: Schema.Number,
})

export class GithubClient extends Effect.Service<GithubClient>()("GithubClient", {
	effect: Effect.gen(function* () {
		const env = yield* Env
		const cache = yield* EtagCache
		const deps: Deps = { env, cache }
		const repo = env.GITHUB_REPO

		return {
			listTags: (prefix: string) =>
				getJson(deps, MatchingRefs, `/repos/${repo}/git/matching-refs/tags/${prefix}`),

			// GitHub returns at most 100 commits per page. `max` is the depth we
			// want to cover. Older pages are append-only so they 304 under
			// ETag caching once warm.
			listBranchCommits: (branch: string, max = 2000) => {
				const pages = Math.max(1, Math.ceil(max / 100))
				return Effect.forEach(
					Array.from({ length: pages }, (_, i) => i + 1),
					(page) =>
						getJson(
							deps,
							CommitShas,
							`/repos/${repo}/commits?sha=${branch}&per_page=100&page=${page}`,
						),
					{ concurrency: 4 },
				).pipe(Effect.map((chunks) => chunks.flat().map((c) => c.sha)))
			},

			// Definitive ancestry test: `status` is `identical` or `behind` with
			// ahead_by=0 iff `sha` is an ancestor of (or equal to) gitbook HEAD.
			// Expensive (single call per query) so PrSync only falls back to
			// this for merged PRs not found in the listBranchCommits Set.
			isAncestorOfGitbook: (sha: string) =>
				getJson(deps, CompareResult, `/repos/${repo}/compare/gitbook...${sha}`).pipe(
					Effect.map(
						(r) => (r.status === "identical" || r.status === "behind") && r.ahead_by === 0,
					),
				),
		}
	}),
}) {}
