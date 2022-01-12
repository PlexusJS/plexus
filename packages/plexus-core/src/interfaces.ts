export interface PlexusInstance {
	_states: Set<PxState>
	_computedStates: Set<any>,
	_collections: Set<any>,
	_settings: {}
}

export type PxState<Value=any> = {
	set: (item: Value) => void;
	value: Value;
	lastValue: Value;
} 
export type state = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PxState<PxStateValue>

export interface PlexStateInternalStore<Value> {
	_lastValue: Value | null
	_value: Value
	_nextValue: Value
	_watchers: Set<(value: Value) => void>
}

