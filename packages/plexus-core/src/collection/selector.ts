import { PlexusInstance } from "../instance"
import { DataKey, PlexusDataInstance } from "./data"
export type SelectorName = string
export interface PlexusCollectionSelector<T extends {[key: string]: any}>{
	/**
	 * The key of a data item assigned to this selecor
	 */
	get key(): DataKey 
	/**
	 * Select an item in the collection
	 * @param key The key to select
	 */
	select(key: DataKey)
	/**
	 * Return the data value of the selected item
	 */
	get value(): T | null
	/**
	 * The data of the selector
	 */
	get data(): PlexusDataInstance<T> | null
}

export function _selector<ValueType extends {[key: string]: any}>(instance: () => PlexusInstance, collectionId: string, name: string): PlexusCollectionSelector<ValueType>{
	const _internalStore = {
		_name: name,
		_key: null,
		_collectionId: collectionId,
	}
	
	return {
		get key(){ return _internalStore._key},
		select(key: DataKey){
			_internalStore._key = key
		},
		get value(){
			if(_internalStore._key === null){
				return null
			}
			return instance()._collections.get(_internalStore._collectionId).getItemValue(_internalStore._key)
		},
		get data(){
			if(_internalStore._key === null){
				return null
			}
			return instance()._collections.get(_internalStore._collectionId).getItem(_internalStore._key)
		},

	}
}