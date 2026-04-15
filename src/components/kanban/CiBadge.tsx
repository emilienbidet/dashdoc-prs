import type { CiBadge as CiBadgeState } from "#/server/schemas/BoardRow.ts"

const styles: Record<CiBadgeState, string> = {
	success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
	running: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
	error: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
	none: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
}

const labels: Record<CiBadgeState, string> = {
	success: "ci ok",
	running: "ci…",
	error: "ci fail",
	none: "no ci",
}

export function CiBadge({ state }: { state: CiBadgeState }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[state]}`}
			title={`ci: ${labels[state]}`}
		>
			{state === "running" ? (
				<span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
			) : null}
			{labels[state]}
		</span>
	)
}
