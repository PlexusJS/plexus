import { PlexusInstance } from "./interfaces";
import { _runtime } from "./runtime";
import { storage } from "./storage";

interface PlexusInstanceConfig {
	instanceId: string
}
interface PlexusMaster {
	_ready: false,
	_instances: Map<string, () => PlexusInstance>,
}
/**
 * Get the master instance
 * @returns The master of PlexusJS; oversees all instances of PlexusJS
 */
export const getPlexusMasterInstance = () => globalThis.__plexusMaster__ as PlexusMaster

/**
 * Get the reference to the instance with a given name, if no name is provided, the master instance is returned
 * @param name (optional) The name of the instance
 * @returns If no name, returns the main instance of PlexusJS, otherwise returns the instance with the given name (ex. a plugins instance)
 */
export const getPlexusInstance = (name?: string) => globalThis[`__plexusInstance__${name ? name+'__' : ''}`] as PlexusInstance

/**
 * Generate a new instance of PlexusJS
 * @param config The configuration for the instance
 * @returns An instance of PlexusJS
 */
export function instance(config?: Partial<PlexusInstanceConfig>): PlexusInstance {
	const _internalStore = {
		_nonce: 0,
		_id: config.instanceId || ``,
	}
	/**
	 * Get the correctly formatted instance name
	 * @returns The formatted name of the instance
	 */
	const getInstanceName = () => `__plexusInstance__${_internalStore._id ? _internalStore._id+'__' : ''}`

	// if the master is not created, create it
	if(globalThis['__plexusMaster__'] === undefined){
		const plexusMaster: PlexusMaster = {
			_ready: false,
			_instances: new Map<string, () => PlexusInstance>(),
		}
		globalThis['__plexusMaster__'] = plexusMaster
	}

	// if the instance is not created, create it
	if(globalThis[getInstanceName()] === undefined){
		const newInstance: PlexusInstance = Object.freeze({
			ready: false,
			genNonce(){
				_internalStore._nonce = ++_internalStore._nonce
				return _internalStore._nonce
			},
			_runtime: _runtime(() => instance()),
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
		})
		
		globalThis[getInstanceName()] = newInstance
		// add the instance to the master
		getPlexusMasterInstance()._instances.set(getInstanceName(), () => getPlexusInstance(getInstanceName()))

		// initail instance configuration, do all pre-init stuff here
		getPlexusInstance(getInstanceName())._storages.set('default', storage(() => instance()))
		getPlexusInstance(getInstanceName()).storageEngine = 'default'

		// instance is done initializing
		getPlexusInstance(getInstanceName()).ready = true
	}
	// return the instance
	return globalThis[getInstanceName()] as PlexusInstance

}