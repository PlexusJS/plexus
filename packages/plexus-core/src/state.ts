import { AlmostAnything, convertThingToString, deepClone, deepMerge, hash, isEqual, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { PlexusWatcher } from "./interfaces"
import { WatchableMutable } from "./watchable"
// import { PlexusInstance, PlexStateInternalStore, PlexusStateType, PlexusStateInstance, PlexusWatcher } from "./interfaces"
export type PlexusStateType = AlmostAnything | null
export type PlexusState = <PxStateValue = any>(instance: () => PlexusInstance, input: PxStateValue) => StateInstance<PxStateValue>

type DestroyFn = () => void

export interface StateStore<Value> {
	_name: string
	_persist: boolean
	_interval: NodeJS.Timer | null
	_ready: boolean
}
export type PlexusStateInstance<Value extends PlexusStateType = any> = StateInstance<Value>
/**
 * A trackable State
 */
export class StateInstance<StateValue extends PlexusStateType> extends WatchableMutable<StateValue> {
	private _internalStore: StateStore<StateValue>
	// private instance: () => PlexusInstance
	/**
	 * The internal id of the state
	 */
	get id(): string {
		// return this._internalStore._internalId
		return `${this._watchableStore._internalId}`
	}
	/**
	 * The internal id of the state with an instance prefix
	 */
	get instanceId(): string {
		// return this._internalStore._internalId
		return `ste_${this._watchableStore._internalId}`
	}
	constructor(instance: () => PlexusInstance, init: StateValue) {
		super(instance, init)
		this.instance = instance
		this._internalStore = {
			_name: "",
			_persist: false,
			_interval: null,
			_ready: false,
		}

		this.mount()
		if (this._internalStore._persist) {
			this.instance().storage?.sync()
		}
	}
	private mount() {
		if (!this.instance()._states.has(this)) {
			this.instance()._states.add(this)
			this.instance().runtime.log("debug", `Hoisting state ${this.instanceId} with value`, this._watchableStore._value, `to instance`)
			if (this._internalStore._persist) {
				this.instance().storage?.sync()
			}
		}
		if (this._internalStore._ready) return
		this._internalStore._ready = true
		this.instance().runtime.log("info", `State ${this.id} is ready`)
		// this.instance().runtime.broadcast(this.id, this._watchableStore._value)
	}
	/**
	 * Set the value of the state
	 * @param value A value of the state to merge with the current value
	 */
	set(value?: StateValue) {
		super.set(value)
		if (this._internalStore._persist) this.instance().storage?.set(this._internalStore._name, this._watchableStore._value)
		return this
	}
	/**
	 * Patch the current value of the state
	 * @param value A value of the state to merge with the current value
	 */
	patch(value: StateValue) {
		if (isObject(value) && isObject(this._watchableStore._value)) {
			this.set(deepMerge(this._watchableStore._value, value))
		}
		// if the deep merge is on an array type, we need to convert the merged object back to an array
		else if (Array.isArray(value) && Array.isArray(this._watchableStore._value)) {
			const obj = deepMerge(this._watchableStore._value, value)
			this.set(Object.values(obj) as StateValue)
		} else {
			this.set(value)
		}
		if (this._internalStore._persist) this.instance().storage?.set(this._internalStore._name, this._watchableStore._value)

		return this
	}
	/**
	 * Watch for changes on this state
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<StateValue>, from?: string): () => void {
		const destroyer = super.watch(callback, from)
		return () => {
			this.instance().runtime.log("info", `Killing a watcher from state ${this.instanceId}`)
			destroyer()
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
		this.set(this._watchableStore._lastValue)
	}
	/**
	 * Reset the state to the initial value
	 */
	reset() {
		this.set(this._watchableStore._initialValue)
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
	 * Compare a thing to the current value, if they are equal, returns true
	 * @param value The thing to compare the current value to
	 * @returns {boolean} A boolean representing if they are equal
	 */
	isEqual(value: any) {
		return isEqual(value as any, this._watchableStore._value as any)
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
		this.instance().runtime.log("debug", `Accessing Stateful value ${this.instanceId}${this._internalStore._persist ? "; Persist Enabled" : ""}`)
		this.mount()
		return super.value
	}
	/**
	 * The previous (reactive) value of the state
	 */
	get lastValue() {
		return deepClone(this._watchableStore._lastValue)
	}
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	get name() {
		return this._internalStore._name
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
	set nextValue(value: StateValue) {
		this._watchableStore._nextValue = value
	}
	/**
	 * The initial (default) value of the state
	 */
	get initialValue() {
		return deepClone(this._watchableStore._initialValue)
	}
}

export function _state<StateValue extends PlexusStateType>(instance: () => PlexusInstance, _init: StateValue) {
	// Returned Object //

	return new StateInstance<StateValue>(instance, _init)
}
