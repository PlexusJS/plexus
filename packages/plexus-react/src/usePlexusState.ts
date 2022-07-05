import { Watchable, WatchableValue } from "@plexusjs/core"
import { PlexusValue, usePlexus } from "./usePlexus"
/**
 * A React hook to extract the values from plexus objects and reactively update the component and value when the value changes. This hook returns an array, similar to that of React's useState. The arguments are similar to useState as well, it returns the current value and a function to update the value.
 * @param deps
 * @returns
 */
export function usePlexusState<V extends WatchableValue>(deps: V): [PlexusValue<V>, (value: V) => void] {
	const value = usePlexus(deps)
	return [value, (nextValue) => deps.set(nextValue)]
}
