import { Watchable } from '@plexusjs/core'
// import { PlexusStateType } from '@plexusjs/core/dist/types'
import { useEffect, useState } from 'react'

export function useWatcher<V = any>(
	watchable: Watchable<V>,
	callback: (value: V) => void
) {
	const [value, setValue] = useState(watchable.value)
	useEffect(() => {
		const unsub = watchable.watch(callback)
		return () => unsub()
	}, [callback])
	return [value, setValue] as const
}
