import type { BoardRow } from "#/server/schemas/BoardRow.ts"
import { CiBadge } from "./CiBadge.tsx"
import { RelativeTime } from "./RelativeTime.tsx"
import { ReviewBadge } from "./ReviewBadge.tsx"

export function PrCard({ row }: { row: BoardRow }) {
	return (
		<a
			href={row.url}
			target="_blank"
			rel="noreferrer"
			className="group block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
		>
			<div className="flex items-start justify-between gap-2">
				<h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white">
					{row.title}
				</h3>
				<span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
					#{row.number}
				</span>
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-1.5">
				<ReviewBadge state={row.review_state} />
				<CiBadge state={row.ci_state} />
				<RelativeTime
					iso={row.updated_at}
					className="ml-auto text-[11px] text-slate-400 dark:text-slate-500"
				/>
			</div>
		</a>
	)
}
