import { PlexusCollectionGroup, WatchableValue, Watchable } from "@plexusjs/core"
import { useEffect, useRef, useState } from "react"

const normalizeDeps = (deps: Watchable | Watchable[]) => (Array.isArray(deps) ? (deps as Watchable[]) : [deps as Watchable])

export type PlexusValue<T> = T extends Watchable<infer U> ? U : never
export type PlexusValueArray<T> = {
	[K in keyof T]: T[K] extends Watchable<infer U> ? U : never
}

// Singleton argument
export function usePlexusLegacy<V extends Watchable>(deps: V): PlexusValue<V>
// array argument
export function usePlexusLegacy<V extends Watchable[]>(deps: V | []): PlexusValueArray<V>
/**
 * A react hook to extract the values from plexus objects and reactively update the component and value when the values change
 * @param deps A list of plexus watchable objects (ex. State, Group, Selector, Computed)
 * @returns
 */
export function usePlexusLegacy<V extends Watchable[]>(deps: V | [] | Watchable): PlexusValue<V> | PlexusValueArray<V> {
	const [_, set] = useState({})
	// const [changedIndex, setChangedIndex] = useState(-1)
	// const [depsArray, setDepsArray] = useState<Watchable[]>(normalizeDeps(deps))

	const depsArray = useRef([...normalizeDeps(deps)])

	useEffect(() => {
		if (Array.isArray(depsArray.current)) {
			// setDepsArray(depsArr)

			const depUnsubs: Array<() => void> = []
			let index = -1
			for (let dep of depsArray.current) {
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
			return () => {
				for (let unsub of depUnsubs) {
					unsub()
				}
				depUnsubs.length = 0
			}
		}
	}, [])
	// The "!" at the end of the values here tell the tsc that these values will never be "undefined"
	if (!Array.isArray(deps) && depsArray.current.length === 1) {
		return depsArray.current[0].value! as PlexusValue<V>
	}

	return depsArray.current.map((dep) => dep.value!) as PlexusValueArray<V>
}
