import { Schema } from "effect"

export const ReviewState = Schema.Literal(
	"APPROVED",
	"CHANGES_REQUESTED",
	"COMMENTED",
	"DISMISSED",
	"PENDING",
)
export type ReviewState = typeof ReviewState.Type

export const Review = Schema.Struct({
	user: Schema.NullOr(Schema.Struct({ login: Schema.String })),
	state: ReviewState,
	submitted_at: Schema.NullOr(Schema.String),
})
export type Review = typeof Review.Type

export const Reviews = Schema.Array(Review)
export type Reviews = typeof Reviews.Type
