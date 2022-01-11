import { PlexusInstance } from './interfaces'
import { state as _state } from './state'

const instance: PlexusInstance = {
	_computedStates: new Set(),
	_states: new Set(),
	_collections: new Set(),
	_settings: {}
}
export function state<Value=any>(item: Value) {
	return _state(() => instance, item)
}

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}