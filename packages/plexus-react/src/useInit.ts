import { PlexusAction, Watchable } from '@plexusjs/core';
import { FunctionType, InnerFunction } from '@plexusjs/core/dist/action';
import { useEffect, useState } from 'react';
import { usePlexus, PlexusValue, PlexusValueArray } from './usePlexus';

export type PlexusInitReturn<T> = {
  value: T;
  loading: boolean;
}

// Singleton argument
export function useInit<V extends Watchable, Fn extends FunctionType>(deps: V, action: InnerFunction<Fn>): PlexusInitReturn<PlexusValue<V>>
// array argument
export function useInit<V extends Watchable[], Fn extends FunctionType>(
	deps: V | [],
  action: InnerFunction<Fn>
): PlexusInitReturn<PlexusValueArray<V>>

export function useInit <Fn extends FunctionType> (deps: typeof usePlexus.arguments[0], action: InnerFunction<Fn>) {
  const value = usePlexus(deps);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    action().then(() => setLoading(false));
  }, [action])

  return {
    loading,
    value
  }
}