import { Data, Effect, Option } from "effect"
import { Env } from "../env.ts"
import type { BoardData, BoardRow, ColumnKey } from "../schemas/BoardRow.ts"

export class D1Error extends Data.TaggedError("D1Error")<{
	readonly op: string
	readonly cause: unknown
}> {}

const tryD1 = <A>(op: string, fn: () => Promise<A>) =>
	Effect.tryPromise({ try: fn, catch: (cause) => new D1Error({ op, cause }) })

type Row = {
	number: number
	title: string
	url: string
	author: string
	state: string
	merged: number
	merge_sha: string | null
	head_sha: string
	created_at: string
	updated_at: string
	merged_at: string | null
	review_state: string
	ci_state: string
	column_key: string
}

const toBoardRow = (r: Row): BoardRow => ({
	number: r.number,
	title: r.title,
	url: r.url,
	author: r.author,
	state: r.state as BoardRow["state"],
	merged: r.merged === 1,
	merge_sha: r.merge_sha,
	head_sha: r.head_sha,
	created_at: r.created_at,
	updated_at: r.updated_at,
	merged_at: r.merged_at,
	review_state: r.review_state as BoardRow["review_state"],
	ci_state: r.ci_state as BoardRow["ci_state"],
	column_key: r.column_key as ColumnKey,
})

export class D1Store extends Effect.Service<D1Store>()("D1Store", {
	effect: Effect.gen(function* () {
		const env = yield* Env
		const db = env.DB

		const upsertStmt = db.prepare(
			`INSERT INTO prs (number,title,url,author,state,merged,merge_sha,head_sha,
				created_at,updated_at,merged_at,review_state,ci_state,column_key,raw_json)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
			 ON CONFLICT(number) DO UPDATE SET
				title=excluded.title, url=excluded.url, author=excluded.author,
				state=excluded.state, merged=excluded.merged, merge_sha=excluded.merge_sha,
				head_sha=excluded.head_sha, created_at=excluded.created_at,
				updated_at=excluded.updated_at, merged_at=excluded.merged_at,
				review_state=excluded.review_state, ci_state=excluded.ci_state,
				column_key=excluded.column_key, raw_json=excluded.raw_json`,
		)

		return {
			upsertPrs: (rows: ReadonlyArray<BoardRow & { raw_json: string }>) =>
				tryD1("upsertPrs", () =>
					db.batch(
						rows.map((r) =>
							upsertStmt.bind(
								r.number,
								r.title,
								r.url,
								r.author,
								r.state,
								r.merged ? 1 : 0,
								r.merge_sha,
								r.head_sha,
								r.created_at,
								r.updated_at,
								r.merged_at,
								r.review_state,
								r.ci_state,
								r.column_key,
								r.raw_json,
							),
						),
					),
				),

			listPrs: tryD1("listPrs", async () => {
				const res = await db
					.prepare(
						`SELECT number,title,url,author,state,merged,merge_sha,head_sha,
							created_at,updated_at,merged_at,review_state,ci_state,column_key
						 FROM prs ORDER BY column_key, updated_at DESC`,
					)
					.all<Row>()
				const buckets: Record<ColumnKey, BoardRow[]> = {
					dev: [],
					merged: [],
					staging: [],
					production: [],
				}
				for (const r of res.results) {
					const row = toBoardRow(r)
					buckets[row.column_key].push(row)
				}
				return buckets satisfies BoardData
			}),

			pruneBeyondWindow: (cutoffISO: string) =>
				tryD1("pruneBeyondWindow", () =>
					db
						.prepare(
							`DELETE FROM prs
							 WHERE updated_at < ?
							   AND column_key IN ('merged','production')`,
						)
						.bind(cutoffISO)
						.run(),
				),

			getMeta: (key: string) =>
				tryD1("getMeta", () =>
					db
						.prepare(`SELECT value FROM sync_meta WHERE key = ?`)
						.bind(key)
						.first<{ value: string }>(),
				).pipe(Effect.map((r) => (r ? Option.some(r.value) : Option.none()))),

			putMeta: (key: string, value: string) =>
				tryD1("putMeta", () =>
					db
						.prepare(
							`INSERT INTO sync_meta (key,value) VALUES (?,?)
							 ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
						)
						.bind(key, value)
						.run(),
				),
		}
	}),
}) {}
