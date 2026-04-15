import { createFileRoute } from "@tanstack/react-router"
import { KanbanBoard } from "#/components/kanban/KanbanBoard.tsx"

export const Route = createFileRoute("/board")({
	component: BoardPage,
	ssr: false,
})

function BoardPage() {
	return (
		<main className="mx-auto max-w-[1600px] px-4 py-4">
			<header className="mb-4 flex items-baseline justify-between">
				<h1 className="text-lg font-semibold tracking-tight">dashdoc PRs</h1>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					emilienbidet · last 14 days · refresh 5 s
				</p>
			</header>
			<KanbanBoard />
		</main>
	)
}
