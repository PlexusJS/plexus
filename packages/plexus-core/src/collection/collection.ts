// import { PlexusInstance, PxStateType } from '../interfaces';

import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";
import { _data, PlexusDataInstance } from "./data";
import { group, PlexusCollectionGroup, PlexusCollectionGroupConfig } from "./group";

export interface PlexusCollectionInstance<DataType=any> {
	collect (data: DataType[], groups?: string[] | string): void
  collect (data: DataType, groups?: string[] | string): void
  collect (data: DataType | DataType[], groups?: string[] | string): void
  createSelector (name: string)
  createGroup (name: string)
  getItem(key: string | number): PlexusDataInstance<DataType>
  getItemValue(key: string | number): DataType
  getGroupsOf(key: string | number): Array<string | number>
  get value(): DataType[]
  get groups(): Record<string, PlexusDataInstance<DataType>[]>
  get groupsValue(): Record<string, DataType[]> 
}
export interface PlexusCollectionConfig<DataType>{
  primaryKey?: string,
  groups?: {
    [key: string]: PlexusCollectionGroupConfig<DataType>
  }
}

export function _collection<DataType extends {[key: string]: any}>(instance: () => PlexusInstance, config: PlexusCollectionConfig<DataType>={primaryKey: 'id'}): PlexusCollectionInstance<DataType> {
  const _internalStore = {
    _lookup: new Map<string, string>(),
    _key: config?.primaryKey || 'id',
    _data: new Map<string | number, PlexusDataInstance<DataType>>(),
    _groups: new Map<string, PlexusCollectionGroup>(),
  }
  function collect (data: DataType[], groups?: string[] | string)
  function collect (data: DataType, groups?: string[] | string)
  function collect (data: DataType | DataType[], groups?: string[] | string) {
    
    if(Array.isArray(data)) {
      for(let item of data) {
        if(item[_internalStore._key] !== undefined && item[_internalStore._key] !== null){
          // if there is already a state for that key, update it
          if(_internalStore._data.has(item[_internalStore._key])){
            _internalStore._data.get(item[_internalStore._key]).set(item)
            // includeGroups(item[_internalStore._key])
          }
          // if there is no state for that key, create it
          else{
            const datainstance = _data(_internalStore._key, item)
            if(datainstance){
              _internalStore._data.set(item[_internalStore._key], datainstance)
            }
          }
          addToGroups(item[_internalStore._key], groups)
        }
      }
    } else {
      if(data[_internalStore._key] !== undefined && data[_internalStore._key] !== null){
        // if there is already a state for that key, update it
        if(_internalStore._data.has(data[_internalStore._key])){
          _internalStore._data.get(data[_internalStore._key]).set(data)
          // includeGroups(data[_internalStore._key])
        }
        // if there is no state for that key, create it
        else{
          const datainstance= _data(_internalStore._key, data)
          if(datainstance){
            _internalStore._data.set(data[_internalStore._key], datainstance)
          }
        }
        addToGroups(data[_internalStore._key], groups)
      }
    }
  }
  function addToGroups (key: string | number, groups: string[] | string) {
    if(groups){
      if(Array.isArray(groups)){
        for(let group in groups){
          _internalStore._groups.get(group).add(key)
        }
      }
      else{
        _internalStore._groups.get(groups).add(key)
      }
    }
  }
  function getItem(key: string | number){
    return _internalStore._data.get(key)
  }
  function getItemValue(key: string | number){
    return _internalStore._data.get(key).value
  }
  function getGroupsOf(key: string | number){
    const inGroups = []
    for(let group of _internalStore._groups){
      if(group[1].has(key)){
        inGroups.push(group[0])
      }
    }
    return inGroups
  }
  function createSelector (name: string) {

  }
  function createGroup (name: string, config?: PlexusCollectionGroupConfig<DataType>) {
    _internalStore._groups.set(name, group(name, config))
  }

  if(config){
    if(config.groups){
      for(let groupName in config.groups){
        createGroup(groupName, config.groups[groupName])
      }
    }
  }

  return {
    collect,
    createGroup,
    createSelector,
    getItem,
    getGroupsOf,
    getItemValue,
    get value(){
      return Array.from(_internalStore._data.values()).map(item => item.value)
    },
    get groups(){
      const groups: Record<string, PlexusDataInstance<DataType>[]> = {}
      console.warn(_internalStore._groups)
      for(let group of _internalStore._groups.keys()){
        
        if(groups[group] === undefined){
          groups[group] = []
        }
        for(let key of _internalStore._data.keys()){
          if(_internalStore._groups.get(group).has(key)){
            groups[group].push(_internalStore._data.get(key))
          }
        }
        
      }
      return groups
    },
    get groupsValue(){
      const groups: Record<string, DataType[]> = {}
      console.warn(_internalStore._groups)
      for(let group of _internalStore._groups.keys()){
        
        if(groups[group] === undefined){
          groups[group] = []
        }
        for(let key of _internalStore._data.keys()){
          if(_internalStore._groups.get(group).has(key)){
            groups[group].push(_internalStore._data.get(key).value)
          }
        }
        
      }
      return groups
    }
  };
}