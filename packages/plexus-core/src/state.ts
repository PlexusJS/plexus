import { deepMerge, isObject } from './helpers'
import { PlexusInstance, PlexStateInternalStore, PxState, PxStateType, PxStateWathcer, PxStateInstance } from "./interfaces"

export function state<PxStateValue extends PxStateType>(instance: () => PlexusInstance, _init: PxStateValue): PxStateInstance<PxStateValue> {

	// props // 
	const _internalStore: PlexStateInternalStore<PxStateValue> = {
		_nextValue: null,
		_value: _init,
		_initialValue: _init,
		_lastValue: _init,
		_watchers: new Map()
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
		_internalStore._lastValue = _internalStore._value
		_internalStore._value = value

		// if there are watchers, call them
		if(_internalStore._watchers.size > 0){
			_internalStore._watchers.forEach(watcher => {
				watcher(value)
			})
		}
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
			keyOrCallback = instance().genNonce()
		}

		_internalStore._watchers.set(keyOrCallback, callback)
	}
	function removeWatcher(key: string | number){
		return _internalStore._watchers.delete(key)
	}

	function persist(){

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
		get value() {
			return _internalStore._value
		},
		get lastValue(){
			return _internalStore._lastValue
		}
	}
}