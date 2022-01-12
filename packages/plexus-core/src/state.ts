import { deepMerge, isObject } from './helpers'
import { PlexusInstance, PlexStateInternalStore, PxState, PxStateType, PxStateWathcer, PxStateInstance } from "./interfaces"

export function _state<PxStateValue extends PxStateType>(instance: () => PlexusInstance, _init: PxStateValue): PxStateInstance<PxStateValue> {

	// props // 
	const _internalStore: PlexStateInternalStore<PxStateValue> = {
		_nextValue: null,
		_value: _init,
		_initialValue: _init,
		_lastValue: _init,
		_watchers: new Set(),
		_name: `_plexus_state_${instance().genNonce()}`,
	}

	// initalization //
	if (instance()._states.has(this)) {
		instance()._states.delete(this)
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._states.add(this)

	
	// Methods //
	function set(value: PxStateValue) {
		// TODO: this needs to check if the given type is an object/array. If so we need to deep clone the object/array
		// -> if (isObject(_internalStore._value) && isObject(value)) value = deepMerge(_internalStore._value, value);
		// That being said, shouldn't we only deepmerge objects from a .patch function, and not .set ?
		
		// yes, we should only deepmerge in patch, not in set. Set should do a hard overwrite of the value.
		_internalStore._lastValue = _internalStore._value
		_internalStore._value = value
		_internalStore._nextValue = value

		// // if there are watchers, call them
		// if(_internalStore._watchers.size > 0){
		// 	_internalStore._watchers.forEach(watcher => {
		// 		instance()._runtime.runSideEffects(value)
		// 	})
		// }

		// update the runtime conductor
		instance()._runtime.stateChange(_internalStore._name, value)
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

	}

	function watch(callback: PxStateWathcer<PxStateValue>)
	function watch(key: string | number, callback: PxStateWathcer<PxStateValue>)
	function watch(keyOrCallback: string | number | PxStateWathcer<PxStateValue>,  callback?: PxStateWathcer<PxStateValue>) {
		if(typeof keyOrCallback === 'function'){
			callback = keyOrCallback
			// generate a nonce from global instance
			keyOrCallback = `_plexus_state_watcher_${instance().genNonce()}`
		}

		// add to internal list of named watchers
		_internalStore._watchers.add(keyOrCallback)
		instance()._runtime.subscribe(_internalStore._name, keyOrCallback, callback)
		return keyOrCallback
	}
	function removeWatcher(key: string | number){
		instance()._runtime.unsubscribe(_internalStore._name, key)
		return _internalStore._watchers.delete(key)

	}

	function persist(name?: string ){
		// if there is a name, change the states internal name 
		if(name) _internalStore._name = `_plexus_state_${name}`
		// instance()._runtime.persist(name, _internalStore._value)

	}

	function undo(){
		set(_internalStore._lastValue)
	}

	function reset(){
		set(_internalStore._initialValue)
	}
	

	return {
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
			return instance()._runtime.getWatchers(_internalStore._name)
		}
	}
}