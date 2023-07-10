import {
	AlmostAnything,
	PlexusWatchableValueInterpreter,
	deepClone,
	deepMerge,
	isEqual,
	isObject,
} from '@plexusjs/utils'
import { PlexusInstance, instance } from './instance/instance'
import { Fetcher, PlexusInternalWatcher, PlexusValidStateTypes } from './types'

import { WatchableMutable } from './watchable'
// import { PlexusInstance, PlexStateInternalStore, PlexusStateType, PlexusStateInstance, PlexusWatcher } from "./interfaces"

export type PlexusState = <Value extends PlexusValidStateTypes = any>(
	instance: () => PlexusInstance,
	input: Value
) => StateInstance<Value>

type DestroyFn = () => void

export interface StateStore {
	_name: string
	_persist: boolean
	_interval: NodeJS.Timer | null
	_ready: boolean
	_isSetting: boolean
}
export type PlexusStateInstance<Value extends PlexusValidStateTypes = any> =
	StateInstance<Value>
/**
 * A trackable State
 */
export class StateInstance<StateValue> extends WatchableMutable<StateValue> {
	private _internalStore: StateStore
	/**
	 * The internal id of the state
	 */
	get id(): string {
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the state with an instance prefix
	 */
	get instanceId(): string {
		return `ste_${this._watchableStore._internalId}`
	}
	constructor(instance: () => PlexusInstance, init: StateValue) {
		super(instance, init)
		this.instance = instance
		this._internalStore = {
			_name: '',
			_persist: false,
			_interval: null,
			_ready: false,
			_isSetting: false,
		}

		this.mount()
		this.persistSync()
	}

	private persistSync() {
		if (!this._internalStore._persist) {
			return
		}
		this.instance().storage?.monitor(this.name, this)
		this.instance().storage?.sync(this._watchableStore._value)
	}

	private async syncPersistToValue() {
		if (!this._internalStore._persist) {
			return
		}
		if (this._internalStore._isSetting) return
		const storedValue = (await this.instance().storage?.get(
			this._internalStore._name
		)) as PlexusWatchableValueInterpreter<StateValue>
		if (storedValue) {
			if (this.isEqual(storedValue)) return
			this.set(storedValue)
		}
	}

	private mount() {
		if (!this.instance()._states.has(this)) {
			this.instance()._states.add(this)
			this.instance().runtime.log(
				'debug',
				`Hoisting state ${this.instanceId} with value`,
				this._watchableStore._value,
				`to instance`
			)
		}
		if (this._internalStore._ready) return
		this._internalStore._ready = true
		this.instance().runtime.log('info', `State ${this.id} is ready`)
	}
	/**
	 * Set the value of the state
	 * @param value The new value of this state
	 */
	set(value?: PlexusWatchableValueInterpreter<StateValue>) {
		this._internalStore._isSetting = true
		super.set(value)
		if (this._internalStore._persist)
			this.instance().storage?.set(
				this._internalStore._name,
				this._watchableStore._value
			)
		this._internalStore._isSetting = false
		return this
	}
	/**
	 * Patch the current value of the state
	 * @param value A value of the state to merge with the current value
	 */
	patch(value: Partial<PlexusWatchableValueInterpreter<StateValue>>) {
		if (isObject(value) && isObject(this._watchableStore._value)) {
			// ! Shitty type casting, should be fixed
			this.set(
				deepMerge(
					this._watchableStore._value as any,
					value,
					true
				) as PlexusWatchableValueInterpreter<StateValue>
			)
		}
		// if the deep merge is on an array type, we need to convert the merged object back to an array
		else if (
			Array.isArray(value) &&
			Array.isArray(this._watchableStore._value)
		) {
			const obj = deepMerge(this._watchableStore._value, value, true)
			this.set(
				Object.values(obj) as PlexusWatchableValueInterpreter<StateValue>
			)
		} else {
			this.set(value as PlexusWatchableValueInterpreter<StateValue>)
		}
		if (this._internalStore._persist)
			this.instance().storage?.set(
				this._internalStore._name,
				this._watchableStore._value
			)

		return this
	}
	/**
	 * Watch for changes on this state
	 * @param callback The callback to run when the state changes
	 * @param from (optional) The id of the watcher
	 * @returns The remove function to stop watching
	 */
	watch(
		callback: PlexusInternalWatcher<
			PlexusWatchableValueInterpreter<StateValue>
		>,
		from?: string
	): () => void {
		const destroyer = super.watch(callback, from)
		return () => {
			this.instance().runtime.log(
				'info',
				`Killing a watcher from state ${this.instanceId}`
			)
			destroyer()
		}
	}

	/**
	 * Persist the state to selected storage
	 * @param name The storage prefix to use
	 */
	persist(name: string) {
		// if there is a name, change the states internal name
		if (name) this._internalStore._name = `state_${name}`

		if (this.instance().storage) {
			// Bandaid
			;(async () => {
				// this should only run on initial load of the state when this function is called
				this.instance().runtime.log(
					'info',
					`Persisting ${this._internalStore._name}`
				)
				this.instance().storage?.monitor(this._internalStore._name, this)
				const storedValue = (await this.instance().storage?.get(
					this._internalStore._name
				)) as PlexusWatchableValueInterpreter<StateValue>
				storedValue && this.set(storedValue)
				this._internalStore._persist = true
			})()
		}
		return this
	}

	/**
	 * Reset the state to the initial value
	 */
	reset() {
		this.set(this._watchableStore._initialValue)
		// disable history if enabled
		super.history(0)
		return this
	}
	/**
	 * On a set interval, run a function to update the state
	 * @param setterFunction The function used to update the state on the interval; returns the new value
	 * @param ms The interval duration (in milliseconds)
	 */
	interval(
		intervalCallback: (
			value: PlexusWatchableValueInterpreter<StateValue>
		) =>
			| PlexusWatchableValueInterpreter<StateValue>
			| Promise<PlexusWatchableValueInterpreter<StateValue>>
			| void,
		ms?: number
	) {
		if (this._internalStore._interval)
			clearInterval(this._internalStore._interval)
		this._internalStore._interval = setInterval(() => {
			const res = intervalCallback(this.value)
			if (res instanceof Promise) {
				res.then((value) => this.set(value)).catch((err) => console.error(err))
			} else if (res) {
				this.set(res)
			}
		}, ms ?? 3000)
		return this
	}
	/**
	 * Stop the state interval
	 */
	clearInterval() {
		if (this._internalStore._interval)
			clearInterval(this._internalStore._interval)
		return this
	}
	/**
	 * Set the name of the state for internal tracking
	 */
	set name(name: string) {
		this._internalStore._name = `state_${name}`
	}
	/**
	 * The name of the state (NOTE: set with the `.name(name)` function)
	 */
	get name() {
		return this._internalStore._name
	}
	/**
	 * Set the key of the state for internal tracking
	 * @deprecated
	 */
	key(key: string) {
		this._internalStore._name = `state_${key}`
		return this
	}
	/**
	 * The value of the state
	 */
	get value() {
		this.instance().runtime.log(
			'debug',
			`Accessing Stateful value ${this.instanceId}${
				this._internalStore._persist ? '; Persist Enabled' : ''
			}`
		)
		this.mount()
		this.syncPersistToValue()
		return super.value
	}
	/**
	 * The previous (reactive) value of the state
	 */
	get lastValue() {
		return deepClone(this._watchableStore._lastValue)
	}

	get watcherRemovers() {
		return this.instance().runtime.getWatchers(this.id)
	}
	/**
	 * The next value to apply to the state
	 * This is normally managed internally, but you can use it to "prepare" the state before applying the value.
	 * @example state.nextValue = { foo: "bar" };
	 * state.set(); // The state will be { foo: "bar" }
	 */
	get nextValue() {
		return this._watchableStore._nextValue
	}
	set nextValue(value: PlexusWatchableValueInterpreter<StateValue>) {
		this._watchableStore._nextValue = value
	}
	/**
	 * The initial (default) value of the state
	 */
	get initialValue() {
		return deepClone(this._watchableStore._initialValue)
	}
}

export function _state<StateValue>(
	instance: () => PlexusInstance,
	_init: StateValue
) {
	// Returned Object //
	return new StateInstance(instance, _init)
}

// export function state<
// 	Literal extends PlexusStateType = any,
// 	Value extends PlexusStateType = Literal extends AlmostAnything
// 		? Literal
// 		: TypeOrReturnType<Literal>
// >(item: Fetcher<Value>): TypeOrReturnType<Value>

// export function state<
// 	Literal extends PlexusStateType = any,
// 	Value extends PlexusStateType = Literal extends AlmostAnything
// 		? Literal
// 		: TypeOrReturnType<Literal>
// >(item: Value): StateInstance<Value>

/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function state<
	Override extends PlexusValidStateTypes = never,
	Value = Override extends AlmostAnything ? Override : any
>(item: Value) {
	return _state(() => instance(), item)
}
