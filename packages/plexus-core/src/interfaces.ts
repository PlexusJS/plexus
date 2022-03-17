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

export type WatchableValue<V> = Watchable & {value: V}

export const isWatchable = (value: any): value is Watchable => {
	return value && typeof value.watch === "function"
}
// export type PlexusStateInstance<Value=any> = {
// 	set(item: Value): void;
// 	patch(item: Value): void;
// 	watch(keyOrCallback: string | number | PxStateWatcher<Value>,  callback?: PxStateWatcher<Value>): string|number;
// 	removeWatcher(key: string|number): boolean
// 	undo(): void;
// 	reset(): void;
// 	persist(name?: string): void;
// 	value: Value;
// 	lastValue: Value;
// 	name: string | number;
// 	watchers: any
// }
// export interface PlexStateInternalStore<Value> {
// 	_initialValue: Value
// 	_lastValue: Value | null
// 	_value: Value
// 	_nextValue: Value
// 	_watchers: Map<number | string, DestroyFn>
// 	_name: string | number
// 	_persist: boolean
// 	externalName: string
// }
// export type PxStateType = Object | Array<unknown> | string | number | boolean | null | undefined
// export type PxState = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PlexusStateInstance<PxStateValue>
// export type PxStateWatcher<V> = (value: V) => void

// type DestroyFn = () => void

// export interface PxCollectionInstance<DataType=any> {
// 	collect(data: DataType): void;
// }

// export interface PxStorageInstance {
// 	get(key: string): any;
// 	set(key: string, value: any): void;
// 	remove(key: string): void;
// 	patch(key: string, value: any): void;
// }
