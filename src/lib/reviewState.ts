import type { Review } from "../server/schemas/Review.ts"
import type { ReviewBadge } from "../server/schemas/BoardRow.ts"

export const aggregateReviews = (reviews: ReadonlyArray<Review>): ReviewBadge => {
	const latest = new Map<string, Review>()
	for (const r of reviews) {
		if (!r.user) continue
		const cur = latest.get(r.user.login)
		if (!cur) {
			latest.set(r.user.login, r)
			continue
		}
		const curAt = cur.submitted_at ?? ""
		const rAt = r.submitted_at ?? ""
		if (rAt >= curAt) latest.set(r.user.login, r)
	}
	let approved = false
	for (const r of latest.values()) {
		if (r.state === "CHANGES_REQUESTED") return "changes_requested"
		if (r.state === "APPROVED") approved = true
	}
	return approved ? "approved" : "pending"
}
