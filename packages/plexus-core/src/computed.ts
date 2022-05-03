import { PlexusInstance } from "./instance"
import { PlexusStateType, StateInstance, _state } from "./state"
import { WatchableValue } from "./watchable"

export type PlexusComputedStateInstance<ValueType extends PlexusStateType = any> = ComputedStateInstance<ValueType>

export class ComputedStateInstance<ValueType extends PlexusStateType = any> {
	private _internalStore: {
		_state: StateInstance<ValueType>
		// utilizing maps because it allows us to preform a lookup in O(1)
		_depsDestroyers: Map<Dependency, ReturnType<WatchableValue<any>["watch"]>>
		_deps: Set<WatchableValue<any>>
	}
	private instance: () => PlexusInstance
	private computeFn: () => ValueType

	constructor(instance: () => PlexusInstance, computeFn: () => ValueType, deps: WatchableValue<any>[]) {
		this.instance = instance
		this.computeFn = computeFn

		this._internalStore = {
			_state: _state(() => instance(), computeFn()),
			// utilizing maps because it allows us to preform a lookup in O(1)
			_depsDestroyers: new Map<Dependency, ReturnType<WatchableValue["watch"]>>(),
			_deps: new Set(deps),
		}
		this.refreshDeps()
	}

	/**
	 *  Internal Helper Function; for each dependency, add a watcher to the state that will update the computed state when a dependency changes
	 * @internal
	 * */
	private refreshDeps() {
		this._internalStore._depsDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._depsDestroyers.clear()

		Array.from(this._internalStore._deps.values()).forEach((dep, i) => {
			const destroyer = dep.watch(() => {
				const value = this.computeFn()
				// console.log(
				// 	`${dep.name} changed; updating computed state to "${value}"; current value is "${_internalStore._state.value}"`,
				// 	JSON.stringify(Array.from(_internalStore._deps.values()), null, 2)
				// )
				this._internalStore._state.set(value)
			})
			this._internalStore._depsDestroyers.set(dep, destroyer)
		})
	}

	/**
	 * The value (reactive) of the state
	 */
	get value(): ValueType {
		return this._internalStore._state.value
	}
	/**
	 * The previous value of the state
	 */
	get lastValue(): ValueType {
		return this._internalStore._state.lastValue
	}
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	get name(): string {
		return this._internalStore._state.name
	}
	/**
	 * Returns a list of dependencies for the computed state
	 */
	get deps() {
		return Array.from(this._internalStore._deps.values())
	}
	/**
	 *	Adds a dependency to the computed state
	 * @param dep
	 */
	addDep(dep: WatchableValue<any>): void {
		this._internalStore._deps.add(dep)
		this.refreshDeps()
	}
	/**
	 * Removes a dependency from the computed state
	 * @param dep
	 */
	removeDep(dep: WatchableValue<any>) {
		this._internalStore._deps.delete(dep)
		this.refreshDeps()
	}
	/**
	 * Persist the state to selected storage
	 * @param name The storage prefix to use
	 */

	persist(name: string) {
		this._internalStore._state.persist(name)
	}

	/**
	 * Reset the state to the previous value
	 */
	undo(): void {
		this._internalStore._state.undo()
	}
	/**
	 * Reset the state to the initial value
	 */
	reset(): void {
		this._internalStore._state.reset()
	}
	/**
	 * Set the key of the state for internal tracking
	 */
	key(key: string) {
		this._internalStore._state.key(key)
		return this
	}
}
interface Dependency extends WatchableValue<any> {
	[key: string]: any
}
export function _computed<StateValue extends PlexusStateType>(instance: () => PlexusInstance, computeFn: () => StateValue, deps: Dependency[]) {
	return new ComputedStateInstance<StateValue>(instance, computeFn, deps)
}
