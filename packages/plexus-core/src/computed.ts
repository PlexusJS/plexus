// import { isServer } from "@plexusjs/utils/dist/shared"
import {
	AlmostAnything,
	PlexusWatchableValueInterpreter,
	deepClone,
	deepMerge,
	isObject,
} from '@plexusjs/utils'
import { concurrentWatch } from './helpers'
import { PlexusInstance, instance } from './instance/instance'
import { Fetcher, PlexusValidStateTypes, PlexusWatcher } from './types'
import { Watchable } from './watchable'

export type PlexusComputedStateInstance<
	ValueType extends PlexusValidStateTypes = any
> = ComputedStateInstance<ValueType>

/**
 * A computed state is a state that is derived from other states
 */
export class ComputedStateInstance<
	ValueType extends PlexusValidStateTypes = any
> extends Watchable<ValueType> {
	private _internalStore: {
		_name: string
		_persist: boolean
		// utilizing maps because it allows us to preform a lookup in O(1)
		_depsDestroyers: Map<Dependency, ReturnType<Watchable<any>['watch']>>
		_depUnsubscribe: () => void
		_deps: Set<Watchable<any>>
		_ready: boolean
	}
	// private instance: () => PlexusInstance
	private computeFn: ValueType & ((...args) => any)
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
		return `comp_${this._watchableStore._internalId}`
	}

	constructor(
		instance: () => PlexusInstance,
		computeFn: ValueType,
		deps: Watchable<any>[]
	) {
		if (typeof computeFn !== 'function') {
			throw new Error('Computed state must be a function')
		}
		super(instance, computeFn)
		this.instance = instance
		this.computeFn = computeFn

		this._internalStore = {
			_name: '',
			_persist: false,
			// utilizing maps because it allows us to preform a lookup in O(1)
			_depsDestroyers: new Map<Dependency, ReturnType<Watchable['watch']>>(),
			_depUnsubscribe: () => {},
			_deps: new Set(deps),
			_ready: false,
		}
		this.refreshDeps()

		this.mount()
	}
	private mount() {
		// if (isServer()) return
		if (!this.instance()._computedStates.has(this)) {
			this.instance()._computedStates.add(this)
			this.instance().runtime.log(
				'info',
				`Hoisting computed state ${this.id} with value`,
				this.value,
				` to instance`
			)
		}
		if (this._internalStore._ready) return
		this._internalStore._ready = true
		this.refreshDeps()
		this.instance().runtime.log('info', `Computed state ${this.id} is ready`)
	}
	/**
	 *  Internal Helper Function; for each dependency, add a watcher to the state that will update the computed state when a dependency changes
	 * @internal
	 * */
	private refreshDeps() {
		this._internalStore._depUnsubscribe()

		this.instance().runtime.log(
			'info',
			`Mounting Dependencies (${this.deps
				.map((v) => v?.id ?? 'unknown')
				.join(', ')}) to Computed state ${this.instanceId}`
		)
		const unsubscribe = concurrentWatch(
			(depId) => {
				this.instance().runtime.log(
					'info',
					`Computed state ${this.instanceId} dependency ${
						depId ?? 'unknown'
					} changed`
				)
				const value = this.computeFn()

				this.set(value)
				this.refreshDeps()
			},
			Array.from(this._internalStore._deps),
			this.id
		)
		this._internalStore._depUnsubscribe = () => unsubscribe()
		this.mount()
	}
	/**
	 * Watch for changes on this computed state
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(
		callback: PlexusWatcher<PlexusWatchableValueInterpreter<ValueType>>
	): () => void {
		const destroyer = super.watch(callback)
		this.refreshDeps()
		this.instance().runtime.log(
			'info',
			`Setting a watcher on computed state ${this.instanceId}`
		)
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
	private set(value?: PlexusWatchableValueInterpreter<ValueType>) {
		this._watchableStore._lastValue = this._watchableStore._value
		if (isObject(value) && isObject(this._watchableStore._value)) {
			this._watchableStore._lastValue = deepClone(this._watchableStore._value)
		} else if (
			Array.isArray(value) &&
			Array.isArray(this._watchableStore._value)
		) {
			const obj = deepMerge(this._watchableStore._value, value)
			this._watchableStore._lastValue = Object.values(
				obj
			) as unknown as PlexusWatchableValueInterpreter<ValueType>
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
		this.instance().runtime.broadcast(this.id, value)
	}
	/**
	 *	Adds a dependency to the computed state
	 * @param dep
	 */
	addDep(dep: Watchable<any>): void {
		this._internalStore._deps.add(dep)
		this.refreshDeps()
	}
	/**
	 * Removes a dependency from the computed state
	 * @param dep
	 */
	removeDep(dep: Watchable<any>) {
		this._internalStore._deps.delete(dep)
		this.refreshDeps()
	}
	/**
	 * The value (reactive) of the state
	 */
	get value(): PlexusWatchableValueInterpreter<ValueType> {
		this.mount()
		return super.value
	}
	/**
	 * The previous value of the state
	 */
	get lastValue(): ValueType | null {
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The name of the state (NOTE: set with the `.name(name)` function)
	 */
	get name(): string {
		return this._internalStore._name
	}
	/**
	 * Set the name of the state for enhanced internal tracking
	 */
	set name(name: string) {
		this._internalStore._name = `cState_${name}`
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
		if (this._watchableStore._lastValue !== null) {
			this.set(this._watchableStore._lastValue)
			// last value should now be the current value BEFORE the undo, so set this to next value
			this._watchableStore._nextValue = this._watchableStore._lastValue
		} else {
			this.set(this._watchableStore._initialValue)
		}
		this._watchableStore._lastValue = null
	}
	/**
	 * Reset the state to the initial value
	 */
	reset(): void {
		this.set(this._watchableStore._initialValue)
	}
	/**
	 * Set the key of the state for enhanced internal tracking
	 * @deprecated
	 */
	key(key: string) {
		this._internalStore._name = `cState_${key}`
		return this
	}

	/**
	 * Recompute the value of the computed state
	 */
	recompute() {
		this.refreshDeps()
	}
}
interface Dependency extends Watchable<any> {
	[key: string]: any
}
export function _computed<StateValue extends PlexusValidStateTypes>(
	instance: () => PlexusInstance,
	computeFn: StateValue,
	deps: Dependency[]
) {
	return new ComputedStateInstance<StateValue>(instance, computeFn, deps)
}

/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function computed<
	Override extends PlexusValidStateTypes = never,
	Value extends PlexusValidStateTypes = Override extends AlmostAnything
		? Override
		: any
>(item: (value?: Value) => Value, dependencies: Array<Watchable> | Watchable) {
	return _computed(
		() => instance(),
		item,
		!Array.isArray(dependencies) ? [dependencies] : dependencies
	)
}
