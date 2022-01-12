export interface PlexusInstance {
	ready: boolean;
	genNonce(): number | string;
	_states: Set<PxStateInstance>
	_computedStates: Set<any>,
	_collections: Set<any>,
	_settings: {}
}

export type PxStateInstance<Value=any> = {
	set(item: Value): void;
	patch(item: Value): void;
	watch(keyOrCallback: string | number | PxStateWathcer<Value>,  callback?: PxStateWathcer<Value>): void;
	removeWatcher(key: string|number): boolean
	undo(): void;
	reset(): void;

	value: Value;
	lastValue: Value;
} 
export type PxStateType = Object | Array<unknown> | string | number | boolean | null | undefined 
export type PxState = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PxStateInstance<PxStateValue>
export type PxStateWathcer<V> = (value: V) => void

export interface PlexStateInternalStore<Value> {
	_initialValue: Value
	_lastValue: Value | null
	_value: Value
	_nextValue: Value
	_watchers: Map<number | string, (value: Value) => void>
}

