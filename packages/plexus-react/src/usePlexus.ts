import { instance, Watchable } from '@plexusjs/core'
import { isEqual, deepMerge } from '@plexusjs/utils/dist/shared'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import { concurrentWatch, convertThingToString, deepClone } from './utils'

const normalizeDeps = (deps: Watchable | Watchable[]) =>
  Array.isArray(deps) ? (deps as Watchable[]) : [deps as Watchable]

export type PlexusValue<T> = T extends Watchable<infer U> ? U : never
export type PlexusValueArray<T> = {
  [K in keyof T]: T[K] extends Watchable<infer U> ? U : never
}

// Singleton argument
export function usePlexus<V extends Watchable>(deps: V): PlexusValue<V>
// array argument
export function usePlexus<V extends Watchable[]>(
  deps: V | []
): PlexusValueArray<V>
/**
 * A React hook to extract the values from plexus objects and reactively update the component and value when the values change
 * @param deps A list of plexus watchable objects (ex. State, Group, Selector, Computed)
 * @returns The reactive values of the plexus objects
 */
export function usePlexus<V extends Watchable[]>(
  deps: V | [] | Watchable
): PlexusValue<V> | PlexusValueArray<V> {
  // if we are serverside, return
  // if (typeof window === "undefined") throw new Error("usePlexus is not supported on server-side yet.")
  const [_, set] = useState({})
  const id = useRef(
    Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
  )
  const returnArray = useRef<PlexusValueArray<V>>()
  const snapshot = useRef<string>()

  // TODO: Consider using unstable_batchedUpdates for batching updates to prevent unnecessary rerenders
  const subscribe = useCallback(
    (onChange: () => void) => {
      instance({ instanceId: 'react' }).runtime.log(
        'info',
        `Component subscribing to ${id.current}`
      )
      const depsArray = normalizeDeps(deps)
      return concurrentWatch(() => {
        instance({ instanceId: 'react' }).runtime.log(
          'info',
          `Re-rendering Component; Dependency (${depsArray
            .map((v) => v.id)
            .join(', ')}) updated to ${depsArray
            .map((v) => convertThingToString(v.value))
            .join(', ')}`
        )
        set({})
        onChange()
      }, depsArray)
    },
    [deps, _]
  )
  const fetchValues = useCallback(() => {
    const depsArray = normalizeDeps(deps)
    instance({ instanceId: 'react' }).runtime.log(
      'info',
      `${id.current} Fetching (${snapshot.current})`
    )

    // If this is the array syntax...
    const values = depsArray.map((dep) => dep.value!)
    const compSnapshot = convertThingToString(values)
    if (!snapshot.current) {
      snapshot.current = compSnapshot
    }
    // get the memoized array of values, if it's length does not match the deps length, then we need to update the array reference
    // if the array is not set
    if (!returnArray.current) {
      returnArray.current = values as PlexusValueArray<V>
    }
    // this means the array is already set, so here, we should clear the array (to keep the same reference) and then push the values to the array
    else {
      // fill the array with the values
      if (snapshot.current === compSnapshot) {
        // reset the array
        returnArray.current.length = 0
        returnArray.current.push(...(values as PlexusValueArray<V>))
      } else {
        returnArray.current = [...values] as PlexusValueArray<V>
      }
    }
    snapshot.current = compSnapshot

    // return the array and give it the correct type
    return returnArray.current
  }, [deps, _])

  if (Array.isArray(deps)) {
    return useSyncExternalStore(
      // Subscription callback
      subscribe,
      // GetValue callback
      fetchValues,
      () => fetchValues()
    )
  }
  return useSyncExternalStoreWithSelector(
    // Subscription callback
    subscribe,
    // GetValue callback
    fetchValues,
    () => fetchValues(),
    (v) => {
      v
      const val = v[0] as PlexusValue<V>
      return val
    },
    (a, b) => {
      return isEqual(a as any, b as any)
    }
  )
}
