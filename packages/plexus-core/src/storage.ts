import { deepMerge, isObject } from './helpers';
import { PlexusInstance, PxStorageInstance } from './interfaces';

/**
 * 
 * @returns returns the localstorage if available, otherwise returns false
 */
const getLocalStorage = () => {
  try {
    const ls = window?.localStorage ? window.localStorage : localStorage;
    if (typeof ls.getItem !== 'function') return null;
    return ls;
  } catch (e) {
    return null;
  }
}

type AlmostAnything = string | number | symbol | Record<any, any> | Array<any>;
export type StorageOverride = {
  prefix: string,
  get(key: string): AlmostAnything | Promise<any>,
	set(key: string, value: any): AlmostAnything | Promise<any>,
	remove(key: string): void | Promise<void>,
	patch(key: string, value: any): AlmostAnything | Promise<any>,
}
// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage (instance: () => PlexusInstance, name?: string, override?: StorageOverride): PxStorageInstance {
  
  const getKey = (key: string) => `${_internalStore._prefix}${key}`
  
  const _internalStore = {
    _name: name || 'localStorage',
    _storage: getLocalStorage(),
    _prefix: override?.prefix || 'plexus-',
  }

  const get = (key: string): any => {
    // try to run with localstorage
    if (getLocalStorage() === null) return null;
    return getLocalStorage().getItem(getKey(key));
  }

  const set = (key: string, value: any): void => {
    // try to run with localstorage
    if (getLocalStorage() === null) return;
    if(isObject(value)){
     getLocalStorage().setItem(getKey(key), JSON.stringify(value))
    }
    else if(Array.isArray(value)){
      getLocalStorage().setItem(getKey(key), JSON.stringify(Object.values<typeof value>(value)))
    }
    else{
      getLocalStorage().setItem(getKey(key), String(value))
    }
  }

  const patch = (key: string, value: any): void => {
    // try to run with localstorage
    if (getLocalStorage() === null) return;
    if(isObject(value)){
     getLocalStorage().setItem(getKey(key), JSON.stringify(deepMerge(getLocalStorage().getItem(key), value)))
    }
    else if(Array.isArray(value)){
      getLocalStorage().setItem(getKey(key), JSON.stringify(Object.values<typeof value>(
        deepMerge(getLocalStorage().getItem(key), value)
      )))
    }
    else{
      getLocalStorage().setItem(getKey(key), String(value))
    }

  }
  const remove = (key: string): void => {
    // try to run with localstorage
    if (getLocalStorage() === null) return;
    getLocalStorage().removeItem(getKey(key));
  }

  
  const store = Object.freeze({
    get: override?.get || get,
    set: override?.set || set,
    remove: override?.remove || remove,
    patch: override?.patch || patch,
  })
  instance()._storages.set(name, store)
  return store
}