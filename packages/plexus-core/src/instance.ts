import { PlexusStateInstance } from "./state"
import { PlexusPlugin } from "./plugin"
import { PlexusRuntime, _runtime } from "./runtime"
import { PlexusStorageInstance, storage } from "./storage"
import { PlexusCollectionInstance } from "."
export interface PlexusInstance {
	name: string
	internalName: string
	ready: boolean
	genNonce(): number | string
	genNonce(): number | string
	_states: Set<PlexusStateInstance>
	_plugins: Map<string, PlexusPlugin>
	_runtime: PlexusRuntime
	_computedStates: Set<any>
	_collections: Map<string, PlexusCollectionInstance>
	settings: Partial<PlexusInstanceConfig>
	get storageEngine(): string | undefined
	set storageEngine(name: string)
	_storages: Map<string, PlexusStorageInstance>
	get storage(): PlexusStorageInstance
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
export const getPlexusInstance = (name?: string) => globalThis[`__plexusInstance__${name ? name + "__" : ""}`] as PlexusInstance

/**
 * Generate a new instance of PlexusJS
 * @param config The configuration for the instance
 * @returns An instance of PlexusJS
 */
export function instance(config?: Partial<PlexusInstanceConfig>): PlexusInstance {
	/**
	 * Get the correctly formatted instance name
	 * @returns The formatted name of the instance
	 */
	const getInstanceName = (name?: string) => `__plexusInstance__${name ? name + "__" : ""}`

	// if the master is not created, create it
	if (globalThis["__plexusMaster__"] === undefined) {
		const plexusMaster: PlexusMaster = {
			_ready: false,
			_instances: new Map<string, () => PlexusInstance>(),
		}
		globalThis["__plexusMaster__"] = plexusMaster
	}

	// if the instance is not created, create it
	if (globalThis[getInstanceName()] === undefined) {
		const _internalStore = {
			_nonce: 0,
			_id: config?.instanceId || ``,
			_selectedStorage: undefined,
			_settings: { ...config },
			_ready: false,
		}
		const newInstance: PlexusInstance = Object.freeze({
			get name() {
				return _internalStore._id || "default"
			},
			get internalName() {
				return getInstanceName()
			},
			get ready() {
				return _internalStore._ready
			},
			set ready(isReady: boolean) {
				_internalStore._ready = isReady
			},
			get settings() {
				return _internalStore._settings
			},
			set settings(settings: Partial<PlexusInstanceConfig>) {
				_internalStore._settings = { ..._internalStore._settings, ...settings }
			},
			get storageEngine() {
				return _internalStore._selectedStorage
			},
			set storageEngine(name: string) {
				_internalStore._selectedStorage = name
			},
			get storage() {
				return getPlexusInstance(_internalStore._id)._storages.get(getPlexusInstance(_internalStore._id).storageEngine)
			},
			genNonce() {
				_internalStore._nonce += 1
				return _internalStore._nonce
			},

			_runtime: _runtime(() => instance(), { logLevel: config?.logLevel }),
			_computedStates: new Set(),
			_states: new Set<PlexusStateInstance>(),
			_plugins: new Map(),
			_collections: new Map(),
			_storages: new Map(),
		})

		globalThis[getInstanceName()] = newInstance
		// add the instance to the master
		getPlexusMasterInstance()._instances.set(getInstanceName(), () => getPlexusInstance(_internalStore._id))

		// initial instance configuration, do all pre-init stuff here
		getPlexusInstance(_internalStore._id)._storages.set(
			"default",
			storage(() => instance())
		)
		getPlexusInstance(_internalStore._id).storageEngine = "default"

		// instance is done initializing
		getPlexusInstance(_internalStore._id).ready = true

		getPlexusInstance(_internalStore._id)._runtime.log("info", "Instance initialized")
	}
	// return the instance
	return getPlexusInstance(config?.instanceId || "") as PlexusInstance
}
