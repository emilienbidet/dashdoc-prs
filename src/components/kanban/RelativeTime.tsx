import { useEffect, useState } from "react"
import { formatRelative } from "#/lib/time.ts"

export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
	const [label, setLabel] = useState(() => formatRelative(iso))

	useEffect(() => {
		const id = window.setInterval(() => setLabel(formatRelative(iso)), 30_000)
		return () => window.clearInterval(id)
	}, [iso])

	return (
		<time dateTime={iso} className={className} title={new Date(iso).toLocaleString()}>
			{label}
		</time>
	)
}
