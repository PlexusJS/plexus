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
type Override = {prefix: string}
// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage (instance: () => PlexusInstance, name?: string, override?: Override & PxStorageInstance): PxStorageInstance {
  
  const getKey = (key: string) => `${_internalStore._prefix}${key}`
  
  const _internalStore = {
    _name: name || 'localStorage',
    _storage: getLocalStorage(),
    _prefix: override?.prefix || 'plexus-',
  }

  const get = (key: string): any => {
    // if there is an override, use that
    if(override?.get) return override.get(key)

    // otherwise, try to run with localstorage
    if (getLocalStorage() === null) return null;
    return getLocalStorage().getItem(getKey(key));
  }

  const set = (key: string, value: any): void => {
    // if there is an override, use that
    if(override?.set) return override.set(key, value)

    // otherwise, try to run with localstorage
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
    // if there is an override, use that
    if(override?.patch) return override.patch(key, value)

    // otherwise, try to run with localstorage
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
    // if there is an override, use that
    if(override?.remove) return override.remove(key)

    // otherwise, try to run with localstorage
    if (getLocalStorage() === null) return;
    getLocalStorage().removeItem(getKey(key));
  }

  
  const store = {
    get,
    set,
    remove,
    patch
  }
  instance()._storages.set(name, store)
  return store
}