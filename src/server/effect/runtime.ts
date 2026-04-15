import { Effect, Layer, ManagedRuntime } from "effect"
import { Env, fromBindings, type AppEnv } from "../env.ts"

export const appLayer = (env: AppEnv) => Layer.succeed(Env, env)

export const makeRuntime = (bindings: Cloudflare.Env & { GITHUB_TOKEN?: string }) =>
	ManagedRuntime.make(appLayer(fromBindings(bindings)))

export const runPromise = <A, E>(
	bindings: Cloudflare.Env & { GITHUB_TOKEN?: string },
	effect: Effect.Effect<A, E, Env>,
): Promise<A> => {
	const rt = makeRuntime(bindings)
	return rt.runPromise(effect).finally(() => rt.dispose())
}
