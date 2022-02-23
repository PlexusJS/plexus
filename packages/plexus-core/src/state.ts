import { convertToString, deepClone, deepMerge, hash, isObject } from "./helpers"
import { PlexusInstance } from "./instance"
import { PlexusWatcher } from "./interfaces"
// import { PlexusInstance, PlexStateInternalStore, PlexusStateType, PlexusStateInstance, PlexusWatcher } from "./interfaces"
export type PlexusStateType = Object | Array<unknown> | string | number | boolean | null | undefined
export type PlexusState = <PxStateValue = any>(
	instance: () => PlexusInstance,
	input: PxStateValue
) => PlexusStateInstance<PxStateValue>

export interface PlexusStateInstance<Value = any> {
	/**
	 * The value of the state
	 */
	value: Value
	/**
	 * The previous (reactive) value of the state
	 */
	lastValue: Value
	/**
	 * The initial (default) value of the state
	 */
	initialValue: Value
	/**
	 * The next value to apply to the state
	 * This is normally managed internally, but you can use it to "prepare" the state before applying the value.
	 * @example state.nextValue = { foo: "bar" };
	 * state.set(); // The state will be { foo: "bar" }
	 */
	nextValue: Value
	/**
	 * The name of the state (NOTE: set with the `.key()` function)
	 */
	name: string
	/**
	 * Set the value of the state
	 * @param value A value of the state to merge with the current value
	 */
	set(value?: Value): void
	/**
	 * Patch the current value of the state
	 * @param value A value of the state to merge with the current value
	 */
	patch(value: Value): void
	/**
	 * Watch for changes on this state
	 * @param key (optional) The key to use to identify this watcher
	 * @param callback The callback to run when the state changes
	 * @returns The remove function to stop watching
	 */
	watch(callback: PlexusWatcher<Value>): () => void
	watch(keyOrCallback: string | number | PlexusWatcher<Value>, callback?: PlexusWatcher<Value>): () => void
	// /**
	//  * Remove a watcher from this state
	//  * @param key The key used to create the watcher
	//  * @returns true if the watcher was removed, false otherwise
	//  */
	// removeWatcher(key: string | number): boolean
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
	/**
	 * Persist the state to selected storage
	 * @param name The storage prefix to use
	 */
	persist(name: string): this

	/**
	 * On a set interval, run a function to update the state
	 * @param setterFunction The function used to update the state on the interval; returns the new value
	 * @param ms The interval duration (in milliseconds)
	 */
	interval(setterFunction: (value: Value) => Value, ms?: number): this
	/**
	 * Stop the state interval
	 */
	clearInterval(): this
	watcherRemovers: any
}
// export type PlexusStateInstance<Value=any> = ReturnType<typeof _state>

type DestroyFn = () => void

export interface PlexStateInternalStore<Value> {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_nextValue: Value
	_watchers: Map<number | string, DestroyFn>
	_name: string
	_persist: boolean
	_interval: NodeJS.Timer | null
	_internalId: string
	externalName: string
}

export function _state<StateValue extends PlexusStateType>(instance: () => PlexusInstance, _init: StateValue) {
	// props //
	const _internalStore: PlexStateInternalStore<StateValue> = {
		_internalId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
		_nextValue: null,
		_value: _init,
		_initialValue: _init,
		_lastValue: _init,
		_watchers: new Map(),
		_name: "",
		_persist: false,
		_interval: null,
		externalName: "",
	}

	// Methods //
	const mount = () => {
		if (_internalStore._name === "") {
			instance()._runtime.log("warn", "State is not keyed, it will not be mounted to the instance")
			return
		}
		if (instance()._states.has(`${_internalStore._name}`)) {
			instance()._states.delete(`${_internalStore._name}`)
		}

		instance()._states.set(`${_internalStore._name}`, state)
	}
	const removeWatcher = (key: string | number) => {
		// instance()._runtime.unsubscribe(_internalStore._name, key)
		let destroy = _internalStore._watchers.get(key)
		// if (!destroy) destroy = _internalStore._watchers.get(key.toString())
		destroy?.()
		return _internalStore._watchers.delete(key)
	}
	// Returned Object //
	const state: PlexusStateInstance<StateValue> = Object.freeze({
		set(value?: StateValue) {
			_internalStore._lastValue = _internalStore._value
			if (isObject(value) && isObject(_internalStore._value)) {
				_internalStore._lastValue = deepClone(_internalStore._value)
			} else if (Array.isArray(value) && Array.isArray(_internalStore._value)) {
				const obj = deepMerge(_internalStore._value, value)
				_internalStore._lastValue = Object.values(obj) as StateValue
			} else {
				_internalStore._lastValue = _internalStore._value
			}
			// apply the next value
			if (value === undefined) {
				_internalStore._value = _internalStore._nextValue
			} else {
				_internalStore._value = value
			}
			_internalStore._nextValue = deepClone(_internalStore._value)

			// update the runtime conductor
			instance()._runtime.broadcast(_internalStore._internalId, "state", value)
			if (_internalStore._persist) instance().storage.set(_internalStore.externalName, _internalStore._value)
		},

		patch(value: StateValue) {
			if (isObject(value) && isObject(_internalStore._value)) {
				this.set(deepMerge(_internalStore._value, value))
			}
			// if the deep merge is on an array type, we need to convert the merged object back to an array
			else if (Array.isArray(value) && Array.isArray(_internalStore._value)) {
				const obj = deepMerge(_internalStore._value, value)
				this.set(Object.values(obj) as StateValue)
			} else {
				this.set(value)
			}
			if (_internalStore._persist) instance().storage.set(_internalStore.externalName, _internalStore._value)
		},

		watch(
			keyOrCallback: string | number | PlexusWatcher<StateValue>,
			callback?: PlexusWatcher<StateValue>
		): () => void {
			if (typeof keyOrCallback === "function") {
				callback = keyOrCallback
				// generate a nonce from global instance
				keyOrCallback = `_plexus_state_watcher_${hash(convertToString(callback))}`
			}

			// add to internal list of named watchers
			const destroy = instance()._runtime.subscribe(_internalStore._internalId, "state", callback)
			_internalStore._watchers.set(keyOrCallback, destroy)
			// return keyOrCallback
			return () => {
				removeWatcher(keyOrCallback as string | number)
				// this.watcherRemovers.value
			}
		},

		// removeAllWatchers(){
		// 	// instance()._runtime.unsubscribe(_internalStore._name, key)
		// 	_internalStore._watchers.forEach(destroy => {
		// 		if(destroy) destroy()
		// 	})
		// 	return _internalStore._watchers.clear()
		// },

		persist(name: string) {
			// if there is a name, change the states internal name
			if (name) _internalStore.externalName = `_plexus_state_${name}`

			if (instance().storage) {
				// this should only run on initial load of the state when this function is called
				this.set(instance().storage.get(_internalStore.externalName) ?? _internalStore._value)

				_internalStore._persist = true
			}
			return this
		},

		undo() {
			this.set(_internalStore._lastValue)
		},

		reset() {
			this.set(_internalStore._initialValue)
		},
		interval(intervalCallback: (value: StateValue) => StateValue, ms?: number) {
			if (_internalStore._interval) clearInterval(_internalStore._interval)
			_internalStore._interval = setInterval(() => {
				this.set(intervalCallback(this.value))
			}, ms ?? 3000)
			return this
		},
		clearInterval() {
			if (_internalStore._interval) clearInterval(_internalStore._interval)
			return this
		},
		key(key: string) {
			_internalStore._name = key
			mount()
			return this
		},
		get value() {
			return deepClone(_internalStore._value)
		},

		get lastValue() {
			return deepClone(_internalStore._lastValue)
		},
		get name() {
			return _internalStore._name
		},
		get watcherRemovers() {
			return instance()._runtime.getWatchers(_internalStore._internalId)
		},
		get nextValue() {
			return _internalStore._nextValue
		},
		get initialValue() {
			return _internalStore._initialValue
		},
		set nextValue(value: StateValue) {
			_internalStore._nextValue = value
		},
	})

	return state
}
