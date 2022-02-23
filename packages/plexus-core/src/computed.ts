import { classPrivateMethod } from "@babel/types"
import { deepClone } from "./helpers"
import { PlexusInstance } from "./instance"
import { isWatchable, Watchable } from "./interfaces"
import { PlexusStateType, _state, PlexusStateInstance } from "./state"
export interface PlexusComputedStateInstance<ValueType extends PlexusStateType> {
	/**
	 * The value (reactive) of the state
	 */
	get value(): ValueType
	/**
	 * The previous value of the state
	 */
	get lastValue(): ValueType
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	get name(): string
	get deps(): unknown[]
	addDep(dep: Watchable | string): void
	removeDep(dep: Watchable | string): void
	/**
	 * Persist the state to selected storage
	 * @param name The storage prefix to use
	 */

	persist(name: string): void

	/**
	 * Reset the state to the previous value
	 */
	undo(): void
	/**
	 * Reset the state to the initial value
	 */
	reset(): void
	/**
	 * Set the key of the state for internal tracking
	 */
	key(key: string): this
}
export function _computed<StateValue extends PlexusStateType>(
	instance: () => PlexusInstance,
	computeFn: (value?: StateValue) => StateValue,
	deps: Watchable[]
) {
	const _internalStore = {
		_state: _state(() => instance(), computeFn()),
		// utilizing maps because it allows us to preform a lookup in O(1)
		_depsDestroyers: new Map<string, ReturnType<Watchable["watch"]>>(),
		_deps: new Map<string, Watchable>(
			deps.map((dep, i) => [dep.name || (typeof dep.key === "string" ? dep.key : `${i}`), dep])
		),
	}

	/**
	 *  Internal Helper Function; for each dependency, add a watcher to the state that will update the computed state when a dependency changes
	 * @internal
	 * */
	const refreshDeps = () => {
		_internalStore._depsDestroyers.forEach((destroyer) => destroyer())
		_internalStore._depsDestroyers.clear()

		Array.from(_internalStore._deps.values()).forEach((dep, i) => {
			const destroyers = dep.watch(() => {
				const value = computeFn(_internalStore._state.value)
				console.log(
					`${dep.name} changed; updating computed state to "${value}"; current value is "${_internalStore._state.value}"`,
					JSON.stringify(Array.from(_internalStore._deps.values()), null, 2)
				)
				_internalStore._state.set(value)
			})
			_internalStore._depsDestroyers.set(dep.name || (typeof dep.key === "string" ? dep.key : `${i}`), destroyers)
		})
	}

	/**
	 * Internal Helper Function; get the value of the state
	 * @internal
	 * @param searchKey
	 * @returns
	 */
	const checkSearchKey = (searchKey: string): boolean => {
		if (searchKey === "") {
			instance()._runtime.log(
				"warn",
				`Computed state ${
					_internalStore._state.name || "<NULL>"
				} can't add a dependency with a key of "${searchKey}"`
			)
			return false
		}
		return true
	}

	const computed: PlexusComputedStateInstance<StateValue> = Object.freeze({
		persist(name: string) {
			_internalStore._state.persist(name)
		},
		undo() {
			_internalStore._state.undo()
		},
		reset() {
			_internalStore._state.reset()
		},
		get value() {
			return _internalStore._state.value
		},
		get lastValue() {
			return _internalStore._state.lastValue
		},
		get name() {
			return _internalStore._state.name
		},
		key(key: string) {
			_internalStore._state.key(key)
			return this
		},
		get deps() {
			return Array.from(_internalStore._deps.values())
		},
		addDep(dep: Watchable | string) {
			let searchKey = ""
			// TODO - add a warning the dep is already added
			// TODO - add a warning the dep is not a watchable
			if (isWatchable(dep)) {
				searchKey = dep.name || (typeof dep.key === "string" ? dep.key : "")
				if (checkSearchKey(searchKey)) {
					return
				}
				_internalStore._deps.set(searchKey, dep)
				refreshDeps()
			} else if (typeof dep === "string") {
				searchKey = dep
			}

			if (isWatchable(dep)) {
			}
		},
		removeDep(dep: Watchable | string) {
			let searchKey = ""
			if (isWatchable(dep)) {
				searchKey = dep.name || (typeof dep.key === "string" ? dep.key : "")
			} else if (typeof dep === "string") {
				searchKey = dep
			}
			if (checkSearchKey(searchKey)) {
				return
			}
			if (_internalStore._deps.has(searchKey)) {
				_internalStore._deps.delete(searchKey)
				return
			}
			if (_internalStore._depsDestroyers.has(searchKey)) {
				_internalStore._depsDestroyers.delete(searchKey)
				return
			}
			refreshDeps()
		},
	})
	refreshDeps()
	return computed
}
