import { describe, expect, it } from "vitest"
import { formatRelative, shortSha, twoWeeksAgoDate, twoWeeksAgoISO } from "./time.ts"

describe("time", () => {
	it("twoWeeksAgoISO returns 14 days before now", () => {
		const now = new Date("2026-04-15T12:00:00Z").getTime()
		expect(twoWeeksAgoISO(now)).toBe("2026-04-01T12:00:00.000Z")
	})

	it("twoWeeksAgoDate returns YYYY-MM-DD form", () => {
		const now = new Date("2026-04-15T12:00:00Z").getTime()
		expect(twoWeeksAgoDate(now)).toBe("2026-04-01")
	})

	it("shortSha returns first 7 chars", () => {
		expect(shortSha("abcdef1234567890")).toBe("abcdef1")
	})

	it("formatRelative covers seconds/minutes/hours/days", () => {
		const now = new Date("2026-04-15T12:00:00Z").getTime()
		expect(formatRelative("2026-04-15T11:59:50Z", now)).toBe("just now")
		expect(formatRelative("2026-04-15T11:30:00Z", now)).toBe("30m ago")
		expect(formatRelative("2026-04-15T06:00:00Z", now)).toBe("6h ago")
		expect(formatRelative("2026-04-10T12:00:00Z", now)).toBe("5d ago")
	})
})
