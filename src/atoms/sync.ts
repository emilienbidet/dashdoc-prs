import { Data, Effect } from "effect"
import { runtime } from "./runtime.ts"

export class SyncKickError extends Data.TaggedError("SyncKickError")<{
	readonly status?: number
	readonly cause?: unknown
}> {}

// Fire-and-forget POST to /api/sync. The server awaits the full sync,
// so the Worker runtime keeps it alive; the client doesn't care when it
// finishes — the poll loop will pick up the fresh rows.
export const kickSyncAtom = runtime.fn(() =>
	Effect.tryPromise({
		try: () =>
			fetch("/api/sync", { method: "POST" }).then((res) => {
				if (!res.ok) throw new SyncKickError({ status: res.status })
			}),
		catch: (cause) =>
			cause instanceof SyncKickError ? cause : new SyncKickError({ cause }),
	}),
)
