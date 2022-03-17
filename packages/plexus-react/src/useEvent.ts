import { PlexusEventInstance, event } from "@plexusjs/core"
// import {  } from '@plexusjs/core/dist/interfaces';
import { useEffect, useState } from "react"

export type PlexusValue<T> = T extends PlexusEventInstance<infer U> ? U : never
export type PlexusValueArray<T> = { [K in keyof T]: T[K] extends PlexusEventInstance<infer U> ? U : never }

const normalizeDeps = (deps: PlexusEventInstance | PlexusEventInstance[]) => (Array.isArray(deps) ? deps : [deps])

// export function usePlexus<Value extends PlexusEventInstance<any>>(deps: Value): PlexusValue<Value>

// export function usePlexus<Value extends PlexusEventInstance<any>[]>(deps: Value): PlexusValueArray<Value>
type cleanup = () => void
export function useEvent(event: PlexusEventInstance, callback: () => cleanup | void): void {
	useEffect(() => {
		const unsubscribe = event.on(callback)
		return () => {
			unsubscribe()
		}
	}, [])
}
