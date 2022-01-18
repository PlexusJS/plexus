import { PlexusInstance } from "../instance"

export interface PlexusCollectionSelector<T>{
	select(key: string | number)
	get value(): T[]
}

export function _selector<ValueType>(instance: () => PlexusInstance, collectionId: string, ): PlexusCollectionSelector<ValueType>{
	const _internalStore = {
		_selected: null,
		_collectionId: collectionId,
	}
	function select(key: string | number){
		_internalStore._selected = key
	}
	return {
		select,
		get value(){
			if(_internalStore._selected !== null){
				return null
			}
			return instance()._collections.get(_internalStore._collectionId).getItemValue(_internalStore._selected)
		},

	}
}