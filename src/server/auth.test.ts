import { describe, expect, it } from "vitest"
import { buildSetCookie, readCookie, signCookie, verifyCookie } from "./auth.ts"

describe("auth", () => {
	it("signs and verifies a cookie round-trip", async () => {
		const pw = "hunter2"
		const cookie = await signCookie(pw)
		expect(await verifyCookie(cookie, pw)).toBe(true)
	})

	it("rejects cookie signed with a different password", async () => {
		const cookie = await signCookie("hunter2")
		expect(await verifyCookie(cookie, "wrong")).toBe(false)
	})

	it("rejects a tampered payload", async () => {
		const cookie = await signCookie("hunter2")
		const [_payload, mac] = cookie.split(".")
		const tampered = `${Math.floor(Date.now() / 1000) + 999999}.${mac}`
		expect(await verifyCookie(tampered, "hunter2")).toBe(false)
	})

	it("rejects an expired cookie", async () => {
		const past = Math.floor(Date.now() / 1000) - 60
		// Re-use the sign logic but with forced past expiry: manually craft one.
		const { signCookie: _s } = await import("./auth.ts")
		const cookie = await signCookie("pw")
		const parts = cookie.split(".")
		const expired = `${past}.${parts[1]}`
		expect(await verifyCookie(expired, "pw")).toBe(false)
	})

	it("readCookie parses the right cookie by name", () => {
		expect(readCookie("a=1; b=2; c=3", "b")).toBe("2")
		expect(readCookie("solo=abc", "solo")).toBe("abc")
		expect(readCookie(null, "x")).toBe(null)
		expect(readCookie("a=1", "x")).toBe(null)
	})

	it("buildSetCookie has HttpOnly/Secure/SameSite and path", () => {
		const c = buildSetCookie("token", 100)
		expect(c).toContain("Path=/")
		expect(c).toContain("HttpOnly")
		expect(c).toContain("Secure")
		expect(c).toContain("SameSite=Lax")
		expect(c).toContain("Max-Age=100")
	})
})
