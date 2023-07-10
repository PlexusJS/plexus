import { instance, PlexusInstance } from './instance/instance'
import { WatchableMutable } from './watchable'
import { PlexusScopeConfig } from './scope'

export { computed, _computed, PlexusComputedStateInstance } from './computed'
export { WatchableMutable, Watchable } from './watchable'

export {
	action,
	_action,
	FunctionType,
	PlexusAction,
	PlexusActionHooks,
} from './action'

export {
	preaction,
	_preaction,
	PlexusPreAction,
	PlexusPreActionConfig,
	PreActionInstance,
} from './preaction'

export {
	_collection,
	PlexusCollectionConfig,
	PlexusCollectionInstance,
	PlexusCollectionSelector,
	PlexusCollectionGroup,
} from './collection/collection'
export { event, _event, PlexusEventInstance } from './event'
export { storage, _storage, StorageOverride } from './storage'
export { PlexusScopeConfig, scope } from './scope'
import { PlexusPlugin, Plugin, createPlexusPlugin } from './plugin'

export { PlexusWatchableValueInterpreter } from '@plexusjs/utils'
export { state, _state, PlexusStateInstance, StateInstance } from './state'

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
	api,
	PlexusApi,
	PlexusApiConfig,
	PlexusApiRes,
	ApiInstance,
} from '@plexusjs/api'
export { gql } from './gql'

export {
	instance,
	PlexusPlugin,
	PlexusScopeConfig as PlexusPluginConfig,
	createPlexusPlugin,
	PlexusInstance,
	WatchableMutable as WatchableValue,
}
