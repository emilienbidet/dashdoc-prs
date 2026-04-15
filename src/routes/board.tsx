import { createFileRoute } from "@tanstack/react-router"
import { KanbanBoard } from "#/components/kanban/KanbanBoard.tsx"
import { LiveRefreshIndicator } from "#/components/kanban/LiveRefreshIndicator.tsx"

export const Route = createFileRoute("/board")({
	component: BoardPage,
	ssr: false,
})

function BoardPage() {
	return (
		<main
			className="mx-auto flex h-dvh max-w-[1600px] flex-col px-4 py-4"
			aria-label="dashdoc PRs"
		>
			<header className="mb-4 flex shrink-0 items-baseline justify-between gap-4">
				<h1 className="text-lg font-semibold tracking-tight">dashdoc PRs</h1>
				<div className="flex items-center gap-4">
					<span className="text-xs text-slate-500 dark:text-slate-400">
						emilienbidet · last 7 days
					</span>
					<LiveRefreshIndicator />
				</div>
			</header>
			<div className="min-h-0 flex-1">
				<KanbanBoard />
			</div>
		</main>
	)
}
