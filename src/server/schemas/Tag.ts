import { Schema } from "effect"

export const MatchingRef = Schema.Struct({
	ref: Schema.String,
	object: Schema.Struct({ sha: Schema.String }),
})
export type MatchingRef = typeof MatchingRef.Type

export const MatchingRefs = Schema.Array(MatchingRef)
export type MatchingRefs = typeof MatchingRefs.Type
