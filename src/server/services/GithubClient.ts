import { Data, Duration, Effect, Option, Schedule, Schema } from "effect"
import { Env } from "../env.ts"
import { CheckRunsResponse } from "../schemas/CheckRun.ts"
import { CommitShas } from "../schemas/Commit.ts"
import { Pr, SearchIssuesResult } from "../schemas/Pr.ts"
import { Reviews } from "../schemas/Review.ts"
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

export class GithubClient extends Effect.Service<GithubClient>()("GithubClient", {
	effect: Effect.gen(function* () {
		const env = yield* Env
		const cache = yield* EtagCache
		const deps: Deps = { env, cache }
		const repo = env.GITHUB_REPO

		return {
			searchUserPrs: (since: string) => {
				const q = encodeURIComponent(
					`repo:${repo} author:${env.GITHUB_USER} is:pr updated:>=${since}`,
				)
				return getJson(
					deps,
					SearchIssuesResult,
					`/search/issues?q=${q}&per_page=100&advanced_search=true`,
				)
			},

			searchUserPrNumbers: (since: string) => {
				const q = encodeURIComponent(
					`repo:${repo} author:${env.GITHUB_USER} is:pr updated:>=${since}`,
				)
				return getJson(
					deps,
					SearchIssuesResult,
					`/search/issues?q=${q}&per_page=100&advanced_search=true`,
				).pipe(Effect.map((r) => r.items.map((i) => i.number)))
			},

			getPr: (number: number) => getJson(deps, Pr, `/repos/${repo}/pulls/${number}`),

			listReviews: (number: number) =>
				getJson(deps, Reviews, `/repos/${repo}/pulls/${number}/reviews?per_page=100`),

			listCheckRuns: (sha: string) =>
				getJson(deps, CheckRunsResponse, `/repos/${repo}/commits/${sha}/check-runs?per_page=100`),

			listTags: (prefix: string) =>
				getJson(deps, MatchingRefs, `/repos/${repo}/git/matching-refs/tags/${prefix}`),

			listBranchCommits: (branch: string, perPage = 500) => {
				const pages = Math.min(5, Math.ceil(perPage / 100))
				return Effect.forEach(
					Array.from({ length: pages }, (_, i) => i + 1),
					(page) =>
						getJson(
							deps,
							CommitShas,
							`/repos/${repo}/commits?sha=${branch}&per_page=100&page=${page}`,
						),
					{ concurrency: 2 },
				).pipe(Effect.map((chunks) => chunks.flat().map((c) => c.sha)))
			},
		}
	}),
}) {}
