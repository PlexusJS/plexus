import { Watchable } from '@plexusjs/core';
import { useEffect } from 'react';

export function useWatcher <V = any> (watchable: Watchable<V>, callback: (value: V) => void): void {
  useEffect(() => {
    const unsub = watchable.watch(callback);
    return () => unsub();
  }, []);
}