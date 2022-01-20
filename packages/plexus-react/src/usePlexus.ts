import {state} from '@plexusjs/core'
// import {  } from '@plexusjs/core/dist/interfaces';
import {useEffect, useState} from 'react';

export function usePlexus<State extends ReturnType<typeof state>>(deps: State)
export function usePlexus<State extends ReturnType<typeof state>>(deps: State[])
export function usePlexus<State extends ReturnType<typeof state>>(deps: State | State[]){
	const [_, set] = useState(null)
	useEffect(() => {
		if(Array.isArray(deps)){
			const depUnsubs: Set<() => void> = new Set()
			for(let dep of deps){
				const unsubscribe = dep.watch(set)
				depUnsubs.add(unsubscribe)
			}
			return () => {
				for(let unsub of depUnsubs){
					unsub()
					depUnsubs.delete(unsub)
				}
			}
		}

	}, [])

	if(!Array.isArray(deps)){
		return deps.value
	}
	return deps.map(dep => dep.value)

} 