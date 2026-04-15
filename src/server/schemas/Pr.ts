import { Schema } from "effect"

export const PrState = Schema.Literal("open", "closed")
export type PrState = typeof PrState.Type

const User = Schema.Struct({ login: Schema.String })
const Head = Schema.Struct({ sha: Schema.String })

export const Pr = Schema.Struct({
	number: Schema.Number,
	title: Schema.String,
	html_url: Schema.String,
	state: PrState,
	merged: Schema.Boolean,
	merge_commit_sha: Schema.NullOr(Schema.String),
	head: Head,
	user: Schema.NullOr(User),
	created_at: Schema.String,
	updated_at: Schema.String,
	merged_at: Schema.NullOr(Schema.String),
})
export type Pr = typeof Pr.Type

export const SearchIssuesResult = Schema.Struct({
	total_count: Schema.Number,
	incomplete_results: Schema.optional(Schema.Boolean),
	items: Schema.Array(
		Schema.Struct({
			number: Schema.Number,
			updated_at: Schema.String,
		}),
	),
})
export type SearchIssuesResult = typeof SearchIssuesResult.Type
