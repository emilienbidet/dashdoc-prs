import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { Env } from "../env.ts"
import { GithubClient } from "./GithubClient.ts"

const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPO ?? "dashdoc/dashdoc"
const user = process.env.GITHUB_USER ?? "emilienbidet"

const envLayer = Layer.succeed(Env, {
	DB: null as unknown as D1Database,
	GITHUB_TOKEN: token ?? "",
	GITHUB_REPO: repo,
	GITHUB_USER: user,
})

const clientLayer = GithubClient.Default.pipe(Layer.provide(envLayer))

const twoWeeksAgo = () => {
	const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
	return d.toISOString().slice(0, 10)
}

describe.skipIf(!token)("GithubClient (live)", () => {
	it.effect(
		"searchUserPrNumbers returns an array (possibly empty)",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const numbers = yield* gh.searchUserPrNumbers(twoWeeksAgo())
				expect(Array.isArray(numbers)).toBe(true)
				console.log(`[live] found ${numbers.length} PRs by ${user} in last 14d`)
				return numbers
			}).pipe(Effect.provide(clientLayer)),
		{ timeout: 20_000 },
	)

	it.effect(
		"listTags('dashdoc-') returns non-empty ref list",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const refs = yield* gh.listTags("dashdoc-")
				expect(refs.length).toBeGreaterThan(0)
				expect(refs[0].ref.startsWith("refs/tags/dashdoc-")).toBe(true)
				return refs
			}).pipe(Effect.provide(clientLayer)),
		{ timeout: 20_000 },
	)

	it.effect(
		"listBranchCommits('gitbook') returns a batch of SHAs",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const shas = yield* gh.listBranchCommits("gitbook", 100)
				expect(shas.length).toBeGreaterThan(0)
				expect(typeof shas[0]).toBe("string")
				return shas
			}).pipe(Effect.provide(clientLayer)),
		{ timeout: 20_000 },
	)

	it.effect(
		"getPr + listReviews + listCheckRuns round-trip on one recent PR",
		() =>
			Effect.gen(function* () {
				const gh = yield* GithubClient
				const numbers = yield* gh.searchUserPrNumbers(twoWeeksAgo())
				if (numbers.length === 0) {
					console.log("[live] no recent PRs — skipping detail round-trip")
					return
				}
				const pr = yield* gh.getPr(numbers[0])
				expect(pr.number).toBe(numbers[0])
				expect(typeof pr.title).toBe("string")
				expect(typeof pr.head.sha).toBe("string")

				const reviews = yield* gh.listReviews(pr.number)
				expect(Array.isArray(reviews)).toBe(true)

				const checks = yield* gh.listCheckRuns(pr.head.sha)
				expect(Array.isArray(checks.check_runs)).toBe(true)
				console.log(
					`[live] PR #${pr.number} "${pr.title}" — reviews:${reviews.length} checks:${checks.check_runs.length} merged:${pr.merged}`,
				)
			}).pipe(Effect.provide(clientLayer)),
		{ timeout: 30_000 },
	)
})

describe.skipIf(token)("GithubClient (skipped — no GITHUB_TOKEN)", () => {
	it("reminder: add GITHUB_TOKEN to .dev.vars to run live tests", () => {
		expect(true).toBe(true)
	})
})
