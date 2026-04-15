import type { ColumnKey } from "../server/schemas/BoardRow.ts"

export const columnFor = (
	pr: { readonly merged: boolean; readonly merge_commit_sha: string | null },
	stagingShas: ReadonlySet<string>,
	productionShas: ReadonlySet<string>,
): ColumnKey => {
	if (!pr.merged) return "dev"
	const sha = pr.merge_commit_sha
	if (!sha) return "merged"
	if (productionShas.has(sha)) return "production"
	if (stagingShas.has(sha)) return "staging"
	return "merged"
}
