// import { PlexusInstance, PxStateType } from '../interfaces';

import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";
import { _data, PlexusDataInstance } from "./data";
import { _group, PlexusCollectionGroup, PlexusCollectionGroupConfig, GroupName } from "./group";
import { PlexusCollectionSelector, _selector } from "./selector";

type GroupMap<DataType> = Map<GroupName, PlexusCollectionGroup<DataType>>

type KeyOfMap<T extends ReadonlyMap<unknown, unknown>> = T extends ReadonlyMap<infer K, unknown> ? K : never;


export interface PlexusCollectionInstance<DataType=any, Groups extends GroupMap<DataType>=GroupMap<DataType>, > {
	collect (data: DataType[], groups?: string[] | string): void
  collect (data: DataType, groups?: string[] | string): void
  // collect (data: DataType | DataType[], groups?: string[] | string): void
  createSelector (name: string): PlexusCollectionInstance<DataType>
  createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>): this & PlexusCollectionInstance<DataType, Map<Name, PlexusCollectionGroup<DataType>> >
  getItem(key: string | number): PlexusDataInstance<DataType>
  getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataType>
  addToGroups (key: string | number, groups: GroupName[] | GroupName): void
  getItemValue(key: string | number): DataType

  getGroupsOf(key: string | number): Array<string | number>

  persist(name?: string ): void
  update(key: string | number, data: Partial<DataType>, config?: {deep: boolean}): void
  get value(): DataType[]
  get groups(): Record<KeyOfMap<Groups>, PlexusDataInstance<DataType>[]>
  get groupsValue(): Record<KeyOfMap<Groups>, DataType[]> 
}
export interface PlexusCollectionConfig<DataType>{
  primaryKey?: string,
  // groups?: Record<string,  PlexusCollectionGroupConfig<DataType>>
}
export function _collection<DataType extends {[key: string]: any}, Groups extends GroupMap<DataType>=GroupMap<DataType>>(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType>={primaryKey: 'id'} as const) {
  const _internalStore = {
    _lookup: new Map<string, string>(),
    _key: _config?.primaryKey || 'id',
    _data: new Map<string | number, PlexusDataInstance<DataType>>(),
    _groups: new Map<GroupName, PlexusCollectionGroup<DataType>>() as Groups,
    _selectors: new Map<string, PlexusCollectionSelector<DataType>>(),
    _name: `_plexus_collection_${instance().genNonce()}`,
    _externalName: '',
    set externalName(value: string){this._externalName = value},
    _persist: false,

    set persist(value: boolean){this._persist = value},
  } as const
  

  // if(_config){
  //   if(_config.groups){
  //     for(let groupName in _config.groups){
  //       createGroup(groupName, _config.groups[groupName])
  //     }
  //   }
  // }

  const collection: PlexusCollectionInstance<DataType, Groups> =  {
    collect (data: DataType | DataType[], groups?: GroupName[] | GroupName) {
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
            this.addToGroups(item[_internalStore._key], groups)
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
          this.addToGroups(data[_internalStore._key], groups)
        }
      }
    },
    createSelector (name: string) {
      _internalStore._selectors.set(name, _selector(() => instance(), _internalStore._name))
      return this
    },
    createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>) {
      _internalStore._groups.set(groupName, _group(() => instance(), _internalStore._name, groupName, config))
      return this
    },
    

    update(key: string | number, data: Partial<DataType>, config: {deep: boolean}={deep: true}) {
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
      
    },
    addToGroups (key: string | number, groups: GroupName[] | GroupName) {
      if(groups){
        if(Array.isArray(groups)){
          for(let group in groups){
            _internalStore._groups.get(group as GroupName).add(key)
          }
        }
        else{
          _internalStore._groups.get(groups).add(key)
        }
      }
    },
    getItem(key: string | number){
      return _internalStore._data.get(key)
    },
    getItemValue(key: string | number){
      return this.getItem(key).value
    },
    getGroupsOf(key: string | number){
      const inGroups = []
      for(let group of _internalStore._groups){
        if(group[1].has(key)){
          inGroups.push(group[0])
        }
      }
      return inGroups
    },
  
    persist(name?: string ){
      // if there is a name, change the states internal name 
      if(name) _internalStore.externalName = `_plexus_state_${name}`

      if(instance().storage){ 
        instance().storage.set(_internalStore.externalName, _internalStore._data)
        _internalStore.persist = true
      }

    },

    getGroup(name: KeyOfMap<Groups> ) {
      return _internalStore._groups.get(name as string)
    },
    get value(){
      return Array.from(_internalStore._data.values()).map(item => item.value)
    },
    get groups(){
      const groups: Record<KeyOfMap<Groups>, PlexusDataInstance<DataType>[]> = {} as Record<KeyOfMap<typeof _internalStore._groups>, PlexusDataInstance<DataType>[]>
      // console.warn(_internalStore._groups)
      // for(let group of _internalStore._groups.keys()){
        
      //   if(groups[group] === undefined){
      //     groups[group] = []
      //   }
      //   for(let key of _internalStore._data.keys()){
      //     if(_internalStore._groups.get(group).has(key)){
      //       groups[group].push(_internalStore._data.get(key))
      //     }
      //   }
        
      // }
      for( let group of _internalStore._groups.entries()) {
        groups[group[0]] = group[1]
      }
      return groups
      
    },
    get groupsValue(){
      const groups: Record<KeyOfMap<Groups>, DataType[]> = {} as Record<KeyOfMap<Groups>, DataType[]>
      // console.warn(_internalStore._groups)
      // for(let group of _internalStore._groups.keys()){
        
      //   if(groups[group] === undefined){
      //     groups[group] = []
      //   }
      //   for(let key of _internalStore._data.keys()){
      //     if(_internalStore._groups.get(group).has(key)){
      //       groups[group].push(_internalStore._data.get(key).value)
      //     }
      //   }
        
      // }
      for( let group of _internalStore._groups.entries()) {
        groups[group[0]] = group[1].value
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