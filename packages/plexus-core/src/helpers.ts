import { Watchable } from './watchable'

// TODO: here temp; only for testing
export const concurrentWatch = (
	onChange: (from?: string) => void,
	depsArray: Watchable[],
	from?: string
) => {
	const depUnsubs: Array<() => void> = []

	for (let dep of depsArray) {
		// if not a watchable, then we can't watch it, skip to next iteration
		if (!(dep instanceof Watchable)) continue

		const unsubscribe = dep.watch((depValue) => {
			onChange(dep.id)
		}, from)
		depUnsubs.push(() => unsubscribe())
	}

	// unsubscribe on component destroy
	return () => {
		for (let unsub of depUnsubs) {
			unsub()
		}
		depUnsubs.length = 0
	}
}
