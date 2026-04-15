import type { CiBadge } from "../server/schemas/BoardRow.ts"

// GraphQL statusCheckRollup.state values (full set: EXPECTED, ERROR, FAILURE,
// PENDING, SUCCESS). Null = no checks configured for the commit.
export type RollupState = "EXPECTED" | "ERROR" | "FAILURE" | "PENDING" | "SUCCESS" | null

export const mapRollupState = (state: RollupState): CiBadge => {
	switch (state) {
		case "SUCCESS":
			return "success"
		case "FAILURE":
		case "ERROR":
			return "error"
		case "PENDING":
		case "EXPECTED":
			return "running"
		default:
			return "none"
	}
}
