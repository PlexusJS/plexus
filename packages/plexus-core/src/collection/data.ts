import { PlexusStateInstance, state } from "..";
import { PlexusInstance } from "../instance";

export interface PlexusDataInstance<TypeValue> {
	/**
	 * Get the value of the data instance
	 */
	get value(): TypeValue
	/**
	 * Set the value of the data instance
	 * @param value The value to set
	 * @param config The config to use when setting the value
	 * @param config.mode should we 'patch' or 'replace' the value
	 */
	set(value: TypeValue, config?: {mode: 'replace' | 'patch'}): void	
	/**
	 * The state that powers this data instance
	 */
	get state(): PlexusStateInstance<TypeValue>
	/**
	 * Delete the data instance
	 */
	delete(): void
}

export type DataKey = string | number;

export function _data<Value extends Record<string, any>>(instance: () => PlexusInstance, primaryKey: string, value: Value): PlexusDataInstance<Value> | null{
	const _internalStore =  {
		_key: value[primaryKey],
		primaryKey,
		_state: state<Value>(value)
	}

	if(value[primaryKey] !== undefined && value[primaryKey] !== null){	
		return {
			get value(){
				return _internalStore._state.value
			},
			set: (value: Partial<Value>, config: {mode: 'replace' | 'patch'}={mode: 'replace'}) => {
				const checkIfHasKey = () => value[_internalStore.primaryKey] !== undefined && value[_internalStore.primaryKey] === _internalStore._key
				if(config.mode === 'replace'){
					if(checkIfHasKey()){
						_internalStore._state.set(value as Value)
					}
				}
				else{
					if(value[_internalStore.primaryKey] === _internalStore._key){
						_internalStore._state.patch(value as Value)
					}
				}
				
			},
			get state(){
				return _internalStore._state
			},
			delete(){
				
				instance()._runtime.removeWatchers('state', _internalStore._state.name)
				instance()._states.delete(_internalStore._state.name)
				// delete _internalStore._state
				
			}
		}
	}
	return null
}