import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { buildSetCookie, COOKIE_MAX_AGE_SECONDS, signCookie } from "#/server/auth.ts"
import type { AppBindings } from "#/server/env.ts"

export const Route = createFileRoute("/api/auth/login")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const e = env as AppBindings
				let password: string | null = null
				try {
					const body = (await request.json()) as { password?: string }
					password = typeof body.password === "string" ? body.password : null
				} catch {
					password = null
				}

				if (!password || password !== e.AUTH_PASSWORD) {
					// Constant-ish delay + vague error so we don't leak whether the
					// password field was missing vs wrong.
					await new Promise((r) => setTimeout(r, 400))
					return Response.json({ ok: false }, { status: 401 })
				}

				const token = await signCookie(e.AUTH_PASSWORD)
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Set-Cookie": buildSetCookie(token, COOKIE_MAX_AGE_SECONDS),
					},
				})
			},
		},
	},
})
