import { _event } from "./event"
import { _runtime } from "./runtime"

export type PlexusRuntime = ReturnType<typeof _runtime>
export type PlexusEvent = ReturnType<typeof _event>
export type PlexusWatcher<V> = (value: V) => void

export type Watchable = { [key: string | number]: any } & {
	watch<V>(callback: PlexusWatcher<V>): () => void
	name?: string
	key?: string | ((key: string) => unknown)
}

export type WatchableValue<V = any> = Watchable & { value: V }

export const isWatchable = (value: any): value is Watchable => {
	return value && typeof value.watch === "function"
}
