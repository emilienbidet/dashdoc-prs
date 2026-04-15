export const twoWeeksAgoISO = (now: number = Date.now()): string =>
	new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()

export const twoWeeksAgoDate = (now: number = Date.now()): string =>
	twoWeeksAgoISO(now).slice(0, 10)

export const shortSha = (sha: string): string => sha.slice(0, 7)

export const formatRelative = (iso: string, now: number = Date.now()): string => {
	const diffSec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
	if (diffSec < 45) return "just now"
	const diffMin = Math.round(diffSec / 60)
	if (diffMin < 60) return `${diffMin}m ago`
	const diffHr = Math.round(diffMin / 60)
	if (diffHr < 48) return `${diffHr}h ago`
	const diffDay = Math.round(diffHr / 24)
	return `${diffDay}d ago`
}
