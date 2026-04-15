import { describe, expect, it } from "vitest"
import { parseStagingShorts, toShort7Set } from "./PrSync.ts"

describe("parseStagingShorts", () => {
	it("extracts short7 from plain dashdoc-<sha> refs", () => {
		const set = parseStagingShorts([
			{ ref: "refs/tags/dashdoc-ac66b8d", object: { sha: "x" } },
			{ ref: "refs/tags/dashdoc-a307787", object: { sha: "y" } },
		])
		expect(set.has("ac66b8d")).toBe(true)
		expect(set.has("a307787")).toBe(true)
		expect(set.size).toBe(2)
	})

	it("accepts suffixed variants like -skip-observing and -cancel-promotion", () => {
		const set = parseStagingShorts([
			{ ref: "refs/tags/dashdoc-e65ba4b-cancel-promotion", object: { sha: "x" } },
			{ ref: "refs/tags/dashdoc-f9e9143-skip-observing", object: { sha: "y" } },
		])
		expect(set.has("e65ba4b")).toBe(true)
		expect(set.has("f9e9143")).toBe(true)
	})

	it("ignores non-matching refs", () => {
		const set = parseStagingShorts([
			{ ref: "refs/tags/mobile-v3.54.0", object: { sha: "x" } },
			{ ref: "refs/tags/assistant-loop-429c925", object: { sha: "y" } },
		])
		expect(set.size).toBe(0)
	})
})

describe("toShort7Set", () => {
	it("slices each SHA to 7 chars", () => {
		const set = toShort7Set(["ac66b8d8f10abcdef", "a307787bbbbbbbbbbbb"])
		expect(set.has("ac66b8d")).toBe(true)
		expect(set.has("a307787")).toBe(true)
	})
})
