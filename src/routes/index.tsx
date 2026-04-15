import { createFileRoute, redirect } from "@tanstack/react-router"

// The root URL is the board itself.
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/board" })
	},
})
