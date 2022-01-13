import { _runtime } from "./runtime";

export type PlexusRuntime = ReturnType<typeof _runtime>
export type PlexusPlugin = {
	name: string,
	version?: string,
	init: (instance: () => PlexusInstance) => void,
	
}
export interface PlexusInstance {
	ready: boolean;
	genNonce(): number | string;
	_states: Map<string, PxStateInstance>,
	_plugins: Map<string, PlexusPlugin>,
	_runtime: PlexusRuntime,
	_computedStates: Set<any>,
	_collections: Map<number | string, any>,
	_settings: {}
	storageEngine: string | undefined,
	_storages: Map<string, PxStorageInstance>;
	get storage(): PxStorageInstance;
}

export type PxStateInstance<Value=any> = {
	set(item: Value): void;
	patch(item: Value): void;
	watch(keyOrCallback: string | number | PxStateWatcher<Value>,  callback?: PxStateWatcher<Value>): string|number;
	removeWatcher(key: string|number): boolean
	undo(): void;
	reset(): void;
	persist(name?: string): void;
	value: Value;
	lastValue: Value;
	name: string | number;
	watchers: any
} 
export interface PlexStateInternalStore<Value> {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_nextValue: Value
	_watchers: Map<number | string, DestroyFn>
	_name: string | number
	externalName: string
}
export type PxStateType = Object | Array<unknown> | string | number | boolean | null | undefined 
export type PxState = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PxStateInstance<PxStateValue>
export type PxStateWatcher<V> = (value: V) => void

type DestroyFn = () => void




export interface PxCollectionInstance<DataType=any> {
	collect(data: DataType): void;
}

export interface PxStorageInstance {
	get(key: string): any;
	set(key: string, value: any): void;
	remove(key: string): void;
	patch(key: string, value: any): void;
}