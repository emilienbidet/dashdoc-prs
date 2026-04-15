// Cookie-based auth: one password, HMAC-signed cookie with 30-day expiry.
// Rotating AUTH_PASSWORD invalidates every outstanding cookie automatically,
// because the HMAC key changes with it.

export const COOKIE_NAME = "dashdoc_prs_auth"
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

const encoder = new TextEncoder()

const toHex = (buf: ArrayBuffer): string =>
	Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")

const timingSafeEqual = (a: string, b: string): boolean => {
	if (a.length !== b.length) return false
	let diff = 0
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
	return diff === 0
}

const importKey = (password: string): Promise<CryptoKey> =>
	crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)

const hmacHex = async (password: string, data: string): Promise<string> => {
	const key = await importKey(password)
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
	return toHex(sig)
}

export const signCookie = async (password: string): Promise<string> => {
	const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS
	const payload = String(exp)
	const mac = await hmacHex(password, payload)
	return `${payload}.${mac}`
}

export const verifyCookie = async (value: string, password: string): Promise<boolean> => {
	const idx = value.indexOf(".")
	if (idx < 0) return false
	const payload = value.slice(0, idx)
	const mac = value.slice(idx + 1)
	const exp = Number(payload)
	if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false
	const expected = await hmacHex(password, payload)
	return timingSafeEqual(mac, expected)
}

export const readCookie = (cookieHeader: string | null, name: string): string | null => {
	if (!cookieHeader) return null
	for (const part of cookieHeader.split(/;\s*/)) {
		const eq = part.indexOf("=")
		if (eq < 0) continue
		if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1))
	}
	return null
}

export const buildSetCookie = (value: string, maxAgeSeconds: number): string =>
	[
		`${COOKIE_NAME}=${encodeURIComponent(value)}`,
		"Path=/",
		"HttpOnly",
		"Secure",
		"SameSite=Lax",
		`Max-Age=${maxAgeSeconds}`,
	].join("; ")

export const buildClearCookie = (): string =>
	`${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

export const isAuthenticated = async (
	request: Request,
	password: string,
): Promise<boolean> => {
	const cookie = readCookie(request.headers.get("cookie"), COOKIE_NAME)
	if (!cookie) return false
	return verifyCookie(cookie, password)
}
