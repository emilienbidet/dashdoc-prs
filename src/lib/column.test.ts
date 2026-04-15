import { describe, expect, it } from "vitest"
import { columnFor } from "./column.ts"

const tags = new Set(["aaa111", "bbb222"])
const prod = new Set(["aaa111"])

describe("columnFor", () => {
	it("returns dev when not merged", () => {
		expect(columnFor({ merged: false, merge_commit_sha: null }, tags, prod)).toBe("dev")
		expect(columnFor({ merged: false, merge_commit_sha: "aaa111" }, tags, prod)).toBe("dev")
	})

	it("returns merged when merged without a recognized sha", () => {
		expect(columnFor({ merged: true, merge_commit_sha: null }, tags, prod)).toBe("merged")
		expect(columnFor({ merged: true, merge_commit_sha: "zzz999" }, tags, prod)).toBe("merged")
	})

	it("returns staging when tag exists but not in production", () => {
		expect(columnFor({ merged: true, merge_commit_sha: "bbb222" }, tags, prod)).toBe("staging")
	})

	it("returns production when in gitbook ancestry (overrides staging)", () => {
		expect(columnFor({ merged: true, merge_commit_sha: "aaa111" }, tags, prod)).toBe("production")
	})
})
