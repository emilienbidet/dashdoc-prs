import { Effect } from "effect"
import { aggregateChecks } from "../../lib/ciState.ts"
import { columnFor } from "../../lib/column.ts"
import { aggregateReviews } from "../../lib/reviewState.ts"
import { shortSha, twoWeeksAgoDate, twoWeeksAgoISO } from "../../lib/time.ts"
import type { BoardRow } from "../schemas/BoardRow.ts"
import type { MatchingRef } from "../schemas/Tag.ts"
import { D1Store } from "./D1Store.ts"
import { GithubClient } from "./GithubClient.ts"

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

export const runSync = Effect.gen(function* () {
	const gh = yield* GithubClient
	const db = yield* D1Store

	const since = twoWeeksAgoDate()
	const search = yield* gh.searchUserPrs(since)
	const numbers = search.items.map((i) => i.number)
	if (search.total_count > search.items.length) {
		yield* Effect.logWarning(
			`PR search truncated: ${search.total_count} total, showing ${search.items.length} (add pagination if this grows).`,
		)
	}

	const [tags, gitbookShas] = yield* Effect.all(
		[gh.listTags("dashdoc-"), gh.listBranchCommits("gitbook", 500)],
		{ concurrency: 2 },
	)
	const stagingShorts = parseStagingShorts(tags)
	const productionShorts = toShort7Set(gitbookShas)

	const rows = yield* Effect.forEach(
		numbers,
		(n) =>
			Effect.gen(function* () {
				const pr = yield* gh.getPr(n)
				const [reviews, checks] = yield* Effect.all(
					[gh.listReviews(n), gh.listCheckRuns(pr.head.sha)],
					{ concurrency: 2 },
				)
				const review_state = aggregateReviews(reviews)
				const ci_state = aggregateChecks(checks.check_runs)
				const mergeShort = pr.merge_commit_sha ? shortSha(pr.merge_commit_sha) : null
				const column_key = columnFor(
					{ merged: pr.merged, merge_commit_sha: mergeShort },
					stagingShorts,
					productionShorts,
				)
				const row: BoardRow & { raw_json: string } = {
					number: pr.number,
					title: pr.title,
					url: pr.html_url,
					author: pr.user?.login ?? "unknown",
					state: pr.state,
					merged: pr.merged,
					merge_sha: pr.merge_commit_sha,
					head_sha: pr.head.sha,
					created_at: pr.created_at,
					updated_at: pr.updated_at,
					merged_at: pr.merged_at,
					review_state,
					ci_state,
					column_key,
					raw_json: JSON.stringify({
						reviews_count: reviews.length,
						checks_count: checks.check_runs.length,
					}),
				}
				return row
			}),
		{ concurrency: 5 },
	)

	if (rows.length > 0) yield* db.upsertPrs(rows)
	yield* db.pruneBeyondWindow(twoWeeksAgoISO())
	yield* db.putMeta("last_sync_iso", new Date().toISOString())

	return { synced: rows.length, staging_tags: stagingShorts.size, prod_commits: productionShorts.size }
})
