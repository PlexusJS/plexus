// import { PlexusInstance, PxStateType } from '../interfaces';

import { group } from "console";
import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";
import { _data, PlexusDataInstance, DataKey } from "./data";
import { _group, PlexusCollectionGroup, PlexusCollectionGroupConfig, GroupName } from "./group";
import { PlexusCollectionSelector, SelectorName, _selector } from "./selector";

type GroupMap<DataType> = Map<GroupName, PlexusCollectionGroup<DataType>>
type SelectorMap<DataType> = Map<SelectorName, PlexusCollectionSelector<DataType>>
type KeyOfMap<T extends ReadonlyMap<unknown, unknown>> = T extends ReadonlyMap<infer K, unknown> ? K : never;

export interface PlexusCollectionConfig<DataType>{
  primaryKey?: string,
}

/**
 * A Collection Instance
 */
export interface PlexusCollectionInstance<DataType=any, Groups extends GroupMap<DataType>=GroupMap<DataType>, Selectors extends SelectorMap<DataType>=SelectorMap<DataType> > {
  /**
   * 
   * @param data 
   * @param groups 
   */
	collect (data: DataType[], groups?: (string)[] | (string)): void
  collect (data: DataType, groups?: (string)[] | (string)): void
  /**
   * 
   * @param key 
   * @returns 
   */
  getItem(key: DataKey): PlexusDataInstance<DataType>
  /**
   * 
   * @param key 
   * @returns 
   */
  getItemValue(key: DataKey): DataType
  /**
   * 
   * @param groupName 
   * @param config 
   * @returns 
   */
  createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>): this & PlexusCollectionInstance<DataType, Map<Name, PlexusCollectionGroup<DataType>>, Selectors >
  /**
   * Get A Group instance of a given group name
   * @param name The Group Name to search for
   * @returns Group Instance | undefined
   */
  getGroup(name: string): undefined | PlexusCollectionGroup<DataType>
  getGroup(name: KeyOfMap<Groups>): PlexusCollectionGroup<DataType>
  /**
   * 
   * @param key 
   * @param groups 
   */
  addToGroups (key: DataKey, groups: GroupName[] | GroupName): void
  /**
   * 
   * @param key 
   * @returns 
   */
  getGroupsOf(key: DataKey): Array<KeyOfMap<Groups>>
  /**
   * 
   * @param name 
   * @returns 
   */
  createSelector<SelectorName extends GroupName>(name: SelectorName): this & PlexusCollectionInstance<DataType, Groups, Map<SelectorName, PlexusCollectionSelector<DataType>> >
  /**
   * Get A Group instance of a given group name
   * @param name The Group Name to search for
   * @returns Group Instance | undefined
   */
  getSelector(name: string): undefined | PlexusCollectionSelector<DataType>
  getSelector(name: KeyOfMap<Selectors>): PlexusCollectionSelector<DataType>
  /**
   * 
   * @param name 
   */
  persist(name?: string ): void
  /**
   * 
   * @param key 
   * @param data 
   * @param config 
   */
  update(key: DataKey, data: Partial<DataType>, config?: {deep: boolean}): void
  /**
   * Delete a data item completely from the collection.
   * @param keys The data key(s) to use for lookup 
   */
  delete(keys: DataKey | DataKey[]): void
  /**
   * Remove a data item from a set of groups
   * @param keys The data key(s) to use for lookup
   * @param groups Either a single group or an array of gorups to remove the data from 
   */
  remove(keys: DataKey | DataKey[], groups: KeyOfMap<Groups>[] | KeyOfMap<Groups>): void
  /**
   * Delete all data in the collection
   */
  clear(): void
  get value(): DataType[]
  get groups(): Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>> | Record<string, PlexusCollectionGroup<DataType>>
  get groupsValue(): Record<KeyOfMap<Groups>, DataType[]> 
}




export function _collection<DataType extends {[key: string]: any}, Groups extends GroupMap<DataType>=GroupMap<DataType>, Selectors extends SelectorMap<DataType>=SelectorMap<DataType>>(instance: () => PlexusInstance, _config: PlexusCollectionConfig<DataType>={primaryKey: 'id'} as const) {
  const _internalStore = {
    _lookup: new Map<string, string>(),
    _key: _config?.primaryKey || 'id',
    _data: new Map<DataKey, PlexusDataInstance<DataType>>(),
    _groups: new Map<GroupName, PlexusCollectionGroup<DataType>>() as Groups,
    _selectors: new Map<string, PlexusCollectionSelector<DataType>>(),
    _name: `_plexus_collection_${instance().genNonce()}`,
    _externalName: '',
    set externalName(value: string){this._externalName = value},
    _persist: false,

    set persist(value: boolean){this._persist = value},
  } 
  

  // if(_config){
  //   if(_config.groups){
  //     for(let groupName in _config.groups){
  //       createGroup(groupName, _config.groups[groupName])
  //     }
  //   }
  // }

  const isCreatedGroup = (name: string): name is KeyOfMap<Groups> => {
    return _internalStore._groups.has(name)
  } 
  const isCreatedSelector = (name: string): name is KeyOfMap<Selectors> => {
    return _internalStore._selectors.has(name)
  }
  
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
              const datainstance = _data(() => instance(), _internalStore._key, item)
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
          }
          // if there is no state for that key, create it
          else{
            const datainstance= _data(() => instance(), _internalStore._key, data)
            if(datainstance){
              _internalStore._data.set(data[_internalStore._key], datainstance)
            }
          }
          this.addToGroups(data[_internalStore._key], groups)
        }
      }
    },

    update(key: DataKey, data: Partial<DataType>, config: {deep: boolean}={deep: true}) {
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
    
    getItem(key: DataKey){
      return _internalStore._data.get(key)
    },
    
    getItemValue(key: DataKey){
      return this.getItem(key).value
    },

    createSelector (name: string) {
      _internalStore._selectors.set(name, _selector(() => instance(), _internalStore._name))
      return this as any
    },
    getSelector(name: KeyOfMap<Selectors> | string) {
      if(isCreatedSelector(name)){
        return _internalStore._selectors.get(name)
      } else {
        return undefined
      }
    },

    /// GROUPS
    createGroup<Name extends GroupName>(groupName: Name, config?: PlexusCollectionGroupConfig<DataType>) {
      _internalStore._groups.set(groupName, _group(() => instance(), _internalStore._name, groupName, config))
      // TODO: Fix this type issue
      // need to return any as it throws a type error with the getGroup function
      return this as any
    },
    getGroup(name: KeyOfMap<Groups> | string) {
      if(isCreatedGroup(name)){
        return _internalStore._groups.get(name)
      } else {
        return undefined
      }
    },
    getGroupsOf(key: DataKey){
      const inGroups: KeyOfMap<Groups>[] = []
      for(let group of _internalStore._groups){
        if(group[1].has(key)){
          inGroups.push(group[0] as KeyOfMap<Groups> )
        }
      }
      return inGroups
    },

    addToGroups (key: DataKey, groups: GroupName[] | GroupName) {
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
    
    
    persist(name?: string ){
      // if there is a name, change the states internal name 
      if(name) _internalStore.externalName = `_plexus_state_${name}`

      if(instance().storage){ 
        instance().storage.set(_internalStore.externalName, _internalStore._data)
        _internalStore.persist = true
      }

    },

    
    
    
    delete(keys: DataKey | DataKey[]){
      const rm  = (key)=> {
        _internalStore._data.get(key).delete()
        
        for(let groupName of this.getGroupsOf(key)){
          _internalStore._groups.get(groupName).remove(key)
        }
        _internalStore._data.delete(key)
      }
      if(Array.isArray(keys)){
        keys.forEach(rm)
      }else{
        rm(keys)
      }
    },
    
    remove(keys: DataKey | DataKey[], groups: KeyOfMap<Groups> | KeyOfMap<Groups>[]){
      const rm = (key)=> {
        if(Array.isArray(groups)){
          for(let groupName of this.getGroupsOf(key)){
            _internalStore._groups.get(groupName).remove(key)
          }
        }
      }
      if(Array.isArray(keys)){
        keys.forEach(rm)
      }else{
        rm(keys)
      }
      // if it's removed from all groups, delete the data entirely 
      // if(this.getGroupsOf(key).length === 0){
      //   this.delete(key)
      // }

    },
    
    clear(){
      this.delete(Array.from(_internalStore._data.keys()))

    },
    get value(){
      return Array.from(_internalStore._data.values()).map(item => item.value)
    },
    get groups(){
      const groups: Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>> = {} as Record<KeyOfMap<Groups>, PlexusCollectionGroup<DataType>>
      for( let group of _internalStore._groups.entries()) {
        groups[group[0]] = group[1]
      }
      return groups
      
    },
    get groupsValue(){
      const groups: Record<KeyOfMap<Groups>, DataType[]> = {} as Record<KeyOfMap<Groups>, DataType[]>
      for( let group of _internalStore._groups.entries()) {
        groups[group[0] as KeyOfMap<Groups>] = Array.from(group[1].index).map(key => _internalStore._data.get(key).value)
      }
      return groups
    }
  };


  // initalization //
	if (instance()._collections.has(_internalStore._name+"")) {
		instance()._collections.delete(_internalStore._name+"")
	}

	instance()._collections.set(_internalStore._name+"", collection)
  return collection
}