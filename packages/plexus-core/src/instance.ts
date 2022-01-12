import { PlexusInstance } from "./interfaces";
import { _runtime } from "./runtime";
import { storage } from "./storage";



export function _instance(): PlexusInstance {
	const _internalStore = {
		_nonce: 0,
		runtime: _runtime(() => _instance())
	}
	if(globalThis.__plexusInstance__ === undefined){
		globalThis.__plexusInstance__ = {
			ready: false,
			genNonce(){
				_internalStore._nonce = ++_internalStore._nonce
				return _internalStore._nonce
			},
			_runtime: _internalStore.runtime,
			_computedStates: new Set(),
			_states: new Set(),
			_collections: new Set(),
			_settings: {},
			_storage: storage(() => (this))
		} as PlexusInstance
	}
	return globalThis.__plexusInstance__ as PlexusInstance

}