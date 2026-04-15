import { Schema } from "effect"

export const ColumnKey = Schema.Literal("dev", "merged", "staging", "production")
export type ColumnKey = typeof ColumnKey.Type

export const ReviewBadge = Schema.Literal("approved", "changes_requested", "pending")
export type ReviewBadge = typeof ReviewBadge.Type

export const CiBadge = Schema.Literal("success", "running", "error", "none")
export type CiBadge = typeof CiBadge.Type

export const BoardRow = Schema.Struct({
	number: Schema.Number,
	title: Schema.String,
	url: Schema.String,
	author: Schema.String,
	state: Schema.Literal("open", "closed"),
	merged: Schema.Boolean,
	is_draft: Schema.Boolean,
	merge_sha: Schema.NullOr(Schema.String),
	head_sha: Schema.String,
	created_at: Schema.String,
	updated_at: Schema.String,
	merged_at: Schema.NullOr(Schema.String),
	review_state: ReviewBadge,
	ci_state: CiBadge,
	column_key: ColumnKey,
})
export type BoardRow = typeof BoardRow.Type

export const BoardData = Schema.Struct({
	dev: Schema.Array(BoardRow),
	merged: Schema.Array(BoardRow),
	staging: Schema.Array(BoardRow),
	production: Schema.Array(BoardRow),
})
export type BoardData = typeof BoardData.Type
