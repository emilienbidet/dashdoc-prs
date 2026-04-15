import type { BoardReview } from "../server/graphql/BoardQuery.ts"
import type { ReviewBadge } from "../server/schemas/BoardRow.ts"

// GraphQL's `latestReviews` already returns the latest review per reviewer,
// but the review state vocabulary is wider than our badges. Reduce to one
// of approved / changes_requested / pending.
//
// CHANGES_REQUESTED wins over APPROVED so a red flag is always visible
// even if another reviewer has already approved.
export const aggregateReviews = (reviews: ReadonlyArray<BoardReview>): ReviewBadge => {
	let approved = false
	for (const r of reviews) {
		if (!r.author) continue
		if (r.state === "CHANGES_REQUESTED") return "changes_requested"
		if (r.state === "APPROVED") approved = true
	}
	return approved ? "approved" : "pending"
}
