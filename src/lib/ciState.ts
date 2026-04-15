import type { CheckRun } from "../server/schemas/CheckRun.ts"
import type { CiBadge } from "../server/schemas/BoardRow.ts"

const ERROR_CONCLUSIONS = new Set([
	"failure",
	"cancelled",
	"timed_out",
	"startup_failure",
	"action_required",
])

// Priority: error > running > success > none.
// A failed check outranks anything still running because the PR can't go
// green without attention, and red is the signal the user most needs to see.
export const aggregateChecks = (runs: ReadonlyArray<CheckRun>): CiBadge => {
	if (runs.length === 0) return "none"
	let hasRunning = false
	let hasError = false
	for (const c of runs) {
		if (c.status !== "completed") {
			hasRunning = true
			continue
		}
		if (c.conclusion && ERROR_CONCLUSIONS.has(c.conclusion)) hasError = true
	}
	if (hasError) return "error"
	if (hasRunning) return "running"
	return "success"
}
