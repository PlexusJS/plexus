import { PlexusCollectionInstance } from "..";

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: DataType) => boolean
}
export type PlexusCollectionGroup = ReturnType<typeof group>
export function group<DataType=any>(name: string, config?: PlexusCollectionGroupConfig<DataType>){
	const _internalStore = {
		addWhen: config?.addWhen || (() => false),
		_name: name,
		_includedKeys: new Set<string|number>()
	}

	return {
		has( key: string | number ){
			return _internalStore._includedKeys.has(key)
		},
		add( key: string | number ){
			_internalStore._includedKeys.add(key)
		},
		remove( key: string | number ){
			_internalStore._includedKeys.delete(key)
		},
		get includedKeys(){
			return _internalStore._includedKeys
		}
	}
}