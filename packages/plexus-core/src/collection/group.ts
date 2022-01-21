import { PlexusCollectionInstance } from "..";
import { PlexusInstance } from "../instance";
import { DataKey, PlexusDataInstance } from "./data";

export interface PlexusCollectionGroupConfig<DataType> {
	addWhen?: (item: DataType) => boolean
}
export type GroupName = string
export interface PlexusCollectionGroup<DataType> {
	has( key: DataKey ): boolean,
	add( key: DataKey ): PlexusCollectionGroup<DataType>,
	remove( key: DataKey ): PlexusCollectionGroup<DataType>,
	get index(): Set<DataKey>
	get value(): DataType[]
	get data(): PlexusDataInstance<DataType>[]
}
export function _group<DataType=any>(instance: () => PlexusInstance, collectionId: string, name: string, config?: PlexusCollectionGroupConfig<DataType>){
	const _internalStore = {
		addWhen: config?.addWhen || (() => false),
		_name: name,
		_collectionId: collectionId,
		_includedKeys: new Set<string|number>()
	}

	return {
		has( key: DataKey ){
			return _internalStore._includedKeys.has(key)
		},
		add( key: DataKey ){
			_internalStore._includedKeys.add(key)
			return this as PlexusCollectionGroup<DataType>
		},
		remove( key: DataKey ){
			_internalStore._includedKeys.delete(key)
			return this as PlexusCollectionGroup<DataType>
		},
		get index(){
			return _internalStore._includedKeys
		},	
		get value(){
			return instance()._collections.get(_internalStore._collectionId).groupsValue[_internalStore._name]
		},
		get data(){
			return  Array.from(_internalStore._includedKeys).map(key => instance()._collections.get(_internalStore._collectionId).getItem(key)) 
		}
	}
}