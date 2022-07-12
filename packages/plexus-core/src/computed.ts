// import { isServer } from "@plexusjs/utils/dist/shared"
import { deepClone, deepMerge, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { PlexusStateType, StateInstance, _state } from "./state"
import { PlexusWatcher, Watchable, WatchableMutable } from "./watchable"

export type PlexusComputedStateInstance<ValueType extends PlexusStateType = any> = ComputedStateInstance<ValueType>

export class ComputedStateInstance<ValueType extends PlexusStateType = any> extends Watchable<ValueType> {
	private _internalStore: {
		_name: string
		_persist: boolean
		// utilizing maps because it allows us to preform a lookup in O(1)
		_depsDestroyers: Map<Dependency, ReturnType<WatchableMutable<any>["watch"]>>
		_deps: Set<WatchableMutable<any>>
		_ready: boolean
	}
	private instance: () => PlexusInstance
	private computeFn: () => ValueType
	/**
	 * The internal id of the computed state
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the computed state with an instance prefix
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
		return `comp_${this._watchableStore._internalId}`
	}

	constructor(instance: () => PlexusInstance, computeFn: () => ValueType, deps: WatchableMutable<any>[]) {
		super(instance, computeFn())
		this.instance = instance
		this.computeFn = computeFn

		this._internalStore = {
			_name: "",
			_persist: false,
			// utilizing maps because it allows us to preform a lookup in O(1)
			_depsDestroyers: new Map<Dependency, ReturnType<WatchableMutable["watch"]>>(),
			_deps: new Set(deps),
			_ready: false,
		}
		this.refreshDeps()

		this.mount()
	}
	private mount() {
		// if (isServer()) return
		if (!this.instance()._computedStates.has(this)) {
			this.instance().runtime.log("info", `Hoisting computed state ${this.id} with value`, this.value, ` to instance`)
			this.instance()._computedStates.add(this)
			this.instance().storage?.sync()
		}
		if (this._internalStore._ready) return
		this._internalStore._ready = true
		this.instance().runtime.log("info", `Computed state ${this.id} is ready`)
	}
	/**
	 *  Internal Helper Function; for each dependency, add a watcher to the state that will update the computed state when a dependency changes
	 * @internal
	 * */
	private refreshDeps() {
		this._internalStore._depsDestroyers.forEach((destroyer) => destroyer())
		this._internalStore._depsDestroyers.clear()
		this.instance().runtime.log("info", `Mounting Dependencies for Computed state ${this.instanceId}`)
		Array.from(this._internalStore._deps.values()).forEach((dep, i) => {
			this.instance().runtime.log("debug", `Mounting Dependency(${i}) to Computed state ${this.instanceId}`)
			const destroyer = dep.watch(() => {
				this.instance().runtime.log("info", `Computed state ${this.instanceId} dependency ${i} changed`)
				const value = this.computeFn()

				// this._internalStore._state.set(value)
				this.set(value)
			})
			this._internalStore._depsDestroyers.set(dep, destroyer)
		})
	}
	/**
	 * Watch for changes on this computed state
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<ValueType>): () => void {
		const destroyer = super.watch(callback)
		this.refreshDeps()
		this.instance().runtime.log("info", `Setting a watcher on computed state ${this.instanceId}`)
		return () => {
			destroyer()
			this.refreshDeps()
		}
	}

	/**
	 * @internal
	 * This would normally be passed from WatchableValue, but Watchable value has a set function that is public. We are not allowing the user to set the value of the state explicitly, so we recreate this function and make it private
	 * @param value The value to set the state to
	 */
	private set(value?: ValueType) {
		this._watchableStore._lastValue = this._watchableStore._value
		if (isObject(value) && isObject(this._watchableStore._value)) {
			this._watchableStore._lastValue = deepClone(this._watchableStore._value)
		} else if (Array.isArray(value) && Array.isArray(this._watchableStore._value)) {
			const obj = deepMerge(this._watchableStore._value, value)
			this._watchableStore._lastValue = Object.values(obj) as unknown as ValueType
		} else {
			this._watchableStore._lastValue = this._watchableStore._value
		}
		// apply the next value
		if (value === undefined) {
			this._watchableStore._value = this._watchableStore._nextValue
		} else {
			this._watchableStore._value = value
		}
		this._watchableStore._publicValue = deepClone(this._watchableStore._value)
		this._watchableStore._nextValue = deepClone(this._watchableStore._value)

		// update the runtime conductor
		// this.mount()
		this._instance().runtime.broadcast(this.id, value)
	}
	/**
	 *	Adds a dependency to the computed state
	 * @param dep
	 */
	addDep(dep: WatchableMutable<any>): void {
		this._internalStore._deps.add(dep)
		this.refreshDeps()
	}
	/**
	 * Removes a dependency from the computed state
	 * @param dep
	 */
	removeDep(dep: WatchableMutable<any>) {
		this._internalStore._deps.delete(dep)
		this.refreshDeps()
	}
	/**
	 * The value (reactive) of the state
	 */
	get value(): ValueType {
		// this.mount()
		// return this._internalStore._state.value
		return super.value
	}
	/**
	 * The previous value of the state
	 */
	get lastValue(): ValueType {
		// return this._internalStore._state.lastValue
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	get name(): string {
		return this._internalStore._name
	}
	/**
	 * Returns a list of dependencies for the computed state
	 */
	get deps() {
		return Array.from(this._internalStore._deps.values())
	}

	/**
	 * Reset the state to the previous value
	 */
	undo(): void {
		// this._internalStore._state.undo()
		this.set(this._watchableStore._lastValue)
	}
	/**
	 * Reset the state to the initial value
	 */
	reset(): void {
		// this._internalStore._state.reset()
		this.set(this._watchableStore._initialValue)
	}
	/**
	 * Set the key of the state for enhanced internal tracking
	 */
	key(key: string) {
		this._internalStore._name = `cState_${key}`
		return this
	}
}
interface Dependency extends WatchableMutable<any> {
	[key: string]: any
}
export function _computed<StateValue extends PlexusStateType>(instance: () => PlexusInstance, computeFn: () => StateValue, deps: Dependency[]) {
	return new ComputedStateInstance<StateValue>(instance, computeFn, deps)
}
