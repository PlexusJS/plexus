import { PlexusInstance, PxStorageInstance } from './interfaces';

// storage func -> called from instance OR by integration -> hooks up to the instance
export function storage (instance: () => PlexusInstance): PxStorageInstance {
  const get = (key: string): any => {
    return 'pog';
  }
  const set = (key: string, value: any): void => {
    return;
  }
  const remove = (key: string): void => {
    return;
  }
  return {
    get,
    set,
    remove
  }
}