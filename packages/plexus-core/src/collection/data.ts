import { PlexusStateInstance, state } from "..";

export interface PlexusDataInstance<TypeValue> {
	get value(): TypeValue
	set(value: TypeValue, config?: {mode: 'set' | 'patch'}): void	
	get state(): PlexusStateInstance<TypeValue>
}

export function _data<Value extends Record<string, any>>(primaryKey: string, value: Value): PlexusDataInstance<Value> | null{
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
			set: (value: Partial<Value>, config: {mode: 'set' | 'patch'}={mode: 'set'}) => {
				const checkIfHasKey = () => value[_internalStore.primaryKey] !== undefined && value[_internalStore.primaryKey] === _internalStore._key
				if(config.mode === 'set'){
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
			}
		}
	}
	return null
}