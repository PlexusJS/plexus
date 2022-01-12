import { PlexusInstance } from "./interfaces";



export function _instance(){
	const _internalStore = {
		_nonce: 0,
	}
	if(globalThis.__plexusInstance__ === undefined){
		globalThis.__plexusInstance__ = {
			ready: false,
			genNonce(){
				_internalStore._nonce = ++_internalStore._nonce
				return _internalStore._nonce
			},
			_computedStates: new Set(),
			_states: new Set(),
			_collections: new Set(),
			_settings: {}
		} as PlexusInstance
	}
	return globalThis.__plexusInstance__

}