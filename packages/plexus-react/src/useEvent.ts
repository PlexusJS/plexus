import { PlexusEventInstance } from '@plexusjs/core'
import { useEffect, useState } from 'react'

export type PlexusValue<T> = T extends PlexusEventInstance<infer U> ? U : never
export type PlexusValueArray<T> = {
	[K in keyof T]: T[K] extends PlexusEventInstance<infer U> ? U : never
}

type cleanup = () => void
export function usePlexusEvent<Payload = any>(
	event: PlexusEventInstance<Payload>,
	callback: (value: Payload) => cleanup | void
) {
	const [payloadState, setPayloadState] = useState<Payload>()
	useEffect(() => {
		const unsubscribe = event.on((payload) => {
			setPayloadState(() => {
				callback(payload)
				return payload
			})
		})
		return () => {
			unsubscribe()
		}
	}, [callback, event])

	return [payloadState, setPayloadState] as const
}
