import { PlexusCollectionInstance } from "..";
import { PlexusInstance } from "../instance";

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: DataType) => boolean
}
export interface PlexusCollectionGroup<DataType> {
	has( key: string | number ): boolean,
	add( key: string | number ): PlexusCollectionGroup<DataType>,
	remove( key: string | number ): PlexusCollectionGroup<DataType>,
	get includedKeys(): Set<string | number>
	get value(): DataType[]

}
export function _group<DataType=any>(instance: () => PlexusInstance, collectionId: string, name: string, config?: PlexusCollectionGroupConfig<DataType>){
	const _internalStore = {
		addWhen: config?.addWhen || (() => false),
		_name: name,
		_collectionId: collectionId,
		_includedKeys: new Set<string|number>()
	}

	return {
		has( key: string | number ){
			return _internalStore._includedKeys.has(key)
		},
		add( key: string | number ){
			_internalStore._includedKeys.add(key)
			return this as PlexusCollectionGroup<DataType>
		},
		remove( key: string | number ){
			_internalStore._includedKeys.delete(key)
			return this as PlexusCollectionGroup<DataType>
		},
		get includedKeys(){
			return _internalStore._includedKeys
		},
		get value(){
			return instance()._collections.get(_internalStore._collectionId).groupsValue[_internalStore._name]
		}
	}
}