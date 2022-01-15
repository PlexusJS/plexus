import {state} from '@plexusjs/core'
// import {  } from '@plexusjs/core/dist/interfaces';
import {useEffect, useState} from 'react';

export function usePlexus<State extends ReturnType<typeof state>>(deps: State)
export function usePlexus<State extends ReturnType<typeof state>>(deps: State[])
export function usePlexus<State extends ReturnType<typeof state>>(deps: State | State[]){
	const [_, set] = useState(null)
	useEffect(() => {
		if(Array.isArray(deps)){
			const depSubIds: Set<() => void> = new Set()
			for(let dep of deps){
				
				const id = dep.watch(set)
				// depSubIds.set(id, dep)
				
			}
			return () => {
				for(let unsub of depSubIds){
					unsub()
					depSubIds.delete(unsub)
				}
			}
		}

	}, [])

} 