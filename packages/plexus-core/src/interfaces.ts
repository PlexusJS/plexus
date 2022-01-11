export interface PlexusInstance {
	_states: Set<PxState>
	_computedStates: Set<any>,
	_collections: Set<any>,
	_settings: {}
}

export type PxState<Value=any> = {
	set: (item: Value) => void,
	value: Value
} 
export type state = <PxStateValue=any>(instance: () => PlexusInstance, input: PxStateValue) => PxState<PxStateValue>

export interface PlexStateInternalStore<Value> {
	_value: Value
	_lastValue: Value
}

