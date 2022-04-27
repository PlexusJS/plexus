import { AlmostAnything, convertToString, deepClone, deepMerge, hash, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { PlexusWatcher } from "./interfaces"
import { WatchableValue } from "./watchable"
// import { PlexusInstance, PlexStateInternalStore, PlexusStateType, PlexusStateInstance, PlexusWatcher } from "./interfaces"
export type PlexusStateType = AlmostAnything | null
export type PlexusState = <PxStateValue = any>(instance: () => PlexusInstance, input: PxStateValue) => PlexusStateInstance<PxStateValue>

type DestroyFn = () => void

export interface StateStore<Value> {
	_initialValue: Value
	_lastValue: Value
	_value: Value
	_nextValue: Value
	_watchers: Set<DestroyFn>
	_name: string
	_persist: boolean
	_interval: NodeJS.Timer | null
	_internalId: string
	_ready: boolean
}
export type PlexusStateInstance<Value extends PlexusStateType = any> = StateInstance<Value>
/**
 * A trackable State
 */
export class StateInstance<StateValue extends PlexusStateType> extends WatchableValue<StateValue> {
	private _internalStore: StateStore<StateValue>
	private instance: () => PlexusInstance
	constructor(instance: () => PlexusInstance, init: StateValue) {
		super(instance, init)
		this.instance = instance
		this._internalStore = {
			_internalId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
			_nextValue: init,
			_value: init,
			_initialValue: init,
			_lastValue: init,
			_watchers: new Set<DestroyFn>(),
			_name: "",
			_persist: false,
			_interval: null,
			_ready: false,
		}
	}
	private mount() {
		if (!this.instance()._states.has(this)) {
			this.instance().runtime.log(
				"info",
				`Hoisting state ${this._internalStore._internalId} with value ${this._internalStore._value} to instance`
			)
			this.instance()._states.add(this)
			this.instance().storage?.sync()
		}
	}
	/**
	 * Set the value of the state
	 * @param value A value of the state to merge with the current value
	 */
	set(value?: StateValue) {
		this._internalStore._lastValue = this._internalStore._value
		if (isObject(value) && isObject(this._internalStore._value)) {
			this._internalStore._lastValue = deepClone(this._internalStore._value)
		} else if (Array.isArray(value) && Array.isArray(this._internalStore._value)) {
			const obj = deepMerge(this._internalStore._value, value)
			this._internalStore._lastValue = Object.values(obj) as StateValue
		} else {
			this._internalStore._lastValue = this._internalStore._value
		}
		// apply the next value
		if (value === undefined) {
			this._internalStore._value = this._internalStore._nextValue
		} else {
			this._internalStore._value = value
		}
		this._internalStore._nextValue = deepClone(this._internalStore._value)

		// update the runtime conductor
		if (this._internalStore._persist) this.instance().storage?.set(this._internalStore._name, this._internalStore._value)
		this.mount()
		this.instance().runtime.broadcast(this._internalStore._internalId, value, { type: "state" })
	}
	/**
	 * Patch the current value of the state
	 * @param value A value of the state to merge with the current value
	 */
	patch(value: StateValue) {
		if (isObject(value) && isObject(this._internalStore._value)) {
			this.set(deepMerge(this._internalStore._value, value))
		}
		// if the deep merge is on an array type, we need to convert the merged object back to an array
		else if (Array.isArray(value) && Array.isArray(this._internalStore._value)) {
			const obj = deepMerge(this._internalStore._value, value)
			this.set(Object.values(obj) as StateValue)
		} else {
			this.set(value)
		}
		if (this._internalStore._persist) this.instance().storage?.set(this._internalStore._name, this._internalStore._value)
	}
	/**
	 * Watch for changes on this state
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<StateValue>): () => void {
		// if (typeof keyOrCallback === "function") {
		// 	callback = keyOrCallback
		// 	// generate a nonce from global instance
		// 	keyOrCallback = `_plexus_state_watcher_${hash(convertToString(callback))}`
		// }

		// add to internal list of named watchers
		const destroyer = this.instance().runtime.subscribe(this._internalStore._internalId, callback, { type: "state" })
		this._internalStore._watchers.add(destroyer)
		// return keyOrCallback
		return () => {
			this._internalStore._watchers.delete(destroyer)
			// this.watcherRemovers.value
		}
	}

	// removeAllWatchers(){
	// 	// instance().runtime.unsubscribe(_internalStore._name, key)
	// 	_internalStore._watchers.forEach(destroy => {
	// 		if(destroy) destroy()
	// 	})
	// 	return _internalStore._watchers.clear()
	// },

	/**
	 * Persist the state to selected storage
	 * @param name The storage prefix to use
	 */
	persist(name: string) {
		// if there is a name, change the states internal name
		if (name) this._internalStore._name = `state_${name}`

		if (this.instance().storage) {
			// this should only run on initial load of the state when this function is called
			this.instance().runtime.log("info", `Persisting ${this._internalStore._name}`)

			// if (storedValue !== undefined && storedValue !== null) {
			// 	instance().runtime.log("info", "apply persisted value")
			// 	this.set(storedValue)
			// }
			this.instance().storage?.monitor(this._internalStore._name, this)
			this._internalStore._persist = true
		}
		return this
	}
	/**
	 * Reset the state to the previous value
	 */
	undo() {
		this.set(this._internalStore._lastValue)
	}
	/**
	 * Reset the state to the initial value
	 */
	reset() {
		this.set(this._internalStore._initialValue)
	}
	/**
	 * On a set interval, run a function to update the state
	 * @param setterFunction The function used to update the state on the interval; returns the new value
	 * @param ms The interval duration (in milliseconds)
	 */
	interval(intervalCallback: (value: StateValue) => StateValue | Promise<StateValue> | void, ms?: number) {
		if (this._internalStore._interval) clearInterval(this._internalStore._interval)
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
		if (this._internalStore._interval) clearInterval(this._internalStore._interval)
		return this
	}
	/**
	 * Set the key of the state for internal tracking
	 */
	key(key: string) {
		this._internalStore._name = `state_${key}`
		return this
	}
	/**
	 * The value of the state
	 */
	get value() {
		// instance().runtime.log("info", `getting value; persist ${_internalStore._persist ? "enabled" : "disabled"}`)
		this.mount()
		// if (_internalStore._persist) {
		// 	let storedValue = instance().storage.get(_internalStore.externalName)
		// 	this.set(storedValue)
		// }

		return deepClone(this._internalStore._value)
	}
	/**
	 * The previous (reactive) value of the state
	 */
	get lastValue() {
		return deepClone(this._internalStore._lastValue)
	}
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	get name() {
		return this._internalStore._name
	}
	get watcherRemovers() {
		return this.instance().runtime.getWatchers(this._internalStore._internalId)
	}
	/**
	 * The next value to apply to the state
	 * This is normally managed internally, but you can use it to "prepare" the state before applying the value.
	 * @example state.nextValue = { foo: "bar" };
	 * state.set(); // The state will be { foo: "bar" }
	 */
	get nextValue() {
		return this._internalStore._nextValue
	}
	set nextValue(value: StateValue) {
		this._internalStore._nextValue = value
	}
	/**
	 * The initial (default) value of the state
	 */
	get initialValue() {
		return this._internalStore._initialValue
	}
}

export function _state<StateValue extends PlexusStateType>(instance: () => PlexusInstance, _init: StateValue) {
	// Returned Object //

	return new StateInstance<StateValue>(instance, _init)
}
