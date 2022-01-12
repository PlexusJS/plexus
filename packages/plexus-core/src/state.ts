import { deepMerge, isObject } from './helpers'
import { PlexusInstance, PlexStateInternalStore, PxState } from "./interfaces"

export const state = function<PlexStateValue=any>(instance: () => PlexusInstance, _init: PlexStateValue): PxState<PlexStateValue> {
	const _internalStore: PlexStateInternalStore<PlexStateValue> = {
		_nextValue: null,
		_value: _init,
		_lastValue: _init,
		_watchers: new Set()
	}
	// inital setup
	if (instance()._states.has(this)) {
		instance()._states.delete(this)
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._states.add(this)

	
	const set = function(value: PlexStateValue) {
		// TODO: this needs to check if the given type is an object/array. If so we need to deep clone the object/array
		// -> if (isObject(_internalStore._value) && isObject(value)) value = deepMerge(_internalStore._value, value);
		// That being said, shouldn't we only deepmerge objects from a .patch function, and not .set ?
		_internalStore._lastValue = _internalStore._value
		_internalStore._value = value
		if(_internalStore._watchers.size > 0){
			_internalStore._watchers.forEach(watcher => {
				watcher(value)
			})
			
		}
	}
	
	const watch = function(callback: (value: PlexStateValue) => void) {
		_internalStore._watchers.add(callback)
	}

	return {
		set,
		get value() {
			return _internalStore._value
		},
		get lastValue(){
			return _internalStore._lastValue
		}
	}
}