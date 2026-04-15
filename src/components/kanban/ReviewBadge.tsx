import type { ReviewBadge as ReviewBadgeState } from "#/server/schemas/BoardRow.ts"

const styles: Record<ReviewBadgeState, string> = {
	approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
	changes_requested: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
	pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

const labels: Record<ReviewBadgeState, string> = {
	approved: "approved",
	changes_requested: "changes",
	pending: "pending",
}

export function ReviewBadge({ state }: { state: ReviewBadgeState }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[state]}`}
			title={`review: ${labels[state]}`}
		>
			{labels[state]}
		</span>
	)
}
