import { _instance } from './instance'
import { PlexusPlugin } from './interfaces'
import { _state } from './state'
import { _event } from './event'
import {storage as _storage, StorageOverride} from './storage'

export function state<Value=any>(item: Value) {
	return _state(() => _instance(), item)
}
export function storage(name?: string, override?: StorageOverride){
	return _storage(() => _instance(), name, override)
}
export function event<PayloadType=any>(){
	return _event<PayloadType>(() => _instance())
}


export {route, PlexusRoute, PlexusRouteConfig} from './route' 
export {action, PlexusAction, PlexusActionHelpers} from './action'

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}

export function usePlugin(plugin: PlexusPlugin){
	plugin.init(() => _instance())
	_instance()._plugins.set(plugin.name, plugin)
}