import { Watchable } from "@plexusjs/core"
import { Accessor, createSignal, createEffect, onCleanup, onMount } from "solid-js"

export type PlexusValue<T> = T extends Watchable<infer U> ? U : never
export type PlexusAccessor<T> = T extends Watchable<infer U> ? Accessor<U> : Accessor<never>
export type PlexusAccessorArray<T> = {
	[K in keyof T]: T[K] extends Watchable<infer U> ? Accessor<U> : Accessor<never>
}

export function useOnePlexus<V extends Watchable>(dep: V): Accessor<PlexusValue<V>> {
	const [v, setV] = createSignal<PlexusValue<V>>(dep.value)
	const unsub = dep.watch(setV)
	onCleanup(unsub)
	return v
}

// Singleton argument
export function usePlexus<V extends Watchable>(deps: V): Accessor<PlexusValue<V>>
// array argument
export function usePlexus<V extends Watchable[]>(deps: V | []): PlexusAccessorArray<V>

export function usePlexus<V extends Watchable[]>(deps: V | [] | Watchable): Accessor<PlexusValue<V>> | PlexusAccessorArray<V> {
	if (Array.isArray(deps)) return deps.map(useOnePlexus) as any
	return useOnePlexus(deps)
}
