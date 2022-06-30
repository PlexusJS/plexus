import { Watchable } from "@plexusjs/core"

export const normalizeDeps = (deps: Watchable | Watchable[]) => (Array.isArray(deps) ? (deps as Watchable[]) : [deps as Watchable])

export const concurrentWatch = (onChange: () => void, depsArray: Watchable[]) => {
	const depUnsubs: Array<() => void> = []
	if (Array.isArray(depsArray)) {
		let index = -1
		for (let dep of depsArray) {
			++index
			// if not a watchable, then we can't watch it, skip to next iteration
			if (!(dep instanceof Watchable)) continue
			const unsubscribe = dep.watch(function (v) {
				onChange()
			})
			depUnsubs.push(unsubscribe)
		}
		// unsubscribe on component destroy
	}
	return () => {
		for (let unsub of depUnsubs) {
			unsub()
		}
		depUnsubs.length = 0
	}
}
