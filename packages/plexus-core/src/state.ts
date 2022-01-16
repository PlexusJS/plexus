import { deepClone, deepMerge, isObject } from './helpers'
import { PlexusInstance } from './instance'
// import { PlexusInstance, PlexStateInternalStore, PlexusStateType, PlexusStateInstance, PlexusStateWatcher } from "./interfaces"
export type PlexusStateType = Object | Array<unknown> | string | number | boolean | null | undefined 
export type PlexusState = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PlexusStateInstance<PxStateValue>
export type PlexusStateWatcher<V> = (value: V) => void
export type PlexusStateInstance<Value=any> = {
	
	set(item: Value): void;
	patch(item: Value): void;
	watch(callback: PlexusStateWatcher<Value>): () => void;
	watch(keyOrCallback: string | number | PlexusStateWatcher<Value>,  callback?: PlexusStateWatcher<Value>): () => void;
	removeWatcher(key: string|number): boolean
	undo(): void;
	reset(): void;
	persist(name?: string): void;
	value: Value;
	lastValue: Value;
	name: string | number;
	watchers: any
} 
// export type PlexusStateInstance<Value=any> = ReturnType<typeof _state>

type DestroyFn = () => void

export interface PlexStateInternalStore<Value> {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_nextValue: Value
	_watchers: Map<number | string, DestroyFn>
	_name: string | number
	_persist: boolean
	externalName: string
}

export function _state<PxStateValue extends PlexusStateType>(instance: () => PlexusInstance, _init: PxStateValue) {

	// props // 
	const _internalStore: PlexStateInternalStore<PxStateValue> = {
		_nextValue: null,
		_value: _init,
		_initialValue: _init,
		_lastValue: _init,
		_watchers: new Map(),
		_name: `_plexus_state_${instance().genNonce()}`,
		_persist: false,
		externalName: '',

	}
	
	// Methods //
	/**
	 * Set the value of the state
	 * @param value 
	*/
	function set(value: PxStateValue) {

		_internalStore._lastValue = _internalStore._value
		if(isObject(value) && isObject(_internalStore._value)) {
			_internalStore._lastValue = deepClone(_internalStore._value)
		}
		else if(Array.isArray(value) && Array.isArray(_internalStore._value)) {
			const obj = deepMerge(_internalStore._value, value)
			_internalStore._lastValue = (Object.values(obj) as PxStateValue)
		}
		else{
			_internalStore._lastValue = _internalStore._value
		}
		_internalStore._value = value
		_internalStore._nextValue = value

		// update the runtime conductor
		instance()._runtime.stateChange(_internalStore._name, value)
		if(_internalStore._persist) instance().storage.set(_internalStore.externalName, _internalStore._value)
	}
	/**
	 * Patch the current value of the state
	 * @param value 
	 */
	function patch(value: PxStateValue) {
		
		if(isObject(value) && isObject(_internalStore._value)) {
			set(deepMerge(_internalStore._value, value))
		}
		// if the deep merge is on an array type, we need to convert the merged objecct back to an array
		else if(Array.isArray(value) && Array.isArray(_internalStore._value)) {
			const obj = deepMerge(_internalStore._value, value)
			set(Object.values(obj) as PxStateValue)
		}
		else{
			set(value)
		}
		if(_internalStore._persist) instance().storage.set(_internalStore.externalName, _internalStore._value)

	}

	/**
	 * Watch for changes on this state
	 * @param callback 
	 * @returns 
	 */
	function watch(callback: PlexusStateWatcher<PxStateValue>): () => void
	/**
	 * Watch for changes on this state
	 * @param keyOrCallback 
	 * @param callback 
	 * @returns 
	 */
	function watch(key: string | number, callback: PlexusStateWatcher<PxStateValue>): () => void
	/**
	 * Watch for changes on this state
	 * @param keyOrCallback 
	 * @param callback 
	 * @returns 
	 */
	function watch(keyOrCallback: string | number | PlexusStateWatcher<PxStateValue>,  callback?: PlexusStateWatcher<PxStateValue>): () => void {
		if(typeof keyOrCallback === 'function'){
			callback = keyOrCallback
			// generate a nonce from global instance
			keyOrCallback = `_plexus_state_watcher_${instance().genNonce()}`
		}

		// add to internal list of named watchers
		const destroy = instance()._runtime.subscribe(_internalStore._name, "stateChange", callback)
		_internalStore._watchers.set(keyOrCallback, destroy)
		// return keyOrCallback
		return () => {
			
			removeWatcher(keyOrCallback as string | number)
		}
	}
	/**
	 * Remove a watcher from this state
	 * @param key 
	 * @returns 
	 */
	function removeWatcher(key: string | number){
		// instance()._runtime.unsubscribe(_internalStore._name, key)
		let destroy = _internalStore._watchers.get(key)
		// if(!destroy) destroy = _internalStore._watchers.get(key.toString())
		if(destroy) destroy()
		return _internalStore._watchers.delete(key)

	}
	function removeAllWatchers(){
		// instance()._runtime.unsubscribe(_internalStore._name, key)
		_internalStore._watchers.forEach(destroy => {
			if(destroy) destroy()
		})
		return _internalStore._watchers.clear()
	}

	/**
	 * Persist the state to selected storage
	 * @param name 
	 */
	function persist(name?: string ){
		// if there is a name, change the states internal name 
		if(name) _internalStore.externalName = `_plexus_state_${name}`

		if(instance().storage){ 
			instance().storage.set(_internalStore.externalName, _internalStore._value)
			_internalStore._persist = true
		}

	}

	/**
	 * Reset the state to the previous value
	 */
	function undo(){
		set(_internalStore._lastValue)
	}

	/**
	 * Reset the state to the initial value
	 */
	function reset(){
		set(_internalStore._initialValue)
	}
	

	const state = Object.freeze({
		
		set,
		patch,
		watch,
		removeWatcher,
		undo,
		reset,
		persist,
		get value() {
			return deepClone(_internalStore._value)
		},
		get lastValue(){
			return deepClone(_internalStore._lastValue)
		},
		get name(){
			return _internalStore._name
		},
		get watchers(){
			return instance()._runtime.getWatchers(_internalStore.externalName)
		}
	})


	// initalization //
	if (instance()._states.has(_internalStore._name+"")) {
		instance()._states.delete(_internalStore._name+"")
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._states.set(_internalStore._name+"", state)
	

	return state
}