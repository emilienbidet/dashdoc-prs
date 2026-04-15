import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { Option } from "effect"
import { useEffect } from "react"
import { boardAtom } from "#/atoms/prs.ts"
import { kickSyncAtom } from "#/atoms/sync.ts"
import type { BoardData, ColumnKey } from "#/server/schemas/BoardRow.ts"
import { KanbanColumn } from "./KanbanColumn.tsx"

const COLUMNS: ReadonlyArray<ColumnKey> = ["dev", "merged", "staging", "production"]

export function KanbanBoard() {
	const result = useAtomValue(boardAtom)
	const kick = useAtomSet(kickSyncAtom)

	useEffect(() => {
		kick()
		const onVis = () => {
			if (document.visibilityState === "visible") kick()
		}
		document.addEventListener("visibilitychange", onVis)
		return () => document.removeEventListener("visibilitychange", onVis)
	}, [kick])

	return Result.match(result, {
		onInitial: () => <BoardSkeleton />,
		onFailure: (f) =>
			// Transient fetch/decode blip: keep last-good data on screen and a
			// small stale indicator. Only go to the error panel if we never
			// had a successful load.
			Option.match(f.previousSuccess, {
				onNone: () => <BoardError message={String(f.cause)} />,
				onSome: (s) => <BoardGrid data={s.value} stale />,
			}),
		onSuccess: (s) => <BoardGrid data={s.value} />,
	})
}

function BoardGrid({ data, stale = false }: { data: BoardData; stale?: boolean }) {
	return (
		<div
			className={`grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 ${
				stale ? "opacity-80" : ""
			}`}
			aria-busy={stale || undefined}
		>
			{COLUMNS.map((key) => (
				<KanbanColumn key={key} columnKey={key} rows={data[key]} />
			))}
		</div>
	)
}

function BoardSkeleton() {
	return (
		<div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{COLUMNS.map((key) => (
				<div
					key={key}
					className="animate-pulse rounded-lg border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
				>
					<div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
					<div className="mt-3 space-y-2">
						<div className="h-16 rounded bg-slate-200/60 dark:bg-slate-800/60" />
						<div className="h-16 rounded bg-slate-200/60 dark:bg-slate-800/60" />
					</div>
				</div>
			))}
		</div>
	)
}

function BoardError({ message }: { message: string }) {
	return (
		<div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
			<p className="font-medium">Couldn't load the board</p>
			<p className="mt-1 font-mono text-xs opacity-80">{message}</p>
		</div>
	)
}
