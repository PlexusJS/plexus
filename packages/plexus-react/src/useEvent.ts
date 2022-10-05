import { PlexusEventInstance } from "@plexusjs/core"
import { useEffect } from "react"

export type PlexusValue<T> = T extends PlexusEventInstance<infer U> ? U : never
export type PlexusValueArray<T> = { [K in keyof T]: T[K] extends PlexusEventInstance<infer U> ? U : never }

type cleanup = () => void
export function useEvent<Payload = any>(event: PlexusEventInstance<Payload>, callback: (value: Payload) => cleanup | void): void {
	useEffect(() => {
		const unsubscribe = event.on(callback)
		return () => {
			unsubscribe()
		}
	})
}
