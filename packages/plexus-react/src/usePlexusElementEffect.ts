import { HTMLProps, MutableRefObject, useEffect, useState } from 'react'

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
	useEffect(() => {
		const el = elRef.current
		if (!el) return
		setMounted(true)
		// if (!mounted) return;

		const callback = (value: PlexusType) => {
			if (!el) return
			setterFunction({ value, refEl: el })
		}
		// call it initially
		callback(plexusState.value)
		const kill = plexusState.watch(callback)
		return () => {
			kill()
		}
	}, [
		elRef,
		elRef.current,
		plexusState.id,
		setterFunction,
		...additionalReactStatesToWatch,
	])

	return { mounted }
}
