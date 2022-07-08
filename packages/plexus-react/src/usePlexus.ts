import { Watchable } from "@plexusjs/core"
import { isEqual } from "@plexusjs/utils/dist/shared"
import { useCallback, useRef } from "react"
import { useSyncExternalStore } from "use-sync-external-store/shim"
import { concurrentWatch, convertThingToString, deepClone } from "./utils"

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
 * A React hook to extract the values from plexus objects and reactively update the component and value when the values change
 * @param deps A list of plexus watchable objects (ex. State, Group, Selector, Computed)
 * @returns The reactive values of the plexus objects
 */
export function usePlexus<V extends Watchable[]>(deps: V | [] | Watchable): PlexusValue<V> | PlexusValueArray<V> {
	// if we are serverside, return
	// if (typeof window === "undefined") throw new Error("usePlexus is not supported on server-side yet.")
	// const [_, set] = useState({})
	const id = useRef(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
	const holding = useRef(normalizeDeps(deps))
	// console.log("usePlexus", id.current, "holding", holding.current)
	const returnArray = useRef<PlexusValueArray<V>>()
	const snapshot = useRef<string>()

	// TODO: Consider using unstable_batchedUpdates for batching updates to prevent unnecessary rerenders
	// In reality, this should be done in the runtime. I'll investigate this later.
	const subscribe = useCallback(
		(onChange: () => void) => {
			// console.log("usePlexus", id.current, "subscribe", deps)
			const depsArray = holding.current
			return concurrentWatch(onChange, depsArray)
		},
		[deps, ...holding.current.map((dep) => dep.value)]
	)
	const fetchValues = useCallback(() => {
		const depsArray = holding.current
		// If this is the single argument syntax...
		if (!Array.isArray(deps) && depsArray.length === 1) {
			// return depsArray[0].value! as PlexusValue<V>
			const compSnapshot = convertThingToString(deps.value)
			if (!snapshot.current) {
				snapshot.current = compSnapshot
			}
			// console.log("usePlexus", id.current, "fetchValues", snapshot.current, compSnapshot)
			if (snapshot.current !== compSnapshot) {
				return deps.value! as PlexusValue<V>
			}
			snapshot.current = compSnapshot
			return deepClone(deps.value!) as PlexusValue<V>
		}
		// If this is the array syntax...
		const values = depsArray.map((dep) => dep.value!)
		const compSnapshot = convertThingToString(values)
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
			// fill the array with the values
			if (snapshot.current === compSnapshot) {
				// console.log(id.current, "same values so just resetting the array reference", values, deps[0].value)

				// reset the array
				returnArray.current.length = 0
				returnArray.current.push(...(values as PlexusValueArray<V>))
				// returnArray.current = values as PlexusValueArray<V>
			} else {
				console.log(id.current, values)
				// returnArray.current.push(...(values as PlexusValueArray<V>))
				returnArray.current = [...values] as PlexusValueArray<V>
			}
		}
		snapshot.current = compSnapshot

		// returnArray.current = returnArray.current.length !== depsArray.length ? [] : returnArray.current)

		// return the array and give it the correct type
		return returnArray.current
	}, [deps, ...holding.current.map((dep) => dep.value)])

	return useSyncExternalStore(
		// Subscription callback
		subscribe,
		// GetValue callback
		fetchValues,
		fetchValues
		// (v) => {
		// 	return v
		// },
		// (a, b) => {
		// 	console.log("usePlexus", id.current, "comparing", a, b)
		// 	return isEqual(a as any, b as any)
		// }
	)
}
