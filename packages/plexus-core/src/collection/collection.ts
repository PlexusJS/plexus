// import { PlexusInstance, PxStateType } from '../interfaces';

import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";
import { _data, PlexusDataInstance } from "./data";
import { _group, PlexusCollectionGroup, PlexusCollectionGroupConfig } from "./group";
import { PlexusCollectionSelector, _selector } from "./selector";

export interface PlexusCollectionInstance<DataType=any> {
	collect (data: DataType[], groups?: string[] | string): void
  collect (data: DataType, groups?: string[] | string): void
  collect (data: DataType | DataType[], groups?: string[] | string): void
  createSelector (name: string)
  createGroup (name: string)
  getItem(key: string | number): PlexusDataInstance<DataType>
  getGroup(name: string): PlexusCollectionGroup<DataType>
  getItemValue(key: string | number): DataType
  getGroupsOf(key: string | number): Array<string | number>
  persist(name?: string ): void
  update(key: string | number, data: Partial<DataType>, config?: {deep: boolean}): void
  get value(): DataType[]
  get groups(): Record<string, PlexusDataInstance<DataType>[]>
  get groupsValue(): Record<string, DataType[]> 
}
export interface PlexusCollectionConfig<DataType>{
  primaryKey?: string,
  groups?: Record<string,  PlexusCollectionGroupConfig<DataType>>
}

export function _collection<DataType extends {[key: string]: any}>(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType>={primaryKey: 'id'} as const): PlexusCollectionInstance<DataType> {
  const _internalStore = {
    _lookup: new Map<string, string>(),
    _key: _config?.primaryKey || 'id',
    _data: new Map<string | number, PlexusDataInstance<DataType>>(),
    _groups: new Map<string, PlexusCollectionGroup<DataType>>(),
    _selectors: new Map<string, PlexusCollectionSelector<DataType>>(),
    _name: `_plexus_collection_${instance().genNonce()}`,
    _externalName: '',
    set externalName(value: string){this._externalName = value},
    _persist: false,

    set persist(value: boolean){this._persist = value},
  } as const
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

  function update(key: string | number, data: Partial<DataType>, config: {deep: boolean}={deep: true}) {
    if(config.deep){
      if(_internalStore._data.has(key)){
        _internalStore._data.get(key).set({...data, [_internalStore._key]: key} as DataType, {mode: 'patch'})
      }
      else{
        console.warn('no data found for key', key)
      }
    }
    else{
      if(_internalStore._data.has(key)){
        _internalStore._data.get(key).set(data as DataType, {mode: 'set'})
      }
      else{
        console.warn('no data found for key', key)
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
    return getItem(key).value
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
    _internalStore._selectors.set(name, _selector(() => instance(), _internalStore._name))
  }
  function createGroup (name: string, config?: PlexusCollectionGroupConfig<DataType>) {
    _internalStore._groups.set(name, _group(() => instance(), _internalStore._name, name, config))
  }
  function persist(name?: string ){
		// if there is a name, change the states internal name 
		if(name) _internalStore.externalName = `_plexus_state_${name}`

		if(instance().storage){ 
			instance().storage.set(_internalStore.externalName, _internalStore._data)
			_internalStore.persist = true
		}

	}

  function getGroup(name: keyof typeof _config['groups']) {
    return _internalStore._groups.get(name)
  }

  if(_config){
    if(_config.groups){
      for(let groupName in _config.groups){
        createGroup(groupName, _config.groups[groupName])
      }
    }
  }

  const collection =  {
    collect,
    createGroup,
    createSelector,
    getItem,
    getGroupsOf,
    update,
    getGroup,
    getItemValue,
    persist,
    get value(){
      return Array.from(_internalStore._data.values()).map(item => item.value)
    },
    get groups(){
      const groups: Record<string, PlexusDataInstance<DataType>[]> = {}
      // console.warn(_internalStore._groups)
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
      // console.warn(_internalStore._groups)
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
  // initalization //
	if (instance()._collections.has(_internalStore._name+"")) {
		instance()._collections.delete(_internalStore._name+"")
	}
	// instance()._states.forEach(state_ => {
	// 	state_.name
	// })
	instance()._collections.set(_internalStore._name+"", collection)
  return collection
}