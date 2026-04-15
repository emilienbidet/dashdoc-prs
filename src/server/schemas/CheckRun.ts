import { Schema } from "effect"

export const CheckStatus = Schema.Literal("queued", "in_progress", "completed")
export type CheckStatus = typeof CheckStatus.Type

export const CheckConclusion = Schema.Literal(
	"success",
	"failure",
	"neutral",
	"cancelled",
	"skipped",
	"timed_out",
	"action_required",
	"stale",
	"startup_failure",
)
export type CheckConclusion = typeof CheckConclusion.Type

export const CheckRun = Schema.Struct({
	status: CheckStatus,
	conclusion: Schema.NullOr(CheckConclusion),
})
export type CheckRun = typeof CheckRun.Type

export const CheckRunsResponse = Schema.Struct({
	check_runs: Schema.Array(CheckRun),
})
export type CheckRunsResponse = typeof CheckRunsResponse.Type
