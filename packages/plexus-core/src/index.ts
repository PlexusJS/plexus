/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { instance, PlexusInstance, batch } from './instance/instance'
import { PlexusPlugin, Plugin, createPlexusPlugin } from './plugin'
import { PlexusScopeConfig } from './scope'

export { gql } from './gql'
export { scope, PlexusScopeConfig } from './scope'
export { WatchableMutable as WatchableValue, Watchable } from './watchable'
export { event, _event, PlexusEventInstance } from './event'
export { storage, _storage, StorageOverride } from './storage'
export { state, _state, PlexusStateInstance, StateInstance } from './state'
export { computed, _computed, PlexusComputedStateInstance } from './computed'
export { controller, ControllerInstance } from './instance/controller'
export { PlexusWatchableValueInterpreter } from '@plexusjs/utils'
export {
	action,
	_action,
	ActionFunction as FunctionType,
	PlexusAction,
	PlexusActionHooks,
	batchAction,
} from './action'
export {
	preaction,
	_preaction,
	PlexusPreAction,
	PlexusPreActionConfig,
	PreActionInstance,
} from './preaction'
export {
	api,
	PlexusApi,
	PlexusApiConfig,
	PlexusApiRes,
	ApiInstance,
} from '@plexusjs/api'
export {
	collection,
	_collection,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusCollectionSelector,
	PlexusCollectionGroup,
} from './collection/collection'

export function setGlobalCatch(catcher: (err: any) => unknown) {
	instance()._globalCatch = catcher
}

// TODO I don't think this is used or needed anywhere, so I'm not exporting this yet
function setCore<CoreObj = Record<string, any>>(coreObj: CoreObj) {}

export function usePlugin(instance: PlexusInstance, plugin: Plugin): void
export function usePlugin(instanceId: string, plugin: Plugin): void
export function usePlugin(
	instanceOrInstanceId: PlexusInstance | string,
	plugin: Plugin
) {
	// if (typeof instanceOrInstanceId === 'string') {
	// 	plugin.init((name) => instance({ id: name }))
	// }
	// instance()._plugins.set(plugin.name, plugin)
}

export {
	instance,
	batch,
	PlexusPlugin,
	PlexusScopeConfig as PlexusPluginConfig,
	createPlexusPlugin,
	PlexusInstance,
}
