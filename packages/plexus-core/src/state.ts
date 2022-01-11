import { PlexusInstance, PlexStateInternalStore } from "./interfaces"

export const state = function<PlexStateValue=any>(instance: () => PlexusInstance, _init: PlexStateValue) {
	const _internalStore: PlexStateInternalStore<PlexStateValue> = {
		_value: _init,
		_lastValue: _init
	}
	// inital setup
	if(instance()._states.has(this)){
		instance()._states.delete(this)
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._states.add(this)

	
	const set = function(value: PlexStateValue) {
		// TODO: this needs to check if the given type is an object/array. If so we need to deep clone the object/array
		_internalStore._lastValue = _internalStore._value
		_internalStore._value = value
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