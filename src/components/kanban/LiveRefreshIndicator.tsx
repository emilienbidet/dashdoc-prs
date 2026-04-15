import { Result, useAtomValue } from "@effect-atom/atom-react"
import { useEffect, useState } from "react"
import { boardAtom } from "#/atoms/prs.ts"

const format = (sinceMs: number): string => {
	if (sinceMs < 1500) return "updated just now"
	if (sinceMs < 60_000) return `updated ${Math.round(sinceMs / 1000)}s ago`
	return `updated ${Math.round(sinceMs / 60_000)}m ago`
}

export function LiveRefreshIndicator() {
	const result = useAtomValue(boardAtom)
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 1000)
		return () => window.clearInterval(id)
	}, [])

	const waiting = result.waiting
	const lastSuccessAt = Result.isSuccess(result)
		? result.timestamp
		: Result.isFailure(result) && result.previousSuccess._tag === "Some"
			? result.previousSuccess.value.timestamp
			: null

	const label = lastSuccessAt === null ? "loading…" : format(now - lastSuccessAt)

	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
			<span
				className={`inline-block h-1.5 w-1.5 rounded-full ${
					waiting
						? "animate-pulse bg-sky-500"
						: Result.isFailure(result)
							? "bg-rose-500"
							: "bg-emerald-500"
				}`}
			/>
			{waiting ? "refreshing…" : label}
		</span>
	)
}
