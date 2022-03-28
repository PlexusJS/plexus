"use strict"
import { PlexusCollectionGroup } from "@plexusjs/core"
import { AlmostAnything } from "@plexusjs/core/dist/helpers"
import { isWatchable, WatchableValue } from "@plexusjs/core/dist/interfaces"
import { useEffect, useState } from "react"

const normalizeDeps = (deps: WatchableValue | WatchableValue[]) => (Array.isArray(deps) ? (deps as WatchableValue[]) : [deps as WatchableValue])

export type PlexusValue<T> = T extends PlexusCollectionGroup<infer U> ? U[] : T extends WatchableValue<infer U> ? U : never
export type PlexusValueArray<T> = {
	[K in keyof T]: T[K] extends PlexusCollectionGroup<infer U> ? U[] : T[K] extends WatchableValue<infer U> ? U : never
}

// Singleton argument
export function usePlexus<V extends WatchableValue | PlexusCollectionGroup>(deps: V): PlexusValue<V>
// array argument
export function usePlexus<V extends (WatchableValue | PlexusCollectionGroup)[]>(deps: V | []): PlexusValueArray<V>
/**
 * A react hook to extract the values from plexus objects and reactively update the component and value when the values change
 * @param deps A list of plexus watchable objects (ex. State, Group, Selector, Computed)
 * @returns
 */
export function usePlexus<V extends WatchableValue[]>(deps: V | [] | WatchableValue): PlexusValue<V> | PlexusValueArray<V> {
	const [_, set] = useState({})

	const depsArr = normalizeDeps(deps)

	useEffect(() => {
		if (Array.isArray(depsArr)) {
			const depUnsubs: Set<() => void> = new Set()
			for (let dep of depsArr) {
				// if not a watchable, then we can't watch it, skip to next iteration
				if (!isWatchable(dep)) continue
				const unsubscribe = dep.watch(function () {
					set({})
				})
				depUnsubs.add(unsubscribe)
			}
			// unsubscribe on component destroy
			return () => {
				for (let unsub of Array.from(depUnsubs.values())) {
					unsub()
					depUnsubs.delete(unsub)
				}
			}
		}
	}, [])
	// The "!" at the end of the values here tell the tsc that these values will never be "undefined"
	if (!Array.isArray(deps) && depsArr.length === 1) {
		return depsArr[0].value!
	}

	return depsArr.map((dep) => dep.value!) as PlexusValueArray<V>
}
