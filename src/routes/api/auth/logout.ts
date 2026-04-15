import { createFileRoute } from "@tanstack/react-router"
import { buildClearCookie } from "#/server/auth.ts"

export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			POST: async () =>
				new Response(null, {
					status: 204,
					headers: { "Set-Cookie": buildClearCookie() },
				}),
		},
	},
})
