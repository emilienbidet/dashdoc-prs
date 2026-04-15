import { Schema } from "effect"

export const CommitSha = Schema.Struct({ sha: Schema.String })
export type CommitSha = typeof CommitSha.Type

export const CommitShas = Schema.Array(CommitSha)
export type CommitShas = typeof CommitShas.Type
