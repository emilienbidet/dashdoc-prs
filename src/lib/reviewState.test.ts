import { describe, expect, it } from "vitest"
import type { BoardReview } from "../server/graphql/BoardQuery.ts"
import { aggregateReviews } from "./reviewState.ts"

const r = (login: string, state: BoardReview["state"]): BoardReview => ({
	author: { login },
	state,
	submittedAt: null,
})

describe("aggregateReviews", () => {
	it("empty → pending", () => expect(aggregateReviews([])).toBe("pending"))

	it("ignores reviews with null author", () => {
		expect(aggregateReviews([{ author: null, state: "APPROVED", submittedAt: null }])).toBe(
			"pending",
		)
	})

	it("APPROVED-only → approved", () => {
		expect(aggregateReviews([r("alice", "APPROVED")])).toBe("approved")
	})

	it("CHANGES_REQUESTED wins over APPROVED", () => {
		expect(aggregateReviews([r("alice", "APPROVED"), r("bob", "CHANGES_REQUESTED")])).toBe(
			"changes_requested",
		)
	})

	it("COMMENTED only → pending", () => {
		expect(aggregateReviews([r("alice", "COMMENTED")])).toBe("pending")
	})
})
