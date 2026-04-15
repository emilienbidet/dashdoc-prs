import { describe, expect, it } from "vitest"
import { candidateStagingTagNames, toShort7Set } from "./PrSync.ts"

describe("candidateStagingTagNames", () => {
	it("keeps dashdoc-* tags whose target sha is not yet in gitbook", () => {
		const names = candidateStagingTagNames(
			[
				{ ref: "refs/tags/dashdoc-ac66b8d", object: { sha: "ac66b8d0000000" } },
				{ ref: "refs/tags/dashdoc-a307787-skip-observing", object: { sha: "a3077870000000" } },
			],
			new Set<string>(),
		)
		expect(names).toEqual(["dashdoc-ac66b8d", "dashdoc-a307787-skip-observing"])
	})

	it("drops tags already reachable from gitbook (i.e. deployed)", () => {
		const names = candidateStagingTagNames(
			[
				{ ref: "refs/tags/dashdoc-ac66b8d", object: { sha: "ac66b8d0000000" } },
				{ ref: "refs/tags/dashdoc-a307787", object: { sha: "a3077870000000" } },
			],
			new Set(["ac66b8d"]),
		)
		expect(names).toEqual(["dashdoc-a307787"])
	})

	it("ignores non-dashdoc refs", () => {
		const names = candidateStagingTagNames(
			[
				{ ref: "refs/tags/mobile-v3.54.0", object: { sha: "1111111aaaaaaa" } },
				{ ref: "refs/tags/assistant-loop-429c925", object: { sha: "2222222bbbbbbb" } },
			],
			new Set<string>(),
		)
		expect(names).toEqual([])
	})
})

describe("toShort7Set", () => {
	it("slices each SHA to 7 chars", () => {
		const set = toShort7Set(["ac66b8d8f10abcdef", "a307787bbbbbbbbbbbb"])
		expect(set.has("ac66b8d")).toBe(true)
		expect(set.has("a307787")).toBe(true)
	})
})
