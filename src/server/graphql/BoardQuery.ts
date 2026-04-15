import { Schema } from "effect"

// The GraphQL document. `$q` is the search query string; `first` capped at
// 100 by GitHub. We don't paginate — if the user has >100 active PRs in
// the window, the oldest will fall off (that's already the plan's
// stated limit).
export const BOARD_QUERY = /* GraphQL */ `
query Board($q: String!) {
  search(type: ISSUE, query: $q, first: 100) {
    issueCount
    nodes {
      ... on PullRequest {
        number
        title
        url
        state
        merged
        isDraft
        createdAt
        updatedAt
        mergedAt
        author { login }
        mergeCommit { oid }
        headRefOid
        latestReviews(first: 20) {
          nodes {
            state
            submittedAt
            author { login }
          }
        }
        commits(last: 1) {
          nodes {
            commit {
              oid
              statusCheckRollup { state }
            }
          }
        }
      }
    }
  }
}
`

const Author = Schema.NullOr(Schema.Struct({ login: Schema.String }))

export const BoardReview = Schema.Struct({
	state: Schema.Literal(
		"PENDING",
		"COMMENTED",
		"APPROVED",
		"CHANGES_REQUESTED",
		"DISMISSED",
	),
	submittedAt: Schema.NullOr(Schema.String),
	author: Author,
})
export type BoardReview = typeof BoardReview.Type

export const RollupStateSchema = Schema.NullOr(
	Schema.Literal("EXPECTED", "ERROR", "FAILURE", "PENDING", "SUCCESS"),
)

export const BoardPr = Schema.Struct({
	number: Schema.Number,
	title: Schema.String,
	url: Schema.String,
	state: Schema.Literal("OPEN", "CLOSED", "MERGED"),
	merged: Schema.Boolean,
	isDraft: Schema.Boolean,
	createdAt: Schema.String,
	updatedAt: Schema.String,
	mergedAt: Schema.NullOr(Schema.String),
	author: Author,
	mergeCommit: Schema.NullOr(Schema.Struct({ oid: Schema.String })),
	headRefOid: Schema.NullOr(Schema.String),
	latestReviews: Schema.NullOr(Schema.Struct({ nodes: Schema.Array(BoardReview) })),
	commits: Schema.Struct({
		nodes: Schema.Array(
			Schema.Struct({
				commit: Schema.Struct({
					oid: Schema.String,
					statusCheckRollup: Schema.NullOr(Schema.Struct({ state: RollupStateSchema })),
				}),
			}),
		),
	}),
})
export type BoardPr = typeof BoardPr.Type

// The search query is constrained to `is:pr`, so every returned node
// is a PullRequest. That lets us decode directly with the PR shape.
export const BoardQueryResponse = Schema.Struct({
	data: Schema.Struct({
		search: Schema.Struct({
			issueCount: Schema.Number,
			nodes: Schema.Array(BoardPr),
		}),
	}),
})
export type BoardQueryResponse = typeof BoardQueryResponse.Type
