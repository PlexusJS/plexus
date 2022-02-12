import { PlexusCollectionGroup, PlexusStateInstance, state } from '@plexusjs/core'
// import {  } from '@plexusjs/core/dist/interfaces';
import { useEffect, useState } from 'react';

export type PlexusValue<T> = T extends PlexusStateInstance<infer U> ? U : never;
export type PlexusValueArray<T> = { [ K in keyof T ]: T[ K ] extends PlexusStateInstance<infer U> ? U : never };


const normalizeDeps = (deps: PlexusStateInstance | PlexusStateInstance[] | PlexusCollectionGroup | PlexusCollectionGroup[]) => Array.isArray(deps) ? deps : [ deps ];

export function usePlexus<Value extends PlexusStateInstance<any>>(deps: Value): PlexusValue<Value>

export function usePlexus<Value extends PlexusStateInstance<any>[]>(deps: Value): PlexusValueArray<Value>

export function usePlexus<Value extends PlexusStateInstance<any>[]>(deps: Value | [] | PlexusStateInstance | PlexusCollectionGroup): PlexusValue<Value> | PlexusValueArray<Value> {
	const depsArr = normalizeDeps(deps) as PlexusValueArray<Value>
	const [ _, set ] = useState(null)
	useEffect(() => {
		if (Array.isArray(depsArr)) {
			const depUnsubs: Set<() => void> = new Set()
			for (let dep of depsArr) {
				// @warning this is kind of wrong, but works for now
				if (!dep?.watch) continue;
				const unsubscribe = dep.watch(set)
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
	return depsArr.map<Value>(dep => dep.value) as PlexusValueArray<Value>

} 