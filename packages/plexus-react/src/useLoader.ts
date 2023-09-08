import { PlexusAction, Watchable } from '@plexusjs/core'
import { ActionFunction, InnerFunction } from '@plexusjs/core/dist/action'
import { useEffect, useState } from 'react'
import { usePlexus, PlexusValue, PlexusValueArray } from './usePlexus'

export type PlexusLoaderReturn<T> = {
	value: T
	loading: boolean
	refetch: () => Promise<void>
}

export type PlexusLoaderOptions = {
	// Prevents the action from running on mount
	noMountRun?: boolean
	// Reruns the action when any of the dependencies change
	dependencies?: Watchable[]
}

// Singleton argument
export function useLoader<V extends Watchable, Fn extends ActionFunction>(
	watchables: V,
	action: InnerFunction<Fn>,
	options?: PlexusLoaderOptions
): PlexusLoaderReturn<PlexusValue<V>>
// array argument
export function useLoader<V extends Watchable[], Fn extends ActionFunction>(
	watchables: V | [],
	action: InnerFunction<Fn>,
	options?: PlexusLoaderOptions
): PlexusLoaderReturn<PlexusValueArray<V>>

export function useLoader<Fn extends ActionFunction>(
	watchables: (typeof usePlexus.arguments)[0],
	action: InnerFunction<Fn>,
	options?: PlexusLoaderOptions
) {
	const value = usePlexus(watchables)
	const [loading, setLoading] = useState(true)

	const load = async () => {
		setLoading(true)
		await action()
		setLoading(false)
	}

	useEffect(() => {
		if (!options?.noMountRun) load()
	}, [action, options?.noMountRun])

	const deps = usePlexus(options?.dependencies || [])
	useEffect(() => {
		load()
	}, [deps])

	return {
		loading,
		value,
		refetch: () => load(),
	}
}
