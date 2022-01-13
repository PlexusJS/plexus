import { _instance } from './instance'
import { PlexusPlugin } from './interfaces'
import { _state } from './state'

export function state<Value=any>(item: Value) {
	return _state(() => _instance(), item)
}

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}

export function usePlugin(plugin: PlexusPlugin){
	plugin.init(() => _instance())
	_instance()._plugins.set(plugin.name, plugin)
}