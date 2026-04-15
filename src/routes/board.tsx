import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/board")({
	component: BoardPage,
})

function BoardPage() {
	return (
		<main className="mx-auto max-w-7xl px-4 py-8">
			<h1 className="text-2xl font-semibold tracking-tight">dashdoc PRs</h1>
			<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
				Board UI is coming next. Data is ready at{" "}
				<code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
					/api/prs
				</code>
				.
			</p>
		</main>
	)
}
