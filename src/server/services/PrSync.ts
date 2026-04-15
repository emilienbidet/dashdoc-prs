import { Effect } from "effect"
import { mapRollupState } from "../../lib/ciState.ts"
import { columnFor } from "../../lib/column.ts"
import { aggregateReviews } from "../../lib/reviewState.ts"
import { shortSha, sinceDate, sinceISO } from "../../lib/time.ts"
import type { BoardPr } from "../graphql/BoardQuery.ts"
import type { BoardRow } from "../schemas/BoardRow.ts"
import type { MatchingRef } from "../schemas/Tag.ts"
import { D1Store } from "./D1Store.ts"
import { GithubClient } from "./GithubClient.ts"
import { GithubGraphql } from "./GithubGraphql.ts"

const TAG_RE = /^refs\/tags\/dashdoc-([0-9a-f]{7,40})(?:$|-)/

export const parseStagingShorts = (refs: ReadonlyArray<MatchingRef>): Set<string> => {
	const out = new Set<string>()
	for (const r of refs) {
		const m = r.ref.match(TAG_RE)
		if (m) out.add(m[1].slice(0, 7))
	}
	return out
}

export const toShort7Set = (fullShas: ReadonlyArray<string>): Set<string> =>
	new Set(fullShas.map(shortSha))

const buildRow = (
	pr: BoardPr,
	stagingShorts: ReadonlySet<string>,
	productionShorts: ReadonlySet<string>,
	inProduction: boolean,
): BoardRow & { raw_json: string } => {
	const mergeSha = pr.mergeCommit?.oid ?? null
	const headSha = pr.commits.nodes[0]?.commit.oid ?? pr.headRefOid ?? ""
	const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null
	const review_state = aggregateReviews(pr.latestReviews?.nodes ?? [])
	const ci_state = mapRollupState(rollup)
	const mergeShort = mergeSha ? shortSha(mergeSha) : null

	// Column resolution: inProduction overrides the Set-based check so the
	// compare-API fallback can promote a PR from merged/staging to production.
	const stagingSet = inProduction ? new Set<string>() : stagingShorts
	const productionSet = inProduction && mergeShort ? new Set([mergeShort]) : productionShorts
	const column_key = columnFor(
		{ merged: pr.merged, merge_commit_sha: mergeShort },
		stagingSet,
		productionSet,
	)

	return {
		number: pr.number,
		title: pr.title,
		url: pr.url,
		author: pr.author?.login ?? "unknown",
		state: pr.state === "MERGED" ? "closed" : (pr.state.toLowerCase() as "open" | "closed"),
		merged: pr.merged,
		merge_sha: mergeSha,
		head_sha: headSha,
		created_at: pr.createdAt,
		updated_at: pr.updatedAt,
		merged_at: pr.mergedAt,
		review_state,
		ci_state,
		column_key,
		raw_json: JSON.stringify({
			reviews_count: pr.latestReviews?.nodes.length ?? 0,
			rollup,
		}),
	}
}

export const runSync = Effect.gen(function* () {
	const gh = yield* GithubClient
	const gql = yield* GithubGraphql
	const db = yield* D1Store

	const since = sinceDate()

	const [allPrs, tags, gitbookShas] = yield* Effect.all(
		[
			gql.board(since),
			gh.listTags("dashdoc-"),
			gh.listBranchCommits("gitbook", 2000),
		],
		{ concurrency: 3 },
	)

	// Drop closed-unmerged PRs — the user abandoned them, so they shouldn't
	// show up anywhere on the board.
	const prs = allPrs.filter((pr) => !(pr.state === "CLOSED" && !pr.merged))

	const stagingShorts = parseStagingShorts(tags)
	const productionShorts = toShort7Set(gitbookShas)

	// Phase 1: classify each PR using only the in-memory Set. Collect merged
	// PRs whose merge sha was NOT found so we can verify them via the
	// compare API (catches commits beyond the 2000-commit window).
	const provisional = prs.map((pr) => {
		const mergeShort = pr.mergeCommit?.oid ? shortSha(pr.mergeCommit.oid) : null
		const inSet = mergeShort !== null && productionShorts.has(mergeShort)
		const needsFallback =
			pr.merged && pr.mergeCommit !== null && !inSet
		return { pr, needsFallback }
	})

	// Phase 2: definitively check the fallbacks. Concurrency 4 keeps it fast
	// without hammering the API; most will return 304 under ETag caching.
	const fallbackResults = yield* Effect.forEach(
		provisional.filter((p) => p.needsFallback),
		(p) =>
			gh.isAncestorOfGitbook(p.pr.mergeCommit!.oid).pipe(
				Effect.map((inProd) => ({ number: p.pr.number, inProd })),
				Effect.catchAll(() => Effect.succeed({ number: p.pr.number, inProd: false })),
			),
		{ concurrency: 4 },
	)
	const fallbackMap = new Map(fallbackResults.map((r) => [r.number, r.inProd]))

	const rows = provisional.map(({ pr }) => {
		const inSet =
			pr.mergeCommit?.oid !== undefined &&
			productionShorts.has(shortSha(pr.mergeCommit.oid))
		const inProduction = inSet || fallbackMap.get(pr.number) === true
		return buildRow(pr, stagingShorts, productionShorts, inProduction)
	})

	if (rows.length > 0) yield* db.upsertPrs(rows)
	yield* db.pruneBeyondWindow(sinceISO())
	const keepNumbers = rows.map((r) => r.number)
	const pruned = yield* db.pruneNotIn(keepNumbers)
	yield* db.putMeta("last_sync_iso", new Date().toISOString())

	return {
		synced: rows.length,
		staging_tags: stagingShorts.size,
		prod_commits: productionShorts.size,
		fallback_promotions: fallbackResults.filter((r) => r.inProd).length,
		fallback_checks: fallbackResults.length,
		pruned,
	}
})
