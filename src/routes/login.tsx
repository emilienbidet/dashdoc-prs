import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/login")({
	component: LoginPage,
	ssr: false,
})

function LoginPage() {
	const router = useRouter()
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		setStatus("submitting")
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password }),
		})
		if (res.ok) {
			router.navigate({ to: "/board" })
			return
		}
		setStatus("error")
	}

	return (
		<main className="flex min-h-dvh items-center justify-center px-4">
			<form
				onSubmit={submit}
				className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
			>
				<h1 className="mb-1 text-lg font-semibold tracking-tight">dashdoc PRs</h1>
				<p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
					Enter the password to continue.
				</p>
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
						Password
					</span>
					<input
						type="password"
						autoFocus
						autoComplete="current-password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value)
							if (status === "error") setStatus("idle")
						}}
						className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
					/>
				</label>
				{status === "error" ? (
					<p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
						Wrong password.
					</p>
				) : null}
				<button
					type="submit"
					disabled={status === "submitting" || password.length === 0}
					className="mt-4 w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
				>
					{status === "submitting" ? "Signing in…" : "Sign in"}
				</button>
			</form>
		</main>
	)
}
