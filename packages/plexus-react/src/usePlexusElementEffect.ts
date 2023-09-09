import {
	HTMLProps,
	MutableRefObject,
	useCallback,
	useEffect,
	useState,
} from 'react'

import { Watchable } from '@plexusjs/core'
// import { PlexusStateType } from '@plexusjs/core/dist/types'

type HTMLDivElementPropKeys = keyof HTMLProps<HTMLElement>

export function usePlexusElementEffect<
	ElementType extends HTMLElement,
	PlexusType = any,
	PropertyKey extends HTMLProps<HTMLElement>[HTMLDivElementPropKeys] = HTMLProps<HTMLElement>[HTMLDivElementPropKeys]
>(
	elRef: MutableRefObject<ElementType>,
	plexusState: Watchable<PlexusType>,
	setterFunction: (context: {
		value: PlexusType
		refEl: HTMLElement
	}) => PropertyKey,
	additionalReactStatesToWatch: any[] = []
) {
	const [mounted, setMounted] = useState(false)
	const setter = useCallback(setterFunction, [
		plexusState.id,
		setterFunction,
		...additionalReactStatesToWatch,
	])

	useEffect(() => {
		const el = elRef.current
		if (!el) return
		setMounted(true)
		// if (!mounted) return;

		const callback = (value: PlexusType) => {
			if (!el) return
			setter({ value, refEl: el })
		}
		// call it initially
		callback(plexusState.value)
		const kill = plexusState.watch(callback)
		return () => {
			kill()
		}
	}, [plexusState.id, setter, ...additionalReactStatesToWatch])

	return { mounted }
}
