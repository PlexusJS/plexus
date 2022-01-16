import { instance } from './instance'
import { _state } from './state'
import { _event } from './event'
import {storage as _storage, StorageOverride} from './storage'
import { PlexusPlugin, PlexusPluginConfig } from './plugin'
import { _collection } from './collection/collection'

// export {PlexusStateInstance} from './interfaces'
export { PlexusStateInstance } from "./state";
import { PlexusCollectionConfig, PlexusCollectionInstance } from './collection/collection';


/**
 * Generate a Plexus State
 * @param item The default value to use when we generate the state
 * @returns A Plexus State Instance
*/
function state<Value=any>(item: Value) {
	return _state(() => instance(), item)
}
export function storage(name?: string, override?: StorageOverride){
	return _storage(() => instance(), name, override)
}
export function event<PayloadType=any>(){
	return _event<PayloadType>(() => instance())
}

export function collection<Type extends {[key: string]: any}>(config?: PlexusCollectionConfig<Type>){
	return _collection<Type>(() => instance(), config)
}
export {
	state,
	PlexusPlugin,
	PlexusPluginConfig,
	PlexusCollectionConfig,
	PlexusCollectionInstance
}
export {route, PlexusRoute, PlexusRouteConfig} from './route' 
export {action, PlexusAction, PlexusActionHelpers} from './action'

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}

export function usePlugin(plugin: PlexusPlugin){
	plugin.init(() => instance())
	instance()._plugins.set(plugin.name, plugin)
}