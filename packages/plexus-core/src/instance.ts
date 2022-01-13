import { PlexusInstance } from "./interfaces";
import { _runtime } from "./runtime";
import { storage } from "./storage";

export const getPlexusInstance = () => globalThis.__plexusInstance__ as PlexusInstance

export function _instance(): PlexusInstance {
	const _internalStore = {
		_nonce: 0,
	}
	if(globalThis.__plexusInstance__ === undefined){
		const globalInstance: PlexusInstance = {
			ready: false,
			genNonce(){
				_internalStore._nonce = ++_internalStore._nonce
				return _internalStore._nonce
			},
			_runtime: _runtime(() => _instance()),
			_computedStates: new Set(),
			_states: new Map(),
			_plugins: new Map(),
			_collections: new Map(),
			_settings: {},
			_storages: new Map(),
			storageEngine: undefined,
			get storage(){
				return (this as PlexusInstance)._storages.get((this as PlexusInstance).storageEngine)
			}
		}
		
		globalThis.__plexusInstance__ = globalInstance as PlexusInstance

		// alias fn for ts
		

		// initail instance configuration, do all pre-init stuff here
		getPlexusInstance()._storages.set('default', storage(() => _instance()))
		getPlexusInstance().storageEngine = 'default'

		// instance is done initializing
		getPlexusInstance().ready = true
	}
	return globalThis.__plexusInstance__ as PlexusInstance

}