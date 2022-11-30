import { WatchableValue } from '@plexusjs/core'
import { PlexusValue, usePlexus } from './usePlexus'
/**
 * A React hook to extract the values from plexus objects and reactively update the component and value when the value changes. This hook returns an array, similar to that of React's useState. The arguments are similar to useState as well, it returns the current value and a function to update the value.
 * @param dep The Plexus dependency to watch
 * @returns [currentValue, Function] The current value and a function to update the value
 */
export function usePlexusState<V extends WatchableValue>(
  dep: V
): [PlexusValue<V>, (value: V) => void] {
  const value = usePlexus(dep)
  return [value, (nextValue) => dep.set(nextValue)]
}
