import { StateInstance } from "./state"
import { PlexusPlugin } from "./plugin"
import { PlexusRuntime, RuntimeInstance, _runtime } from "./runtime"
import { PlexusStorageInstance, storage } from "./storage"
import { PlexusCollectionInstance } from "."
import { CollectionInstance } from "./collection/collection"

const getInstanceName = (name: string = "default") => `__plexusInstance__${name.length > 0 ? name : "default"}__`
interface PlexusInstanceStore {
	_nonce: number
	_id: string
	_selectedStorage: string | undefined
	_settings: Partial<PlexusInstanceConfig>
	_ready: boolean
}
export class PlexusInstance {
	private _internalStore: PlexusInstanceStore
	runtime: RuntimeInstance

	_computedStates = new Set<any>()
	_states = new Set<StateInstance<any>>()
	_plugins = new Map<string, PlexusPlugin>()
	_collections = new Set<CollectionInstance<any, any, any>>()
	_storages = new Map<string, PlexusStorageInstance>()

	_mounted = new Map<string, any>()

	constructor(config?: Partial<PlexusInstanceConfig>) {
		this._internalStore = {
			_nonce: 0,
			_id: config?.instanceId || ``,
			_selectedStorage: undefined,
			_settings: { ...config },
			_ready: false,
		}
		this.runtime = _runtime(() => instance(), { logLevel: this._internalStore._settings?.logLevel })
	}
	get name() {
		return this._internalStore._id || "default"
	}
	get internalName() {
		return getInstanceName(this._internalStore._id)
	}
	get ready() {
		return this._internalStore._ready
	}
	set ready(isReady: boolean) {
		this._internalStore._ready = isReady
	}
	get settings() {
		return this._internalStore._settings
	}
	set settings(settings: Partial<PlexusInstanceConfig>) {
		this._internalStore._settings = { ...this._internalStore._settings, ...settings }
	}
	get storageEngine() {
		return this._internalStore._selectedStorage
	}
	set storageEngine(name: string | undefined) {
		if (name) {
			this._internalStore._selectedStorage = name
		}
	}
	get storage() {
		const storageName = getPlexusInstance(this._internalStore._id).storageEngine
		if (storageName) return getPlexusInstance(this._internalStore._id)._storages.get(storageName)
	}
	genNonce() {
		this._internalStore._nonce += 1
		return this._internalStore._nonce
	}

	/**
	 * Get the correctly formatted instance name
	 * @returns The formatted name of the instance
	 */
}

interface PlexusInstanceConfig {
	instanceId: string
	logLevel: "debug" | "warn" | "error" | "silent"
}
interface PlexusMaster {
	_ready: false
	_instances: Map<string, () => PlexusInstance>
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
export const getPlexusInstance = (name: string = "default") => globalThis[getInstanceName(name)] as PlexusInstance

/**
 * Generate a new instance of PlexusJS
 * @param config The configuration for the instance
 * @returns An instance of PlexusJS
 */
export function instance(config?: Partial<PlexusInstanceConfig>): PlexusInstance {
	// if the master is not created, create it
	if (globalThis["__plexusMaster__"] === undefined) {
		const plexusMaster: PlexusMaster = {
			_ready: false,
			_instances: new Map<string, () => PlexusInstance>(),
		}
		globalThis["__plexusMaster__"] = plexusMaster
	}
	const instanceName = getInstanceName(config?.instanceId)
	// if the instance is not created, create it
	if (globalThis[instanceName] === undefined) {
		// const _internalStore = {
		// 	_nonce: 0,
		// 	_id: config?.instanceId || ``,
		// 	_selectedStorage: undefined as string | undefined,
		// 	_settings: { ...config },
		// 	_ready: false,
		// }
		const newInstance: PlexusInstance = new PlexusInstance(config)

		globalThis[instanceName] = newInstance
		// add the instance to the master
		getPlexusMasterInstance()._instances.set(instanceName, () => getPlexusInstance(newInstance.name))

		// initial instance configuration, do all pre-init stuff here
		getPlexusInstance(newInstance.name)._storages.set(
			"default",
			storage(() => instance())
		)
		getPlexusInstance(newInstance.name).storageEngine = "default"

		// instance is done initializing
		getPlexusInstance(newInstance.name).ready = true

		getPlexusInstance(newInstance.name).runtime.log("info", "Instance initialized")
	}
	// return the instance
	return getPlexusInstance(config?.instanceId || "") as PlexusInstance
}
