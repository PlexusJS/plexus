import { PlexusCollectionGroup, WatchableValue, Watchable } from "@plexusjs/core"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSyncExternalStore } from "use-sync-external-store/shim"
import { concurrentWatch } from "./utils"

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
	// if we are serverside, return
	// if (typeof window === "undefined") throw new Error("usePlexus is not supported on server-side yet.")
	// const [_, set] = useState({})
	const returnArray = useRef<PlexusValueArray<V>>()
	const snapshot = useRef<string>()

	const subscribe = useCallback(
		(onChange: () => void) => {
			const depsArray = [...normalizeDeps(deps)]
			return concurrentWatch(onChange, depsArray)
		},
		[deps]
	)
	const fetchValues = useCallback(() => {
		const depsArray = [...normalizeDeps(deps)]
		// The "!" at the end of the values here tell the tsc that these values will never be "undefined"
		if (!Array.isArray(deps) && depsArray.length === 1) {
			// return depsArray[0].value! as PlexusValue<V>
			return deps.value! as PlexusValue<V>
		}
		const values = depsArray.map((dep) => dep.value!)
		const compSnapshot = JSON.stringify(values)
		if (!snapshot.current) {
			snapshot.current = compSnapshot
		}
		// get the memoized array of values, if it's length does not match the deps length, then we need to update the array reference
		// if the array is not set
		if (!returnArray.current) {
			returnArray.current = values as PlexusValueArray<V>
		}
		// this means the array is already set, so here, we should clear the array (to keep the same reference) and then push the values to the array
		else {
			console.log(snapshot.current, compSnapshot, snapshot.current === compSnapshot)
			// fill the array with the values
			if (snapshot.current === compSnapshot) {
				// reset the array
				returnArray.current.length = 0
				returnArray.current.push(...(values as PlexusValueArray<V>))
			} else {
				returnArray.current = values as PlexusValueArray<V>
			}
		}
		snapshot.current = compSnapshot

		// returnArray.current = returnArray.current.length !== depsArray.length ? [] : returnArray.current)

		// return the array and give it the correct type
		return returnArray.current
	}, [deps])
	return useSyncExternalStore(
		// Subscription callback
		subscribe,
		// GetValue callback
		fetchValues,
		fetchValues
	)
}
