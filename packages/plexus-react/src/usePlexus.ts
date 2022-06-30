import { PlexusCollectionGroup, WatchableValue, Watchable } from "@plexusjs/core"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSyncExternalStore } from "use-sync-external-store/shim"

const normalizeDeps = (deps: Watchable | Watchable[]) => (Array.isArray(deps) ? (deps as Watchable[]) : [deps as Watchable])

export type PlexusValue<T> = T extends Watchable<infer U> ? U : never
export type PlexusValueArray<T> = {
	[K in keyof T]: T[K] extends Watchable<infer U> ? U : never
}

// Singleton argument
export function usePlexus<V extends Watchable>(deps: V): PlexusValue<V>
// array argument
export function usePlexus<V extends Watchable[]>(deps: V | []): PlexusValueArray<V>
/**
 * A react hook to extract the values from plexus objects and reactively update the component and value when the values change
 * @param deps A list of plexus watchable objects (ex. State, Group, Selector, Computed)
 * @returns The reactive values of the plexus objects
 */
export function usePlexus<V extends Watchable[]>(deps: V | [] | Watchable): PlexusValue<V> | PlexusValueArray<V> {
	const [_, set] = useState({})

	return useSyncExternalStore(
		// Subscription callback
		useCallback(() => {
			const depsArray = [...normalizeDeps(deps)]
			const depUnsubs: Array<() => void> = []
			if (Array.isArray(depsArray)) {
				let index = -1
				for (let dep of depsArray) {
					++index
					// if not a watchable, then we can't watch it, skip to next iteration
					if (!(dep instanceof Watchable)) continue
					const unsubscribe = dep.watch(function (v) {
						// setChangedIndex(index)
						set({})
					})
					depUnsubs.push(unsubscribe)
				}
				// unsubscribe on component destroy
			}
			return () => {
				for (let unsub of depUnsubs) {
					unsub()
				}
				depUnsubs.length = 0
			}
		}, [deps]),

		// GetValue callback
		useCallback(() => {
			const depsArray = [...normalizeDeps(deps)]
			// The "!" at the end of the values here tell the tsc that these values will never be "undefined"
			if (!Array.isArray(deps) && depsArray.length === 1) {
				return depsArray[0].value! as PlexusValue<V>
			}
			return depsArray.map((dep) => dep.value!) as PlexusValueArray<V>
		}, [deps])
	)
}
