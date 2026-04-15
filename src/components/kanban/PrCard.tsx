import type { BoardRow, ColumnKey } from "#/server/schemas/BoardRow.ts"
import { CiBadge } from "./CiBadge.tsx"
import { RelativeTime } from "./RelativeTime.tsx"
import { ReviewBadge } from "./ReviewBadge.tsx"

const relativeIsoFor = (row: BoardRow, column: ColumnKey): string => {
	if (column === "merged" && row.merged_at) return row.merged_at
	return row.updated_at
}

export function PrCard({ row, column }: { row: BoardRow; column: ColumnKey }) {
	const showBadges = column === "dev"
	return (
		<a
			href={row.url}
			target="_blank"
			rel="noreferrer"
			className={`group block rounded-lg border bg-white p-3 shadow-sm transition dark:bg-slate-900 ${
				row.is_draft && column === "dev"
					? "border-dashed border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/60"
					: "border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<h3
					className={`line-clamp-2 text-sm font-medium leading-snug ${
						row.is_draft && column === "dev"
							? "text-slate-500 dark:text-slate-400"
							: "text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white"
					}`}
				>
					{row.title}
				</h3>
				<span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
					#{row.number}
				</span>
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-1.5">
				{showBadges && row.is_draft ? (
					<span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
						draft
					</span>
				) : null}
				{showBadges && !row.is_draft ? (
					<>
						<ReviewBadge state={row.review_state} />
						<CiBadge state={row.ci_state} />
					</>
				) : null}
				<RelativeTime
					iso={relativeIsoFor(row, column)}
					className="ml-auto text-[11px] text-slate-400 dark:text-slate-500"
				/>
			</div>
		</a>
	)
}
