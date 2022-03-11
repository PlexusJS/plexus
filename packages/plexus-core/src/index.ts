import { instance } from "./instance"
import { _state, PlexusStateInstance } from "./state"
import { _event, PlexusEventInstance } from "./event"
import { storage as _storage, StorageOverride } from "./storage"
import { PlexusPlugin, PlexusPluginConfig } from "./plugin"
import {
	_collection,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusCollectionSelector,
	PlexusCollectionGroup,
} from "./collection/collection"
import { PlexusInstance } from "./instance"
import { _computed, PlexusComputedStateInstance } from "./computed"
import { Watchable } from "./interfaces"

/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function state<Value = any>(item: Value) {
	return _state(() => instance(), item)
}
/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
 */
export function computed<Value = any>(item: (value?: Value) => Value, dependencies: Array<Watchable> | Watchable) {
	if (!Array.isArray(dependencies)) {
		return _computed(() => instance(), item, [dependencies])
	}
	return _computed(() => instance(), item, dependencies)
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
	PlexusCollectionGroup,
	PlexusCollectionSelector,
	PlexusComputedStateInstance,
	PlexusInstance,
}
export { api, PlexusApi, PlexusApiConfig, PlexusApiRes } from "./api"
export { action, PlexusAction, PlexusActionHelpers } from "./action"
export { gql } from './gql';

// TODO I don't think this is used or needed anywhere, so I'm not exporting this yet
function setCore<CoreObj = Record<string, any>>(coreObj: CoreObj) {}

export function usePlugin(plugin: PlexusPlugin) {
	plugin.init((name: string) => instance({ instanceId: name }))
	instance()._plugins.set(plugin.name, plugin)
}

export { instance }
