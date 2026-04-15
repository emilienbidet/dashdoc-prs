import { Context } from "effect"

export interface AppEnv {
	readonly DB: D1Database
	readonly GITHUB_TOKEN: string
	readonly GITHUB_REPO: string
	readonly GITHUB_USER: string
}

export class Env extends Context.Tag("AppEnv")<Env, AppEnv>() {}

// Secrets are not declared in wrangler.jsonc so wrangler types does not
// generate them. We layer GITHUB_TOKEN on top of the generated Cloudflare.Env.
export type AppBindings = Cloudflare.Env & { readonly GITHUB_TOKEN: string }

export const fromBindings = (bindings: AppBindings): AppEnv => {
	if (!bindings.GITHUB_TOKEN) {
		throw new Error("GITHUB_TOKEN secret is not set. Run: bunx wrangler secret put GITHUB_TOKEN")
	}
	return {
		DB: bindings.DB,
		GITHUB_TOKEN: bindings.GITHUB_TOKEN,
		GITHUB_REPO: bindings.GITHUB_REPO,
		GITHUB_USER: bindings.GITHUB_USER,
	}
}
