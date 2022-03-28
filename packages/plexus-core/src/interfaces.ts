import { _event } from "./event"
import { _runtime } from "./runtime"

export type PlexusRuntime = ReturnType<typeof _runtime>
export type PlexusEvent = ReturnType<typeof _event>
export type PlexusWatcher<V extends any = any> = (value: V) => void

export type Watchable<V extends any=any> = { [key: string | number]: any } & {
	watch<V extends any = any>(callback: PlexusWatcher<V>): () => void
	name?: string
	key?: string | number | ((key: string) => unknown)
}

export type WatchableValue<V extends any = any> = Watchable & { value: V } & ({ set(value: V): void } | { select(value: V): void })

export const isWatchable = (value: any): value is Watchable => {
	return value && typeof value.watch === "function"
}
