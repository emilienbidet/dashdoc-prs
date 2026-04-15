import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { sinceDate } from "../../lib/time.ts"
import { Env } from "../env.ts"
import { EtagCacheNoop } from "./EtagCache.ts"
import { GithubClient } from "./GithubClient.ts"
import { GithubGraphql } from "./GithubGraphql.ts"

const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPO ?? "dashdoc/dashdoc"
const user = process.env.GITHUB_USER ?? "emilienbidet"

const envLayer = Layer.succeed(Env, {
	DB: null as unknown as D1Database,
	GITHUB_TOKEN: token ?? "",
	GITHUB_REPO: repo,
	GITHUB_USER: user,
})

const restLayer = GithubClient.Default.pipe(
	Layer.provide(EtagCacheNoop),
	Layer.provide(envLayer),
)

const gqlLayer = GithubGraphql.Default.pipe(
	Layer.provide(EtagCacheNoop),
	Layer.provide(envLayer),
)

describe.skipIf(!token)("GithubClient (live)", () => {
	it.effect(
		"listTags('dashdoc-') returns non-empty ref list",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const refs = yield* gh.listTags("dashdoc-")
				expect(refs.length).toBeGreaterThan(0)
				return refs
			}).pipe(Effect.provide(restLayer)),
		{ timeout: 20_000 },
	)

	it.effect(
		"listBranchCommits('gitbook', 200) returns ≥200 SHAs",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const shas = yield* gh.listBranchCommits("gitbook", 200)
				expect(shas.length).toBeGreaterThanOrEqual(200)
				return shas
			}).pipe(Effect.provide(restLayer)),
		{ timeout: 20_000 },
	)

	it.effect(
		"isAncestorOfGitbook returns true for gitbook tip",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const shas = yield* gh.listBranchCommits("gitbook", 100)
				const result = yield* gh.isAncestorOfGitbook(shas[0])
				expect(result).toBe(true)
				return result
			}).pipe(Effect.provide(restLayer)),
		{ timeout: 20_000 },
	)
})

describe.skipIf(!token)("GithubGraphql (live)", () => {
	it.effect(
		"board query returns PRs with reviews + rollup",
		() =>
			Effect.gen(function* () {
				const gql = yield* GithubGraphql
				const nodes = yield* gql.board(sinceDate())
				expect(Array.isArray(nodes)).toBe(true)
				console.log(`[gql] ${nodes.length} PRs in the last 7d for ${user}`)
				if (nodes.length > 0) {
					const sample = nodes[0]
					expect(typeof sample.number).toBe("number")
					expect(typeof sample.title).toBe("string")
					expect(["OPEN", "CLOSED", "MERGED"]).toContain(sample.state)
					console.log(
						`[gql] sample #${sample.number} rollup=${sample.commits.nodes[0]?.commit.statusCheckRollup?.state ?? "null"} reviews=${sample.latestReviews?.nodes.length ?? 0}`,
					)
				}
				return nodes
			}).pipe(Effect.provide(gqlLayer)),
		{ timeout: 20_000 },
	)
})

describe.skipIf(token)("GithubClient (skipped — no GITHUB_TOKEN)", () => {
	it("reminder: add GITHUB_TOKEN to .dev.vars to run live tests", () => {
		expect(true).toBe(true)
	})
})
