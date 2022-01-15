import { instance } from './instance'
import { _state } from './state'
import { _event } from './event'
import {storage as _storage, StorageOverride} from './storage'
import { PlexusPlugin } from './plugin'

// export {PlexusStateInstance} from './interfaces'
export { PlexusStateInstance } from "./state";

export function state<Value=any>(item: Value) {
	return _state(() => instance(), item)
}
export function storage(name?: string, override?: StorageOverride){
	return _storage(() => instance(), name, override)
}
export function event<PayloadType=any>(){
	return _event<PayloadType>(() => instance())
}


export {route, PlexusRoute, PlexusRouteConfig} from './route' 
export {action, PlexusAction, PlexusActionHelpers} from './action'

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}

export function usePlugin(plugin: PlexusPlugin){
	plugin.init(() => instance())
	instance()._plugins.set(plugin.name, plugin)
}