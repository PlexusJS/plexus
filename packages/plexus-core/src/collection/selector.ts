import { PlexusInstance } from "../instance"
import { DataKey, PlexusDataInstance } from "./data"
export type SelectorName = string
export interface PlexusCollectionSelector<T extends {[key: string]: any}>{
	/**
	 * Select an item in the collection
	 * @param key The key to select
	 */
	select(key: DataKey)
	get value(): T | null
	get data(): PlexusDataInstance<T> | null
}

export function _selector<ValueType extends {[key: string]: any}>(instance: () => PlexusInstance, collectionId: string, ): PlexusCollectionSelector<ValueType>{
	const _internalStore = {
		_selected: null,
		_collectionId: collectionId,
	}
	
	return {
		select(key: DataKey){
			_internalStore._selected = key
		},
		get value(){
			if(_internalStore._selected !== null){
				return null
			}
			return instance()._collections.get(_internalStore._collectionId).getItemValue(_internalStore._selected)
		},
		get data(){
			if(_internalStore._selected !== null){
				return null
			}
			return instance()._collections.get(_internalStore._collectionId).getItem(_internalStore._selected)
		},

	}
}