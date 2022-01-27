
import { PlexusInstance } from "./instance";
import { PlexusStateType, _state, PlexusStateInstance } from "./state";
export interface PlexusComputedStateInstance<ValueType extends PlexusStateType > {
	persist(name: string): void;
	undo(): void;
	reset(): void;
	get value(): ValueType;	
	get lastValue(): ValueType;
	get name(): string;
}
export function _computed<StateValue extends PlexusStateType>(instance: () => PlexusInstance, computeFn: () => StateValue, deps: PlexusStateInstance[]){
	const _internalStore = {
		_state: _state(() => instance(), computeFn()),
	}

	// for each dependency, add a watcher to the state that will update the computed state when a dependency changes
	deps.forEach(dep => {
		dep.watch(() => {
			_internalStore._state.set(computeFn())
		})
	})
	return Object.freeze({
		persist(name: string){
			_internalStore._state.persist(name)
		},
		undo(){
			_internalStore._state.undo()
		},
		reset(){
			_internalStore._state.reset()
		},
		get value() {return _internalStore._state.value},
		get lastValue() {return _internalStore._state.lastValue},
		get name() {return _internalStore._state.name},
		
	} as PlexusComputedStateInstance<StateValue>)

}