import { _instance } from './instance'
import { PlexusInstance } from './interfaces'
import { _state } from './state'

const instance: PlexusInstance =  _instance()

export function state<Value=any>(item: Value) {
	return _state(() => _instance(), item)
}

export function setCore<CoreObj=Record<string, any>>(coreObj: CoreObj){

}