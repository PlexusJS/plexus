import { instance } from "./instance"
import { _state, PlexusStateInstance } from "./state"
import { _event, PlexusEventInstance } from "./event"
import { storage as _storage, StorageOverride } from "./storage"
import { PlexusPlugin, PlexusPluginConfig } from "./plugin"
import { _collection } from "./collection/collection"
import { PlexusCollectionGroup } from './collection/group';

import { PlexusCollectionConfig, PlexusCollectionInstance } from "./collection/collection"

/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function state<Value = any>(item: Value) {
	return _state(() => instance(), item)
}
/**
 * Create a new Storage Instance
 * @param name The name of the Storage Module
 * @param override The function overrides for the Storage Module, if omitted, defaults to localStorage
 * @returns A storage instance
 */
export function storage(name?: string, override?: StorageOverride) {
	return _storage(() => instance(), name, override)
}
/**
 * Create a new event Engine
 * @returns An Event Instance
 */
export function event<PayloadType = any>() {
	return _event<PayloadType>(() => instance())
}

/**
 * Create a new Collection Instance
 * @param config The configuration for the collection
 * @returns A collection Instance
 */
export function collection<Type extends { [key: string]: any }>(config?: PlexusCollectionConfig<Type>) {
	return _collection<Type>(() => instance(), config)
}
export {
	PlexusPlugin,
	PlexusPluginConfig,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusEventInstance,
	PlexusStateInstance,
	PlexusCollectionGroup
}
export { api, PlexusApi, PlexusApiConfig, PlexusApiRes } from "./api"
export { action, PlexusAction, PlexusActionHelpers } from "./action"

// TODO I don't think this is used or needed anywhere
function setCore<CoreObj = Record<string, any>>(coreObj: CoreObj) {}

export function usePlugin(plugin: PlexusPlugin) {
	plugin.init((name: string) => instance({ instanceId: name }))
	instance()._plugins.set(plugin.name, plugin)
}
