import { PlexusCollectionGroup, PlexusStateInstance, state, PlexusCollectionSelector } from "@plexusjs/core"
import { isWatchable } from "@plexusjs/core/dist/interfaces"
import { useEffect, useState } from "react"

export type PlexusValue<T> = T extends PlexusStateInstance<infer U>
	? U
	: T extends PlexusCollectionGroup<infer U>
	? U[]
	: T extends PlexusCollectionSelector<infer U>
	? U
	: never
export type PlexusValueArray<T> = {
	[K in keyof T]: T[K] extends PlexusCollectionGroup<infer U>
		? Array<U>
		: T[K] extends PlexusCollectionSelector<infer U>
		? U
		: T[K] extends PlexusStateInstance<infer U>
		? U
		: T[K] extends PlexusCollectionSelector<infer U>
		? U
		: never
}

const normalizeDeps = (
	deps:
		| PlexusStateInstance
		| PlexusStateInstance[]
		| PlexusCollectionGroup
		| PlexusCollectionGroup[]
		| PlexusCollectionSelector
		| PlexusCollectionSelector[]
) => (Array.isArray(deps) ? deps : [deps])

export function usePlexus<
	Value extends PlexusStateInstance<any> | PlexusCollectionGroup<any> | PlexusCollectionSelector<any>
>(deps: Value): PlexusValue<Value>

export function usePlexus<
	Value extends PlexusStateInstance<any>[] | PlexusCollectionGroup<any>[] | PlexusCollectionSelector<any>[]
>(deps: Value): PlexusValueArray<Value>

export function usePlexus<
	Value extends PlexusStateInstance<any>[] | PlexusCollectionGroup<any>[] | PlexusCollectionSelector<any>[]
>(
	deps: Value | [] | PlexusStateInstance | PlexusCollectionGroup | PlexusCollectionSelector
): PlexusValue<Value> | PlexusValueArray<Value> {
	const depsArr = normalizeDeps(deps)
	const [_, set] = useState(null)
	useEffect(() => {
		if (Array.isArray(depsArr)) {
			const depUnsubs: Set<() => void> = new Set()
			for (let dep of depsArr) {
				// if not a watchable, then we can't watch it, skip to next iteration
				if (!isWatchable(dep)) continue
				const unsubscribe = dep.watch(() =>
					set(Math.random().toString(64).substring(4) + Math.random().toString(64).substring(4))
				)
				depUnsubs.add(unsubscribe)
			}
			return () => {
				for (let unsub of depUnsubs) {
					unsub()
					depUnsubs.delete(unsub)
				}
			}
		}
	}, [])

	if (!Array.isArray(deps) && depsArr.length === 1) {
		return deps.value as PlexusValue<Value>
	}

	return depsArr.map<Value>((dep) => dep.value) as PlexusValueArray<Value>
}
