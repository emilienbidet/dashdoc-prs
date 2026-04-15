import { describe, expect, it } from "vitest"
import type { CheckRun } from "../server/schemas/CheckRun.ts"
import { aggregateChecks } from "./ciState.ts"

const run = (status: CheckRun["status"], conclusion: CheckRun["conclusion"] = null): CheckRun => ({
	status,
	conclusion,
})

describe("aggregateChecks", () => {
	it("returns none for empty", () => {
		expect(aggregateChecks([])).toBe("none")
	})

	it("returns success when all completed-success", () => {
		expect(aggregateChecks([run("completed", "success"), run("completed", "skipped")])).toBe(
			"success",
		)
	})

	it("returns running when any queued/in_progress and no failures", () => {
		expect(aggregateChecks([run("in_progress"), run("completed", "success")])).toBe("running")
		expect(aggregateChecks([run("queued"), run("completed", "success")])).toBe("running")
	})

	it("returns error when any completed-failure, even if others still running", () => {
		expect(aggregateChecks([run("in_progress"), run("completed", "failure")])).toBe("error")
		expect(aggregateChecks([run("completed", "cancelled")])).toBe("error")
		expect(aggregateChecks([run("completed", "timed_out")])).toBe("error")
	})

	it("neutral + skipped are not errors", () => {
		expect(aggregateChecks([run("completed", "neutral"), run("completed", "skipped")])).toBe(
			"success",
		)
	})
})
