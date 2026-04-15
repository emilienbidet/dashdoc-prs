import { describe, expect, it } from "vitest"
import type { Review } from "../server/schemas/Review.ts"
import { aggregateReviews } from "./reviewState.ts"

const r = (login: string, state: Review["state"], at: string | null): Review => ({
	user: { login },
	state,
	submitted_at: at,
})

describe("aggregateReviews", () => {
	it("returns pending for empty input", () => {
		expect(aggregateReviews([])).toBe("pending")
	})

	it("ignores reviews with null user", () => {
		expect(aggregateReviews([{ user: null, state: "APPROVED", submitted_at: "t" }])).toBe(
			"pending",
		)
	})

	it("returns approved when at least one latest review is APPROVED and none request changes", () => {
		expect(
			aggregateReviews([
				r("alice", "COMMENTED", "2026-04-10T00:00:00Z"),
				r("alice", "APPROVED", "2026-04-11T00:00:00Z"),
			]),
		).toBe("approved")
	})

	it("takes the latest review per reviewer", () => {
		expect(
			aggregateReviews([
				r("alice", "APPROVED", "2026-04-10T00:00:00Z"),
				r("alice", "CHANGES_REQUESTED", "2026-04-12T00:00:00Z"),
			]),
		).toBe("changes_requested")
	})

	it("CHANGES_REQUESTED from any latest-per-reviewer wins over APPROVED", () => {
		expect(
			aggregateReviews([
				r("alice", "APPROVED", "2026-04-11T00:00:00Z"),
				r("bob", "CHANGES_REQUESTED", "2026-04-12T00:00:00Z"),
			]),
		).toBe("changes_requested")
	})

	it("COMMENTED-only reviews are pending", () => {
		expect(aggregateReviews([r("alice", "COMMENTED", "2026-04-11T00:00:00Z")])).toBe("pending")
	})
})
