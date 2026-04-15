import type { BoardRow, ColumnKey } from "#/server/schemas/BoardRow.ts"
import { PrCard } from "./PrCard.tsx"

const headerAccent: Record<ColumnKey, string> = {
	dev: "border-sky-400 text-sky-700 dark:text-sky-300",
	merged: "border-slate-400 text-slate-700 dark:text-slate-300",
	staging: "border-amber-400 text-amber-700 dark:text-amber-300",
	production: "border-emerald-400 text-emerald-700 dark:text-emerald-300",
}

const titles: Record<ColumnKey, string> = {
	dev: "Dev",
	merged: "Merged",
	staging: "Staging",
	production: "Production",
}

export function KanbanColumn({
	columnKey,
	rows,
}: {
	columnKey: ColumnKey
	rows: ReadonlyArray<BoardRow>
}) {
	return (
		<section className="flex h-full min-h-0 flex-col">
			<header
				className={`sticky top-0 z-10 mb-2 flex items-center justify-between border-b-2 bg-slate-50/90 px-1 py-2 backdrop-blur dark:bg-slate-950/90 ${headerAccent[columnKey]}`}
			>
				<h2 className="text-sm font-semibold tracking-tight">{titles[columnKey]}</h2>
				<span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
					{rows.length}
				</span>
			</header>

			<div className="flex flex-col gap-2 overflow-y-auto pr-0.5">
				{rows.length === 0 ? (
					<p className="px-1 text-xs text-slate-400 dark:text-slate-600">—</p>
				) : (
					rows.map((row) => <PrCard key={row.number} row={row} column={columnKey} />)
				)}
			</div>
		</section>
	)
}
