import { readFileSync } from "node:fs"

try {
	const raw = readFileSync(".dev.vars", "utf8")
	for (const line of raw.split("\n")) {
		const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i)
		if (!m) continue
		const value = m[2].replace(/^["']|["']$/g, "")
		if (process.env[m[1]] === undefined) process.env[m[1]] = value
	}
} catch {
	// .dev.vars not present — tests that need secrets will be skipped.
}
