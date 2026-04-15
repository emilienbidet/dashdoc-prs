import { Atom } from "@effect-atom/atom-react"
import { Layer } from "effect"

// No client-side services yet — the board talks to the server via /api/*.
// Kept as a seam so we can add layers (e.g. logging, a browser-side cache)
// without touching atom call sites.
export const runtime = Atom.runtime(Layer.empty)
