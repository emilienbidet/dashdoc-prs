import { Data, Duration, Effect, Schedule, Schema } from "effect"
import { Env } from "../env.ts"
import { CheckRunsResponse } from "../schemas/CheckRun.ts"
import { CommitShas } from "../schemas/Commit.ts"
import { Pr, SearchIssuesResult } from "../schemas/Pr.ts"
import { Reviews } from "../schemas/Review.ts"
import { MatchingRefs } from "../schemas/Tag.ts"

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

const getJson = <A, I>(env: typeof Env.Service, schema: Schema.Schema<A, I>, path: string) =>
	Effect.tryPromise({
		try: () =>
			fetch(`${API}${path}`, {
				headers: {
					Authorization: `Bearer ${env.GITHUB_TOKEN}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					"User-Agent": "dashdoc-prs-kanban",
				},
			}),
		catch: (cause) => new GithubError({ path, cause }),
	}).pipe(
		Effect.flatMap((res) =>
			res.ok
				? Effect.tryPromise({
						try: () => res.json(),
						catch: (cause) => new GithubError({ path, status: res.status, cause }),
					})
				: Effect.fail(new GithubError({ path, status: res.status })),
		),
		Effect.flatMap((json) =>
			Schema.decodeUnknown(schema)(json, { errors: "first" }).pipe(
				Effect.mapError((cause) => new GithubError({ path, cause })),
			),
		),
		Effect.retry(retryable),
		Effect.timeout(Duration.seconds(15)),
		Effect.mapError((e) => (e instanceof GithubError ? e : new GithubError({ path, cause: e }))),
	)

export class GithubClient extends Effect.Service<GithubClient>()("GithubClient", {
	effect: Effect.gen(function* () {
		const env = yield* Env
		const repo = env.GITHUB_REPO

		return {
			searchUserPrs: (since: string) => {
				const q = encodeURIComponent(
					`repo:${repo} author:${env.GITHUB_USER} is:pr updated:>=${since}`,
				)
				return getJson(
					env,
					SearchIssuesResult,
					`/search/issues?q=${q}&per_page=100&advanced_search=true`,
				)
			},

			searchUserPrNumbers: (since: string) => {
				const q = encodeURIComponent(
					`repo:${repo} author:${env.GITHUB_USER} is:pr updated:>=${since}`,
				)
				return getJson(
					env,
					SearchIssuesResult,
					`/search/issues?q=${q}&per_page=100&advanced_search=true`,
				).pipe(Effect.map((r) => r.items.map((i) => i.number)))
			},

			getPr: (number: number) => getJson(env, Pr, `/repos/${repo}/pulls/${number}`),

			listReviews: (number: number) =>
				getJson(env, Reviews, `/repos/${repo}/pulls/${number}/reviews?per_page=100`),

			listCheckRuns: (sha: string) =>
				getJson(env, CheckRunsResponse, `/repos/${repo}/commits/${sha}/check-runs?per_page=100`),

			listTags: (prefix: string) =>
				getJson(env, MatchingRefs, `/repos/${repo}/git/matching-refs/tags/${prefix}`),

			listBranchCommits: (branch: string, perPage = 500) => {
				const pages = Math.min(5, Math.ceil(perPage / 100))
				return Effect.forEach(
					Array.from({ length: pages }, (_, i) => i + 1),
					(page) =>
						getJson(
							env,
							CommitShas,
							`/repos/${repo}/commits?sha=${branch}&per_page=100&page=${page}`,
						),
					{ concurrency: 2 },
				).pipe(Effect.map((chunks) => chunks.flat().map((c) => c.sha)))
			},
		}
	}),
}) {}
