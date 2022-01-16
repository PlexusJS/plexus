// import { PlexusInstance, PxStateType } from '../interfaces';

import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";

export interface PlexusCollectionInstance<DataType=any> {
	collect(data: DataType): void;
  createSelector (name: string)
  createGroup (name: string)
  getItem(key: string | number)
}
export interface PlexusCollectionConfig{
  primaryKey: string
}

export function collection<DataType extends any>(instance: () => PlexusInstance, config: PlexusCollectionConfig): PlexusCollectionInstance<DataType> {
  const _internalStore = {
    _lookup: new Map<string, string>(),
    _key: config?.primaryKey || 'id',
    _data: new Map<string | number, PlexusStateInstance<DataType>>(),
  }
  function collect (data: DataType[])
  function collect (data: DataType)
  function collect (data: DataType | DataType[]) {
    if(Array.isArray(data)) {
      for(let item of data) {
        _internalStore._data.set(item[_internalStore._key], state(item))
        // _internalStore._lookup.set(item[_internalStore._key], item[_internalStore._key])
      }
    } else {
      _internalStore._data.set(data[_internalStore._key], state(data))
      // _internalStore._lookup.set(data[_internalStore._key], data[_internalStore._key])
      
    }
  }
  function getItem(key: string | number){
    return _internalStore._data.get(key)
  }
  function getIteValue(key: string | number){
    return _internalStore._data.get(key).value
  }
  function createSelector (name: string) {

  }
  function createGroup (name: string) {
    
  }
  return {
    collect,
    createGroup,
    createSelector,
    getItem
  };
}