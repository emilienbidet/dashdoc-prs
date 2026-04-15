import { Data, Effect, Schedule, Schema, Stream } from "effect"
import { BoardData } from "#/server/schemas/BoardRow.ts"
import { runtime } from "./runtime.ts"

export class BoardFetchError extends Data.TaggedError("BoardFetchError")<{
	readonly cause: unknown
}> {}

const fetchBoard = Effect.tryPromise({
	try: async () => {
		const res = await fetch("/api/prs")
		if (res.status === 401) {
			// Cookie missing / expired — bounce to the login page and never
			// resolve so the atom stays in its last state until we navigate.
			if (typeof window !== "undefined") window.location.href = "/login"
			return await new Promise<never>(() => {})
		}
		return await res.json()
	},
	catch: (cause) => new BoardFetchError({ cause }),
}).pipe(
	Effect.flatMap((json) =>
		Schema.decodeUnknown(BoardData)(json).pipe(
			Effect.mapError((cause) => new BoardFetchError({ cause })),
		),
	),
)

// Fire once immediately, then every 5 seconds.
const pollStream = Stream.concat(
	Stream.make(undefined),
	Stream.fromSchedule(Schedule.spaced("5 seconds")),
).pipe(Stream.mapEffect(() => fetchBoard))

export const boardAtom = runtime.atom(pollStream, {
	initialValue: { dev: [], merged: [], staging: [], production: [] } as BoardData,
})
