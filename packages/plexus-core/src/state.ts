import { deepClone, deepMerge, isObject } from './helpers'
import { PlexusInstance, PlexStateInternalStore, PxState, PxStateType, PxStateInstance, PxStateWatcher } from "./interfaces"

export function _state<PxStateValue extends PxStateType>(instance: () => PlexusInstance, _init: PxStateValue): PxStateInstance<PxStateValue> {

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
	function set(value: PxStateValue) {
		// TODO: this needs to check if the given type is an object/array. If so we need to deep clone the object/array
		// -> if (isObject(_internalStore._value) && isObject(value)) value = deepMerge(_internalStore._value, value);
		// That being said, shouldn't we only deepmerge objects from a .patch function, and not .set ?

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

	function watch(callback: PxStateWatcher<PxStateValue>)
	function watch(key: string | number, callback: PxStateWatcher<PxStateValue>)
	function watch(keyOrCallback: string | number | PxStateWatcher<PxStateValue>,  callback?: PxStateWatcher<PxStateValue>) {
		if(typeof keyOrCallback === 'function'){
			callback = keyOrCallback
			// generate a nonce from global instance
			keyOrCallback = `_plexus_state_watcher_${instance().genNonce()}`
		}

		// add to internal list of named watchers
		const destroy = instance()._runtime.subscribe(_internalStore._name, callback)
		_internalStore._watchers.set(keyOrCallback, destroy)
		return keyOrCallback
	}
	function removeWatcher(key: string | number){
		// instance()._runtime.unsubscribe(_internalStore._name, key)
		const destroy = _internalStore._watchers.get(key)
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

	function persist(name?: string ){
		// if there is a name, change the states internal name 
		if(name) _internalStore.externalName = `_plexus_state_${name}`

		if(instance().storage){ 
			instance().storage.set(_internalStore.externalName, _internalStore._value)
			_internalStore._persist = true
		}

	}

	function undo(){
		set(_internalStore._lastValue)
	}

	function reset(){
		set(_internalStore._initialValue)
	}
	

	const state = {
		set,
		patch,
		watch,
		removeWatcher,
		undo,
		reset,
		persist,
		get value() {
			return _internalStore._value
		},
		get lastValue(){
			return _internalStore._lastValue
		},
		get name(){
			return _internalStore._name
		},
		get watchers(){
			return instance()._runtime.getWatchers(_internalStore.externalName)
		}
	}


	// initalization //
	if (instance()._states.has(this)) {
		instance()._states.delete(this)
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._states.set(_internalStore._name+"", state)


	return state
}