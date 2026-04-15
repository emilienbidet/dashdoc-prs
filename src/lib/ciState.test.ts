import { describe, expect, it } from "vitest"
import { mapRollupState } from "./ciState.ts"

describe("mapRollupState", () => {
	it("SUCCESS → success", () => expect(mapRollupState("SUCCESS")).toBe("success"))
	it("FAILURE / ERROR → error", () => {
		expect(mapRollupState("FAILURE")).toBe("error")
		expect(mapRollupState("ERROR")).toBe("error")
	})
	it("PENDING / EXPECTED → running", () => {
		expect(mapRollupState("PENDING")).toBe("running")
		expect(mapRollupState("EXPECTED")).toBe("running")
	})
	it("null → none", () => expect(mapRollupState(null)).toBe("none"))
})
